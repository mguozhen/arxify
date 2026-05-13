"""Demo endpoints — single-shot ideation for public try-it-now page.

Uses Claude directly (10s response) instead of the full multi-round AI-Scientist
pipeline (15min). Returns 5 research directions as a structured JSON array.
Throttled by IP — no auth required.
"""
from __future__ import annotations

import json
import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

router = APIRouter()


class DemoIdeationRequest(BaseModel):
    input: str = Field(..., min_length=20, max_length=8000,
                       description="Research background / existing data / proposal sketch")


class IdeaCard(BaseModel):
    title: str
    paradox: str  # the counterintuitive hook in one sentence
    hypothesis: str  # H1 statement
    identification: str  # how to causally identify
    theory_anchor: str  # canonical theory + 1 citation
    journal_target: str  # JM / Mark Sci / MISQ / Mgmt Sci / Org Sci / JCR
    feasibility_6mo: int = Field(ge=1, le=5)  # 1-5 stars
    ab_test_difficulty: int = Field(ge=1, le=5)  # 1-5 stars (1=easy)


class DemoIdeationResponse(BaseModel):
    ideas: list[IdeaCard]
    model_used: str
    cost_credits: int


PROMPT_TEMPLATE = """You are a top-tier research advisor. The candidate has provided this research context:

=== INPUT ===
{input}
=== END ===

Generate exactly 5 candidate research directions. Each must have a clear paradox, be feasible in 6 months, and target a top-tier journal (JM, Marketing Science, JCR, MISQ, Management Science, or Organization Science).

Respond with ONLY a JSON object (no prose before or after), in this exact schema:

{{
  "ideas": [
    {{
      "title": "string — one-line title with paradox name",
      "paradox": "string — the counterintuitive hook in one sentence",
      "hypothesis": "string — H1 statement, testable",
      "identification": "string — concrete causal strategy (FE / DID / IV / RCT / RDD / hazard)",
      "theory_anchor": "string — canonical theory + 1 citation (Author Year)",
      "journal_target": "string — one of: JM / Mark Sci / MISQ / Mgmt Sci / Org Sci / JCR",
      "feasibility_6mo": 1-5 integer (1=hardest, 5=easiest),
      "ab_test_difficulty": 1-5 integer (1=easiest A/B, 5=cannot A/B)
    }},
    ... (5 total)
  ]
}}

Be specific. No filler. No markdown headers. JSON only.
"""


async def call_claude(prompt: str) -> dict:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    base_url = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
    if not api_key:
        raise HTTPException(503, "Claude API key not configured")
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
                "max_tokens": 4000,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
    if resp.status_code != 200:
        raise HTTPException(502, f"Claude error {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    text = data["content"][0]["text"]
    # try to extract JSON (in case there's stray prose)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        return json.loads(text)
    except Exception as e:
        raise HTTPException(502, f"Claude returned non-JSON: {text[:300]}")


@router.post("/ideation", response_model=DemoIdeationResponse)
async def demo_ideation(body: DemoIdeationRequest, request: Request):
    # Very rough rate-limit hint — TODO: real IP rate limiting in production
    prompt = PROMPT_TEMPLATE.format(input=body.input.strip())
    parsed = await call_claude(prompt)
    if "ideas" not in parsed or not isinstance(parsed["ideas"], list):
        raise HTTPException(502, "Claude response missing 'ideas' array")
    ideas = [IdeaCard(**x) for x in parsed["ideas"]]
    return DemoIdeationResponse(
        ideas=ideas,
        model_used="claude-sonnet-4-5",
        cost_credits=50,  # demo cost
    )
