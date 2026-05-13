"""Stripe Billing — Checkout + Customer Portal + webhook handling.

Plans (mapped to Stripe Price IDs via env):
- scholar / month  -> STRIPE_PRICE_SCHOLAR_MONTHLY
- scholar / year   -> STRIPE_PRICE_SCHOLAR_YEARLY
- lab / month      -> STRIPE_PRICE_LAB_MONTHLY
- lab / year       -> STRIPE_PRICE_LAB_YEARLY

Webhook events handled:
- checkout.session.completed       -> create/upgrade subscription, grant credits
- customer.subscription.updated    -> handle plan changes, downgrades
- customer.subscription.deleted    -> revert to spark
- invoice.payment_succeeded        -> period rollover, grant fresh credits
"""
from __future__ import annotations

import os
from typing import Literal

# `pip install stripe`. Lazy-import so the module loads without the dep.
try:
    import stripe
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
except ImportError:  # pragma: no cover
    stripe = None  # type: ignore


PRICE_MAP = {
    ("scholar", "month"): "STRIPE_PRICE_SCHOLAR_MONTHLY",
    ("scholar", "year"): "STRIPE_PRICE_SCHOLAR_YEARLY",
    ("lab", "month"): "STRIPE_PRICE_LAB_MONTHLY",
    ("lab", "year"): "STRIPE_PRICE_LAB_YEARLY",
}

PLAN_CREDITS = {
    "spark": 300,
    "scholar": 5000,
    "lab": 15000,
}


def create_checkout_session(*, user_id: str, user_email: str,
                            plan: Literal["scholar", "lab"],
                            interval: Literal["month", "year"]) -> str:
    if not stripe:
        raise RuntimeError("stripe package not installed")
    price_id = os.environ.get(PRICE_MAP[(plan, interval)])
    if not price_id:
        raise RuntimeError(f"Missing env var {PRICE_MAP[(plan, interval)]}")
    base = os.environ.get("WEB_ORIGIN", "http://localhost:3000")
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        customer_email=user_email,
        client_reference_id=user_id,
        success_url=f"{base}/dashboard?welcome=1",
        cancel_url=f"{base}/pricing",
        metadata={"user_id": user_id, "plan": plan},
    )
    return session.url


def create_portal_session(*, user_id: str) -> str:
    if not stripe:
        raise RuntimeError("stripe package not installed")
    # TODO: look up stripe_customer_id for this user
    customer_id = "<customer_id>"
    base = os.environ.get("WEB_ORIGIN", "http://localhost:3000")
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{base}/dashboard",
    )
    return session.url


def handle_webhook(*, payload: bytes, signature: str | None) -> dict:
    if not stripe:
        return {"received": False, "error": "stripe not installed"}
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    try:
        event = stripe.Webhook.construct_event(payload, signature, secret)
    except Exception as e:
        return {"received": False, "error": str(e)}

    if event.type == "checkout.session.completed":
        # TODO: upsert subscription row, set credits_remaining = PLAN_CREDITS[plan]
        pass
    elif event.type == "invoice.payment_succeeded":
        # TODO: monthly rollover -> add credits
        pass
    elif event.type == "customer.subscription.deleted":
        # TODO: downgrade to spark
        pass
    return {"received": True}
