"""Session helpers — validates a better-auth session cookie against Postgres.

For MVP we lean on shared Postgres: the Next.js app writes auth sessions via
better-auth into the `authSessions` table; this helper reads it. Avoids
maintaining a second auth implementation.
"""
from __future__ import annotations

import os
from typing import Optional

from fastapi import Request

# Placeholder. Real implementation queries Postgres `authSessions` table
# joined to `authUsers` to resolve a session_token cookie -> user record.


async def current_user(request: Request) -> Optional[dict]:
    cookie = request.cookies.get("arxify.session_token")
    if not cookie:
        return None
    # TODO: SELECT user_id, expires_at FROM auth_sessions WHERE token = $1
    #       JOIN auth_users ...
    # For now, return a stub for local dev when ARXIFY_DEV_USER is set:
    dev = os.environ.get("ARXIFY_DEV_USER")
    if dev:
        return {"id": "dev-user", "email": dev, "plan": "scholar", "credits_remaining": 5000}
    return None
