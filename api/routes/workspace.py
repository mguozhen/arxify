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
    has_proposal: bool = False
    proposal_generated_at: str | None = None
    content_zh: dict | None = None
    content_en: dict | None = None


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

    def _hyp_row(h) -> Hypothesis:
        d = dict(h)
        d["has_proposal"] = bool(d.pop("proposal_json", None))
        d.pop("workspace_id", None)
        d.pop("created_at", None)
        # split bilingual content blob into content_zh / content_en
        ci = d.pop("content_i18n", None)
        d.pop("proposal_i18n", None)  # not needed in list view
        if ci:
            try:
                parsed = json.loads(ci)
                d["content_zh"] = parsed.get("zh")
                d["content_en"] = parsed.get("en")
            except Exception:
                pass
        return Hypothesis(**d)

    return WorkspaceFull(
        workspace=Workspace(**dict(ws_row)),
        hypotheses=[_hyp_row(h) for h in hyps],
        data_sources=[DataSource(**dict(d)) for d in dss],
        chat=[ChatMessage(**dict(m)) for m in chat],
    )


# ─── Hypothesis detail + proposal generation ─────────────────────────────

class ProposalSection(BaseModel):
    one_line_question: str
    why_top_tier: list[str]            # 3-5 bullets
    why_solvea_exclusive: list[str]    # 3-5 bullets
    experiment_design: dict             # {treatment_arms, randomization, duration}
    outcomes: dict                       # {primary: [...], secondary: [...]}
    pre_registered_hypotheses: list[dict]  # [{id, statement}]
    sample_size: dict                    # {per_arm, total, power, mde, weeks}
    implementation: dict                  # {engineering_days, ops, cost_usd}
    journal_targets: list[dict]          # [{tier, journal, reason}]
    theory_anchors: list[dict]           # [{theory, citation, role}]
    risks: list[dict]                    # [{risk, mitigation}]
    elevator_pitches: dict               # {lin, zhou, cai}


class HypothesisDetail(BaseModel):
    hypothesis: Hypothesis
    proposal: ProposalSection | None
    proposal_zh: ProposalSection | None = None
    proposal_en: ProposalSection | None = None
    raw_title: str
    raw_paradox: str
    raw_hypothesis: str
    raw_identification: str
    raw_theory_anchor: str
    raw_journal_target: str
    notes: str | None


@router.get("/hypotheses/{code}", response_model=HypothesisDetail)
def get_hypothesis(code: str, token: str):
    user = _user_from_token(token)
    with conn() as c:
        ws_row = c.execute(
            "SELECT id FROM workspaces WHERE owner_email=? LIMIT 1", (user["email"],)
        ).fetchone()
        if not ws_row:
            raise HTTPException(404, "No workspace")
        row = c.execute(
            "SELECT * FROM hypotheses WHERE workspace_id=? AND code=?",
            (ws_row["id"], code),
        ).fetchone()
    if not row:
        raise HTTPException(404, f"Hypothesis {code} not found")
    d = dict(row)
    proposal_json = d.pop("proposal_json", None)
    proposal_obj = None
    if proposal_json:
        try:
            proposal_obj = ProposalSection(**json.loads(proposal_json))
        except Exception:
            proposal_obj = None
    # bilingual proposal (translated blob)
    proposal_i18n = d.pop("proposal_i18n", None)
    proposal_zh = proposal_en = None
    if proposal_i18n:
        try:
            pi = json.loads(proposal_i18n)
            if pi.get("zh"):
                proposal_zh = ProposalSection(**pi["zh"])
            if pi.get("en"):
                proposal_en = ProposalSection(**pi["en"])
        except Exception:
            pass
    # split content_i18n for the Hypothesis sub-model
    ci = d.pop("content_i18n", None)
    if ci:
        try:
            cp = json.loads(ci)
            d["content_zh"] = cp.get("zh")
            d["content_en"] = cp.get("en")
        except Exception:
            pass
    d.pop("workspace_id", None)
    d.pop("created_at", None)
    d["has_proposal"] = bool(proposal_json)

    return HypothesisDetail(
        hypothesis=Hypothesis(**d),
        proposal=proposal_obj,
        proposal_zh=proposal_zh,
        proposal_en=proposal_en,
        raw_title=row["title"],
        raw_paradox=row["paradox"],
        raw_hypothesis=row["hypothesis"],
        raw_identification=row["identification"],
        raw_theory_anchor=row["theory_anchor"],
        raw_journal_target=row["journal_target"],
        notes=row["notes"],
    )


