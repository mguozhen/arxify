"""Auth — email+password login + better-auth session passthrough."""
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from api.utils.db import conn
from api.utils.passwords import verify_password
from api.utils.session import current_user

router = APIRouter()

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@router.get("/me")
def me(user=Depends(current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=1, max_length=200)


class LoginResponse(BaseModel):
    ok: bool
    token: str
    email: str
    is_admin: bool


class AdminMagicRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)


@router.post("/admin-magic", response_model=LoginResponse)
def admin_magic(body: AdminMagicRequest):
    """Email-only login for admin accounts (localhost convenience shortcut).

    Returns 401 unless the email exists in waitlist AND is_admin=1.
    Non-admin emails must use the standard email+password /login flow.
    """
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "Invalid email")
    with conn() as c:
        row = c.execute(
            "SELECT email, token, is_admin FROM waitlist WHERE email = ?",
            (email,),
        ).fetchone()
    if not row or not row["is_admin"]:
        raise HTTPException(401, "Not an admin account")
    return LoginResponse(
        ok=True,
        token=row["token"],
        email=row["email"],
        is_admin=True,
    )


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "Invalid email")
    with conn() as c:
        row = c.execute(
            """SELECT id, email, token, is_admin, password_hash, password_salt
               FROM waitlist WHERE email = ?""",
            (email,),
        ).fetchone()
    if not row or not row["password_hash"]:
        raise HTTPException(401, "Invalid email or password")
    if not verify_password(body.password, row["password_hash"], row["password_salt"]):
        raise HTTPException(401, "Invalid email or password")
    return LoginResponse(
        ok=True,
        token=row["token"],
        email=row["email"],
        is_admin=bool(row["is_admin"]),
    )
