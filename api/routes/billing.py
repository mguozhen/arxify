"""Billing — Stripe subscription + credit packs.

Plans:
- spark   ($0/mo) — 300 credits, 1 project active
- scholar ($39/mo) — 5,000 credits/mo, unlimited projects
- lab     ($99/mo) — 15,000 credits/mo, 3 seats, API access

Annual 15% off applied at Stripe price ID layer.
"""
from __future__ import annotations

import os
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from api.billing.stripe_client import (
    create_checkout_session,
    create_portal_session,
    handle_webhook,
)
from api.utils.session import current_user

router = APIRouter()


PlanCode = Literal["spark", "scholar", "lab"]


class CheckoutRequest(BaseModel):
    plan: PlanCode
    interval: Literal["month", "year"] = "month"


@router.post("/checkout")
def checkout(body: CheckoutRequest, user=Depends(current_user)):
    if not user:
        raise HTTPException(401)
    if body.plan == "spark":
        raise HTTPException(400, "Spark is free — no checkout needed")
    url = create_checkout_session(
        user_id=user["id"],
        user_email=user["email"],
        plan=body.plan,
        interval=body.interval,
    )
    return {"checkout_url": url}


@router.post("/portal")
def portal(user=Depends(current_user)):
    if not user:
        raise HTTPException(401)
    url = create_portal_session(user_id=user["id"])
    return {"portal_url": url}


@router.post("/webhook")
async def webhook(request: Request):
    """Stripe sends subscription events here. Updates `subscription` table +
    refreshes credit allowances on period rollover."""
    sig = request.headers.get("stripe-signature")
    body = await request.body()
    return handle_webhook(payload=body, signature=sig)