GENERATE_PROPOSAL_PROMPT = """You are helping Hunter (郭振, HKU DBA candidate) expand a one-paragraph research direction into a full proposal slide deck, following his established 开题报告 (proposal) framework. The output will become a 13-slide deck for advisor meetings.

EXISTING DATA FOR THIS DIRECTION:
- Code: {code}
- Title: {title}
- Paradox: {paradox}
- Hypothesis: {hypothesis}
- Identification: {identification}
- Theory anchor: {theory_anchor}
- Journal target: {journal_target}
- Feasibility (6mo): {feasibility_6mo}/5
- A/B difficulty: {ab_test_difficulty}/5  (1=easiest A/B, 5=cannot A/B)
- Notes: {notes}

HUNTER'S CONTEXT:
- 11 data sources (Solvea/VOC.ai production lake: 1.9B conversations, 8.7M handoffs)
- Three advisors:
  - Chen LIN (HKU primary, corporate finance / law-and-finance, values identification rigor + business framing)
  - Li-An ZHOU (PKU, institutional economics / promotion tournament theory, values mechanism + identification)
  - Jing CAI (UMD, J-PAL Firms co-chair, values field RCT + firm-level economic outcomes)
- 6-month timeline, Nov 2026 defense

Produce a JSON object with this exact schema (Hunter's proposal framework):

{{
  "one_line_question": "Single sentence framing the research question (Chinese is fine)",
  "why_top_tier": [
    "3-5 bullet points explaining why this is a top-tier journal contribution"
  ],
  "why_solvea_exclusive": [
    "3-5 bullet points explaining why only Solvea's data can answer this (data uniqueness)"
  ],
  "experiment_design": {{
    "approach": "RCT / Natural experiment / Observational DID / hybrid",
    "treatment_arms": ["arm 1 description", "arm 2 description", ...],
    "randomization_unit": "ticket / lead / tenant / agent / etc",
    "randomization_logic": "how randomization is implemented",
    "duration_weeks": 6
  }},
  "outcomes": {{
    "primary": ["primary outcome with operational definition"],
    "secondary": ["secondary outcomes"],
    "mediators": ["mechanism variables"]
  }},
  "pre_registered_hypotheses": [
    {{"id": "H1", "statement": "...", "direction": "positive/negative/inverted-U"}},
    {{"id": "H2", "statement": "..."}}
  ],
  "sample_size": {{
    "per_arm": 5000,
    "total": 25000,
    "power": 0.8,
    "alpha": 0.05,
    "mde": "minimum detectable effect description",
    "weeks_to_collect": 6
  }},
  "implementation": {{
    "engineering_days": "1-5",
    "ops_steps": ["step 1", "step 2"],
    "cost_usd": "< $200 in compute + LLM cost",
    "dependencies": ["what we need from Solvea ops team"]
  }},
  "journal_targets": [
    {{"tier": "primary", "journal": "MISQ", "reason": "why this journal"}},
    {{"tier": "backup", "journal": "...", "reason": "..."}}
  ],
  "theory_anchors": [
    {{"theory": "Theory name", "citation": "Author Year, Journal", "role": "primary / extension / contrast"}}
  ],
  "risks": [
    {{"risk": "specific risk", "mitigation": "specific fix", "severity": "high/medium/low"}}
  ],
  "elevator_pitches": {{
    "lin": "30-second pitch tailored for Prof Chen Lin (Chinese, focus on identification + business)",
    "zhou": "30-second pitch tailored for Prof Li-An Zhou (Chinese, focus on mechanism + institutional)",
    "cai": "30-second pitch tailored for Prof Jing Cai (English or Chinese, focus on RCT + firm outcomes)"
  }}
}}

Be specific. Use real numbers (sample size, weeks, cost). Use real journal names. Tailor pitches to each advisor's expertise. JSON only, no prose outside.
"""


@router.post("/hypotheses/{code}/generate-proposal", response_model=HypothesisDetail)
async def generate_proposal(code: str, token: str, force: bool = False):
    user = _user_from_token(token)
    with conn() as c:
        ws_row = c.execute(
            "SELECT id FROM workspaces WHERE owner_email=? LIMIT 1", (user["email"],)
        ).fetchone()
        if not ws_row:
            raise HTTPException(404, "No workspace")
        row = c.execute(
            "SELECT * FROM hypotheses WHERE workspace_id=? AND code=?",
            (ws_row["id"], code),
        ).fetchone()
        if not row:
            raise HTTPException(404, "Hypothesis not found")

    if row["proposal_json"] and not force:
        # already cached — return existing
        return get_hypothesis(code, token)

    prompt = GENERATE_PROPOSAL_PROMPT.format(
        code=row["code"], title=row["title"], paradox=row["paradox"],
        hypothesis=row["hypothesis"], identification=row["identification"],
        theory_anchor=row["theory_anchor"], journal_target=row["journal_target"],
        feasibility_6mo=row["feasibility_6mo"], ab_test_difficulty=row["ab_test_difficulty"],
        notes=row["notes"] or "(none)",
    )

    text = await _call_claude_chat(
        system_prompt="You are a top-tier IS/Mgmt/Mark research methodologist. Output JSON only.",
        history=[{"role": "user", "content": prompt}],
        max_tokens=8000,
    )
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        parsed = json.loads(text)
        ProposalSection(**parsed)  # validate
    except Exception as e:
        raise HTTPException(502, f"Claude returned non-conforming JSON: {e}: {text[:300]}")

    with conn() as c:
        c.execute(
            "UPDATE hypotheses SET proposal_json=?, proposal_generated_at=datetime('now') WHERE id=?",
            (json.dumps(parsed, ensure_ascii=False), row["id"]),
        )
    return get_hypothesis(code, token)


# ─── Chat ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    token: str
    message: str = Field(..., min_length=1, max_length=8000)


class ChatResponse(BaseModel):
    user_message: ChatMessage
    assistant_message: ChatMessage


async def _call_claude_chat(system_prompt: str, history: list[dict], max_tokens: int = 2000) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    base_url = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
    if not api_key:
        # Fallback: flatkey provides an Anthropic-shape proxy at api.flatkey.ai/v1/messages
        flatkey = os.environ.get("FLATKEY_API_KEY")
        if flatkey:
            api_key = flatkey
            base_url = os.environ.get("ANTHROPIC_BASE_URL", "https://api.flatkey.ai")
        else:
            raise HTTPException(503, "No LLM key — set ANTHROPIC_API_KEY or FLATKEY_API_KEY")
    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            f"{base_url}/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
                "max_tokens": max_tokens,
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
