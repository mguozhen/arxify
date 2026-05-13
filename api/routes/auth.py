"""Auth — thin layer over better-auth session cookies.

The Next.js frontend handles signup/signin via better-auth directly; this
backend only validates the session by introspecting the cookie. Keeps a single
source of truth for users in the same Postgres.
"""
from fastapi import APIRouter, Depends, HTTPException, Request

from api.utils.session import current_user

router = APIRouter()


@router.get("/me")
def me(user=Depends(current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
