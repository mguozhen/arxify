"""Waitlist signup — pre-launch email collection."""
from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.utils.db import conn

router = APIRouter()
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class WaitlistSignup(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    context: str | None = Field(None, max_length=2000,
                                description="Optional: what you'd use arxify for")
    source: str | None = Field(None, max_length=80,
                               description="Where you heard about us (xiaohongshu, github, etc)")


class WaitlistResponse(BaseModel):
    ok: bool
    position: int  # your queue number


@router.post("/signup", response_model=WaitlistResponse)
def signup(body: WaitlistSignup):
    if not EMAIL_RE.match(body.email):
        raise HTTPException(400, "Invalid email")
    with conn() as c:
        try:
            cur = c.execute(
                "INSERT INTO waitlist (email, context, source) VALUES (?, ?, ?)",
                (body.email.lower(), body.context, body.source),
            )
            row_id = cur.lastrowid
        except Exception:
            # already on list — return existing position
            existing = c.execute(
                "SELECT id FROM waitlist WHERE email = ?", (body.email.lower(),)
            ).fetchone()
            row_id = existing["id"] if existing else 0
    return WaitlistResponse(ok=True, position=row_id)


@router.get("/count")
def count() -> dict:
    with conn() as c:
        n = c.execute("SELECT COUNT(*) AS n FROM waitlist").fetchone()["n"]
    return {"count": n}
