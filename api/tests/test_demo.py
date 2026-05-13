"""Demo endpoint tests — hit real Claude through flatkey, so slow & needs key.

Skip if ANTHROPIC_API_KEY isn't set."""
import os

import pytest

needs_key = pytest.mark.skipif(
    not os.environ.get("ANTHROPIC_API_KEY"),
    reason="ANTHROPIC_API_KEY not set",
)

SAMPLE_CONTEXT = (
    "I study LLM customer service. We have 1.9B conversations and 8.7M handoff "
    "events across 280 tenants. Want a 6-month feasible direction targeting "
    "Management Science or MISQ, with easy A/B."
)


@needs_key
def test_ideation_returns_5_ideas(client):
    r = client.post(
        "/api/demo/ideation",
        json={"input": SAMPLE_CONTEXT},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    assert len(d["ideas"]) == 5
    for idea in d["ideas"]:
        for k in (
            "title", "paradox", "hypothesis", "identification",
            "theory_anchor", "journal_target",
            "feasibility_6mo", "ab_test_difficulty",
        ):
            assert k in idea, f"missing {k}"
        assert 1 <= idea["feasibility_6mo"] <= 5
        assert 1 <= idea["ab_test_difficulty"] <= 5


def test_ideation_rejects_short_input(client):
    r = client.post("/api/demo/ideation", json={"input": "too short"})
    assert r.status_code == 422  # pydantic min_length=20


@needs_key
def test_critique_returns_verdict(client):
    r = client.post(
        "/api/demo/critique",
        json={
            "title": "The Handoff Paradox",
            "paradox": "Faster handoffs reduce satisfaction.",
            "hypothesis": "Customers handed off in <30s rate lower than 60-120s.",
            "identification": "DID using a platform-wide handoff threshold change.",
            "theory_anchor": "Buell-Norton 2011, Mgmt Sci.",
            "journal_target": "MISQ",
        },
        timeout=90,
    )
    assert r.status_code == 200, r.text
    c = r.json()
    assert 1 <= c["novelty_score"] <= 10
    assert c["verdict"] in ("ACCEPT", "MAJOR_REVISION", "REJECT")
    assert len(c["top_weaknesses"]) >= 1
    assert len(c["missing_anchors"]) >= 1
    assert isinstance(c["reviewer2_kill_shot"], str) and len(c["reviewer2_kill_shot"]) > 20
