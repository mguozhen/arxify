"""Workspace + chat endpoints for the admin-seeded demo content."""
from __future__ import annotations

import json
import os
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.utils.db import conn

router = APIRouter()


# ─── Models ──────────────────────────────────────────────────────────────

class Workspace(BaseModel):
    id: int
    owner_email: str
    title: str
    description: str | None
    created_at: str


class Hypothesis(BaseModel):
    id: int
    code: str
    title: str
    paradox: str
    hypothesis: str
    identification: str
    theory_anchor: str
    journal_target: str
    feasibility_6mo: int
    ab_test_difficulty: int
    status: str
    notes: str | None


class DataSource(BaseModel):
    id: int
    name: str
    kind: str
    description: str | None
    stats: str | None
    notes: str | None


class ChatMessage(BaseModel):
    id: int
    role: Literal["user", "assistant", "system"]
    content: str
    model: str | None
    created_at: str


class WorkspaceFull(BaseModel):
    workspace: Workspace
    hypotheses: list[Hypothesis]
    data_sources: list[DataSource]
    chat: list[ChatMessage]


# ─── Helpers ──────────────────────────────────────────────────────────────

def _user_from_token(token: str) -> dict:
    with conn() as c:
        row = c.execute(
            "SELECT id, email, is_admin FROM waitlist WHERE token = ?", (token,)
        ).fetchone()
    if not row:
        raise HTTPException(401, "Bad token")
    return {"id": row["id"], "email": row["email"], "is_admin": bool(row["is_admin"])}


# ─── Routes ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=WorkspaceFull)
def get_my_workspace(token: str):
    user = _user_from_token(token)
    with conn() as c:
        ws_row = c.execute(
            "SELECT id, owner_email, title, description, created_at FROM workspaces WHERE owner_email = ? ORDER BY id LIMIT 1",
            (user["email"],),
        ).fetchone()
        if not ws_row:
            raise HTTPException(404, "No workspace yet — admin needs to seed one")
        ws_id = ws_row["id"]
        hyps = c.execute(
            "SELECT * FROM hypotheses WHERE workspace_id=? ORDER BY id", (ws_id,)
        ).fetchall()
        dss = c.execute(
            "SELECT * FROM data_sources WHERE workspace_id=? ORDER BY id", (ws_id,)
        ).fetchall()
        chat = c.execute(
            "SELECT * FROM chat_messages WHERE workspace_id=? AND role != 'system' ORDER BY id",
            (ws_id,),
        ).fetchall()

    return WorkspaceFull(
        workspace=Workspace(**dict(ws_row)),
        hypotheses=[Hypothesis(**dict(h)) for h in hyps],
        data_sources=[DataSource(**dict(d)) for d in dss],
        chat=[ChatMessage(**dict(m)) for m in chat],
    )


# ─── Chat ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    token: str
    message: str = Field(..., min_length=1, max_length=8000)


class ChatResponse(BaseModel):
    user_message: ChatMessage
    assistant_message: ChatMessage


async def _call_claude_chat(system_prompt: str, history: list[dict]) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    base_url = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
    if not api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY not set")
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{base_url}/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-5-20250929",
                "max_tokens": 2000,
                "system": system_prompt,
                "messages": history,
            },
        )
    if resp.status_code != 200:
        raise HTTPException(502, f"Claude error {resp.status_code}: {resp.text[:300]}")
    return resp.json()["content"][0]["text"]


def _build_context_block(ws_id: int) -> str:
    """Inject hypotheses + data sources as additional system context per chat."""
    with conn() as c:
        hyps = c.execute(
            "SELECT code, title, paradox, status, journal_target, feasibility_6mo "
            "FROM hypotheses WHERE workspace_id=? ORDER BY id", (ws_id,)
        ).fetchall()
        dss = c.execute(
            "SELECT name, kind, stats FROM data_sources WHERE workspace_id=? ORDER BY id",
            (ws_id,),
        ).fetchall()
    lines = ["", "=== CURRENT 17 RESEARCH DIRECTIONS ==="]
    for h in hyps:
        lines.append(
            f"[{h['code']}] {h['title']} — status:{h['status']} → {h['journal_target']} (feasibility {h['feasibility_6mo']}/5)"
        )
        lines.append(f"  paradox: {h['paradox']}")
    lines.append("")
    lines.append("=== DATA SOURCES ===")
    for d in dss:
        lines.append(f"[{d['kind']}] {d['name']} — {d['stats']}")
    return "\n".join(lines)


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    user = _user_from_token(body.token)
    with conn() as c:
        ws_row = c.execute(
            "SELECT id FROM workspaces WHERE owner_email = ? ORDER BY id LIMIT 1",
            (user["email"],),
        ).fetchone()
        if not ws_row:
            raise HTTPException(404, "No workspace")
        ws_id = ws_row["id"]

        # Load full history (system + user + assistant)
        rows = c.execute(
            "SELECT role, content FROM chat_messages WHERE workspace_id=? ORDER BY id",
            (ws_id,),
        ).fetchall()

    system_prompt = next((r["content"] for r in rows if r["role"] == "system"), "")
    system_prompt += "\n\n" + _build_context_block(ws_id)

    history = [{"role": r["role"], "content": r["content"]}
               for r in rows if r["role"] in ("user", "assistant")]
    history.append({"role": "user", "content": body.message})

    reply = await _call_claude_chat(system_prompt, history)

    with conn() as c:
        cur = c.execute(
            "INSERT INTO chat_messages (workspace_id, role, content, model) VALUES (?, 'user', ?, NULL)",
            (ws_id, body.message),
        )
        user_msg_id = cur.lastrowid
        cur = c.execute(
            "INSERT INTO chat_messages (workspace_id, role, content, model) VALUES (?, 'assistant', ?, 'claude-sonnet-4-5')",
            (ws_id, reply),
        )
        asst_msg_id = cur.lastrowid
        user_row = c.execute(
            "SELECT * FROM chat_messages WHERE id=?", (user_msg_id,)
        ).fetchone()
        asst_row = c.execute(
            "SELECT * FROM chat_messages WHERE id=?", (asst_msg_id,)
        ).fetchone()

    return ChatResponse(
        user_message=ChatMessage(**dict(user_row)),
        assistant_message=ChatMessage(**dict(asst_row)),
    )


# Hypothesis edits — for demo flexibility
class HypothesisUpdate(BaseModel):
    token: str
    notes: str | None = None
    status: str | None = None
    feasibility_6mo: int | None = None
    ab_test_difficulty: int | None = None


@router.patch("/hypotheses/{hyp_id}")
def update_hypothesis(hyp_id: int, body: HypothesisUpdate):
    user = _user_from_token(body.token)
    if not user["is_admin"]:
        raise HTTPException(403, "Admin only")
    fields = []
    values = []
    for k in ("notes", "status", "feasibility_6mo", "ab_test_difficulty"):
        v = getattr(body, k)
        if v is not None:
            fields.append(f"{k}=?")
            values.append(v)
    if not fields:
        return {"ok": True, "changed": 0}
    values.append(hyp_id)
    with conn() as c:
        c.execute(f"UPDATE hypotheses SET {', '.join(fields)} WHERE id=?", values)
    return {"ok": True, "changed": len(fields)}
