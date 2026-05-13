"""Waitlist signup + token-based status lookup.

MVP: no email-magic-link. Signup returns a per-user token; frontend stores
in localStorage; /dashboard uses it to fetch status. Easy to upgrade to
proper magic-link auth later.
"""
from __future__ import annotations

import re
import secrets

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.utils.db import conn

router = APIRouter()
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class WaitlistSignup(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    context: str | None = Field(None, max_length=2000)
    source: str | None = Field(None, max_length=80)


class WaitlistResponse(BaseModel):
    ok: bool
    position: int
    token: str  # client stores in localStorage for /dashboard lookup


class StatusResponse(BaseModel):
    email: str
    position: int
    total: int
    referred_count: int
    context: str | None
    source: str | None
    created_at: str


@router.post("/signup", response_model=WaitlistResponse)
def signup(body: WaitlistSignup):
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "Invalid email")
    with conn() as c:
        existing = c.execute(
            "SELECT id, token FROM waitlist WHERE email = ?", (email,)
        ).fetchone()
        if existing:
            token = existing["token"] or secrets.token_urlsafe(16)
            if not existing["token"]:
                c.execute("UPDATE waitlist SET token=? WHERE id=?", (token, existing["id"]))
            row_id = existing["id"]
        else:
            token = secrets.token_urlsafe(16)
            cur = c.execute(
                "INSERT INTO waitlist (email, context, source, token) VALUES (?, ?, ?, ?)",
                (email, body.context, body.source, token),
            )
            row_id = cur.lastrowid
    return WaitlistResponse(ok=True, position=row_id, token=token)


@router.get("/count")
def count() -> dict:
    with conn() as c:
        n = c.execute("SELECT COUNT(*) AS n FROM waitlist").fetchone()["n"]
    return {"count": n}


@router.get("/status", response_model=StatusResponse)
def status(token: str):
    with conn() as c:
        row = c.execute(
            "SELECT id, email, context, source, referred_count, created_at FROM waitlist WHERE token = ?",
            (token,),
        ).fetchone()
        if not row:
            raise HTTPException(404, "Token not found")
        total = c.execute("SELECT COUNT(*) AS n FROM waitlist").fetchone()["n"]
    return StatusResponse(
        email=row["email"],
        position=row["id"],
        total=total,
        referred_count=row["referred_count"],
        context=row["context"],
        source=row["source"],
        created_at=row["created_at"],
    )


@router.post("/refer")
def refer(token: str, referred_token: str | None = None) -> dict:
    """Increment referred_count when someone signs up via a referral link."""
    with conn() as c:
        c.execute(
            "UPDATE waitlist SET referred_count = referred_count + 1 WHERE token = ?",
            (token,),
        )
    return {"ok": True}
