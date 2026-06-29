"""Workspace + chat endpoints for the admin-seeded demo content."""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Literal

import asyncio
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
    novelty_score: int | None = None
    scarcity_score: int | None = None
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

class CausalThreat(BaseModel):
    threat: str
    test: str
    fix: str


class CausalIdentification(BaseModel):
    causal_question: str
    estimand: str
    preferred_design: str
    assignment_mechanism: str
    control_or_counterfactual: str
    unit_of_analysis: str
    identifying_assumption: str
    balance_checks: list[str]
    manipulation_checks: list[str]
    threats_to_causality: list[CausalThreat]
    decision_rule: str


class ProposalSection(BaseModel):
    one_line_question: str
    why_top_tier: list[str]            # 3-5 bullets
    why_solvea_exclusive: list[str]    # 3-5 bullets
    experiment_design: dict             # {treatment_arms, randomization, duration}
    causal_identification: CausalIdentification | None = None  # explicit experiment / quasi-experiment causal plan
    outcomes: dict                       # {primary: [...], secondary: [...]}
    pre_registered_hypotheses: list[dict]  # [{id, statement}]
    sample_size: dict                    # {per_arm, total, power, mde, weeks}
    implementation: dict                  # {engineering_days, ops, cost_usd}
    journal_targets: list[dict]          # [{tier, journal, reason}]
    theory_anchors: list[dict]           # [{theory, citation, role}]
    risks: list[dict]                    # [{risk, mitigation}]
    elevator_pitches: dict               # {lin, zhou, cai}


ProposalModelProvider = Literal[
    "flatkey-claude-4-8",
    "flatkey-gpt-5-5",
    "apodex-deepresearch",
    "flatkey-glm-5-2",
]


class ProposalVariant(BaseModel):
    provider_id: ProposalModelProvider
    label: str
    source: str
    proposal: ProposalSection
    proposal_zh: ProposalSection | None = None
    proposal_en: ProposalSection | None = None
    generated_at: str


class HypothesisDetail(BaseModel):
    hypothesis: Hypothesis
    proposal: ProposalSection | None
    proposal_zh: ProposalSection | None = None
    proposal_en: ProposalSection | None = None
    proposal_variants: dict[str, ProposalVariant] = Field(default_factory=dict)
    raw_title: str
    raw_paradox: str
    raw_hypothesis: str
    raw_identification: str
    raw_theory_anchor: str
    raw_journal_target: str
    notes: str | None


class ProposalGenerationRequest(BaseModel):
    model_provider: ProposalModelProvider = "flatkey-claude-4-8"
    mode: Literal["single", "all"] = "single"


def _parse_proposal_variants(raw: str | None) -> dict[str, ProposalVariant]:
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        if not isinstance(data, dict):
            return {}
    except Exception:
        return {}

    variants: dict[str, ProposalVariant] = {}
    for provider_id, value in data.items():
        try:
            if not isinstance(value, dict):
                continue
            proposal_i18n = value.get("proposal_i18n") or {}
            proposal_zh = value.get("proposal_zh") or proposal_i18n.get("zh")
            proposal_en = value.get("proposal_en") or proposal_i18n.get("en")
            variants[provider_id] = ProposalVariant(
                provider_id=value.get("provider_id") or provider_id,
                label=value.get("label") or _proposal_provider_label(provider_id)["label"],
                source=value.get("source") or _proposal_provider_label(provider_id)["source"],
                proposal=ProposalSection(**value["proposal"]),
                proposal_zh=ProposalSection(**proposal_zh) if proposal_zh else None,
                proposal_en=ProposalSection(**proposal_en) if proposal_en else None,
                generated_at=value.get("generated_at") or "",
            )
        except Exception:
            continue
    return variants


def _proposal_provider_label(provider_id: str) -> dict[str, str]:
    labels = {
        "flatkey-claude-4-8": {"label": "Claude Opus 4.8", "source": "Flatkey"},
        "flatkey-gpt-5-5": {"label": "GPT 5.5", "source": "Flatkey"},
        "apodex-deepresearch": {"label": "DeepResearch", "source": "Apodex"},
        "flatkey-glm-5-2": {"label": "GLM-5.2", "source": "Flatkey"},
    }
    return labels.get(provider_id, {"label": provider_id, "source": "custom"})


def _serialize_proposal_variant(variant: ProposalVariant) -> dict:
    return {
        "provider_id": variant.provider_id,
        "label": variant.label,
        "source": variant.source,
        "proposal": variant.proposal.model_dump(),
        "proposal_i18n": {
            "zh": variant.proposal_zh.model_dump() if variant.proposal_zh else variant.proposal.model_dump(),
            "en": variant.proposal_en.model_dump() if variant.proposal_en else None,
        },
        "generated_at": variant.generated_at,
    }


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
    proposal_variants = _parse_proposal_variants(d.pop("proposal_variants_json", None))
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
        proposal_variants=proposal_variants,
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

LANGUAGE RULE:
- Write all reader-facing natural-language values in polished Simplified Chinese.
- Keep journal names, citations, theory names, method names, IDs, enum-like fields (tier, severity, direction), and numbers unchanged when appropriate.

CAUSALITY RULE:
- This proposal MUST solve causality, not just correlation.
- Prefer a randomized field experiment / A/B test whenever operationally feasible.
- If randomization is impossible, specify a credible quasi-experimental design (staggered rollout DID, RDD, IV, or natural experiment) and explicitly name the identifying assumptions.
- Every design must define treatment, control/counterfactual, assignment mechanism, estimand, validity checks, and threats to causal interpretation.
- Do not rely on plain cross-sectional correlations, raw before/after comparisons, or uncontrolled observational associations.

Produce a JSON object with this exact schema (Hunter's proposal framework):

{{
  "one_line_question": "Single Chinese sentence framing the research question",
  "why_top_tier": [
    "3-5 Chinese bullet points explaining why this is a top-tier journal contribution"
  ],
  "why_solvea_exclusive": [
    "3-5 Chinese bullet points explaining why only Solvea's data can answer this (data uniqueness)"
  ],
  "experiment_design": {{
    "approach": "RCT / Natural experiment / Observational DID / hybrid",
    "treatment_arms": ["arm 1 description", "arm 2 description", ...],
    "randomization_unit": "ticket / lead / tenant / agent / etc",
    "randomization_logic": "how randomization is implemented",
    "duration_weeks": 6
  }},
  "causal_identification": {{
    "causal_question": "What causal effect is being estimated, in Chinese",
    "estimand": "ATE / ITT / LATE / CATE and exact contrast",
    "preferred_design": "Field RCT / A/B test / staggered rollout DID / RDD / IV / natural experiment",
    "assignment_mechanism": "how treatment is assigned or as-if-random variation is generated",
    "control_or_counterfactual": "what exact group/time/window forms the counterfactual",
    "unit_of_analysis": "ticket / conversation / customer / agent / tenant / day",
    "identifying_assumption": "why the design identifies causality",
    "balance_checks": ["pre-treatment balance checks to run"],
    "manipulation_checks": ["checks proving the treatment actually changed the mechanism"],
    "threats_to_causality": [
      {{"threat": "selection / interference / spillover / noncompliance / attrition / concurrent shocks", "test": "diagnostic test", "fix": "design or estimation fix"}}
    ],
    "decision_rule": "what empirical result would support or reject the causal claim"
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
    "cai": "30-second pitch tailored for Prof Jing Cai (Chinese, focus on RCT + firm outcomes)"
  }}
}}

Be specific. Use real numbers (sample size, weeks, cost). Use real journal names. Tailor pitches to each advisor's expertise. JSON only, no prose outside.
"""


TRANSLATE_PROPOSAL_TO_EN_PROMPT = """Translate the natural-language values of this Chinese research-proposal JSON into polished English.

Rules:
- Keep exactly the same JSON schema and keys.
- Keep numbers, IDs, enum-like values (tier, severity, direction), journal names, citations, theory names, and method names unchanged when appropriate.
- Translate only reader-facing prose values.
- Return JSON only, no prose outside.

JSON:
{proposal_json}
"""


@router.post("/hypotheses/{code}/generate-proposal", response_model=HypothesisDetail)
async def generate_proposal(code: str, token: str, force: bool = False, body: ProposalGenerationRequest | None = None):
    body = body or ProposalGenerationRequest()
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

    existing_variants = _parse_proposal_variants(row["proposal_variants_json"])
    provider_id = body.model_provider
    if body.mode == "single" and row["proposal_json"] and not force:
        # already cached — return existing
        return get_hypothesis(code, token)
    if body.mode == "all" and not force and all(pid in existing_variants for pid in PROPOSAL_MODEL_PROVIDERS):
        return get_hypothesis(code, token)

    prompt = GENERATE_PROPOSAL_PROMPT.format(
        code=row["code"], title=row["title"], paradox=row["paradox"],
        hypothesis=row["hypothesis"], identification=row["identification"],
        theory_anchor=row["theory_anchor"], journal_target=row["journal_target"],
        feasibility_6mo=row["feasibility_6mo"], ab_test_difficulty=row["ab_test_difficulty"],
        notes=row["notes"] or "(none)",
    )

    if body.mode == "all":
        results = await asyncio.gather(
            *[_generate_proposal_variant(pid, prompt) for pid in PROPOSAL_MODEL_PROVIDERS],
            return_exceptions=True,
        )
        generated = [r for r in results if isinstance(r, ProposalVariant)]
        if not generated:
            first = next((r for r in results if isinstance(r, Exception)), None)
            raise HTTPException(502, f"All proposal providers failed: {first}")
        variants = {**{pid: _serialize_proposal_variant(v) for pid, v in existing_variants.items()}}
        variants.update({variant.provider_id: _serialize_proposal_variant(variant) for variant in generated})
        canonical = variants.get(provider_id) or next(iter(variants.values()))
    else:
        variant = await _generate_proposal_variant(provider_id, prompt)
        variants = {**{pid: _serialize_proposal_variant(v) for pid, v in existing_variants.items()}}
        variants[provider_id] = _serialize_proposal_variant(variant)
        canonical = variants[provider_id]

    canonical_i18n = {
        "zh": canonical["proposal_i18n"].get("zh") or canonical["proposal"],
        "en": canonical["proposal_i18n"].get("en"),
    }

    with conn() as c:
        c.execute(
            """
            UPDATE hypotheses
            SET proposal_json=?,
                proposal_i18n=?,
                proposal_variants_json=?,
                proposal_generated_at=datetime('now')
            WHERE id=?
            """,
            (
                json.dumps(canonical["proposal"], ensure_ascii=False),
                json.dumps(canonical_i18n, ensure_ascii=False),
                json.dumps(variants, ensure_ascii=False),
                row["id"],
            ),
        )
    return get_hypothesis(code, token)


async def _generate_proposal_variant(provider_id: ProposalModelProvider, prompt: str) -> ProposalVariant:
    text = await _call_proposal_model(
        provider_id=provider_id,
        system_prompt="You are a top-tier IS/Mgmt/Mark research methodologist. Output JSON only.",
        history=[{"role": "user", "content": prompt}],
        max_tokens=8000,
    )
    try:
        parsed = json.loads(_json_text(text))
        ProposalSection(**parsed)  # validate
    except Exception as e:
        raise HTTPException(502, f"{provider_id} returned non-conforming JSON: {e}: {text[:300]}")

    # Skip the separate EN-translation call here: it doubles wall-clock (a second
    # multi-minute model call) and the dashboard falls back to zh. EN can be filled
    # later via _build_proposal_i18n if a bilingual deck is needed.
    label = _proposal_provider_label(provider_id)
    return ProposalVariant(
        provider_id=provider_id,
        label=label["label"],
        source=label["source"],
        proposal=ProposalSection(**parsed),
        proposal_zh=ProposalSection(**parsed),
        proposal_en=None,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


def _json_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        for part in parts:
            candidate = part.strip()
            if candidate.startswith("json"):
                candidate = candidate[4:].strip()
            if candidate.startswith("{") or candidate.startswith("["):
                return candidate
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return text[start:end + 1]
    return text


async def _build_proposal_i18n(provider_id: str, proposal_zh: dict) -> dict:
    proposal_json = json.dumps(proposal_zh, ensure_ascii=False)
    text = await _call_proposal_model(
        provider_id=provider_id,
        system_prompt="You are a precise academic translator. Output valid JSON only.",
        history=[
            {
                "role": "user",
                "content": TRANSLATE_PROPOSAL_TO_EN_PROMPT.format(proposal_json=proposal_json),
            }
        ],
        max_tokens=8000,
    )
    try:
        proposal_en = json.loads(_json_text(text))
        ProposalSection(**proposal_en)
    except Exception:
        # Non-fatal: keep the (successful) zh proposal; dashboard falls back to zh.
        return {"zh": proposal_zh, "en": None}
    return {"zh": proposal_zh, "en": proposal_en}


# ─── Chat ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    token: str
    message: str = Field(..., min_length=1, max_length=8000)


class ChatResponse(BaseModel):
    user_message: ChatMessage
    assistant_message: ChatMessage


PROPOSAL_MODEL_PROVIDERS = {
    "flatkey-claude-4-8": {
        "protocol": "anthropic",
        # dedicated Claude key: the main FLATKEY_API_KEY group has no Claude channel.
        # Set FLATKEY_CLAUDE_API_KEY to a Claude-capable router key to enable this provider.
        "api_key_env": "FLATKEY_CLAUDE_API_KEY",
        "base_url_env": "FLATKEY_ANTHROPIC_BASE_URL",
        "default_base_url": "https://router.flatkey.ai",
        "model_env": "FLATKEY_CLAUDE48_MODEL",
        "default_model": "claude-opus-4-8",
    },
    "flatkey-gpt-5-5": {
        "protocol": "openai",
        "api_key_env": "FLATKEY_API_KEY",
        "base_url_env": "FLATKEY_OPENAI_BASE_URL",
        "default_base_url": "https://router.flatkey.ai/v1",
        "model_env": "FLATKEY_GPT55_MODEL",
        "default_model": "gpt-5.5",
    },
    "apodex-deepresearch": {
        "protocol": "openai",
        "api_key_env": "APODEX_API_KEY",
        "base_url_env": "APODEX_BASE_URL",
        "default_base_url": "https://api.apodex.ai/v1",
        "model_env": "APODEX_MODEL",
        "default_model": "apodex-1-0-deep-reasoning",
    },
    "flatkey-glm-5-2": {
        "protocol": "openai",
        # Use the robust router gateway (glm.flatkey.ai single instance overloaded on
        # heavy proposals); reuse FLATKEY_API_KEY which has glm-5.2 in its catalog.
        "api_key_env": "FLATKEY_API_KEY",
        "base_url_env": "GLM_BASE_URL",
        "default_base_url": "https://router.flatkey.ai/v1",
        "model_env": "GLM_MODEL",
        "default_model": "glm-5.2",
    },
}


async def _call_proposal_model(provider_id: str, system_prompt: str, history: list[dict], max_tokens: int) -> str:
    provider = PROPOSAL_MODEL_PROVIDERS.get(provider_id)
    if not provider:
        raise HTTPException(400, f"Unknown proposal model provider: {provider_id}")

    api_key = os.environ.get(provider["api_key_env"])
    if not api_key:
        raise HTTPException(503, f"{provider['api_key_env']} is not configured")

    base_url = os.environ.get(provider["base_url_env"], provider["default_base_url"]).rstrip("/")
    model = os.environ.get(provider["model_env"], provider["default_model"])

    # Proposal generation is a large structured-JSON task; gpt-5.5 alone can exceed
    # 300s. DeepResearch/agentic providers (Apodex/MiroMind) run multi-minute reasoning
    # loops before emitting the answer; give them an even longer ceiling.
    timeout = 900 if provider_id.startswith("apodex") else 600
    if provider["protocol"] == "anthropic":
        return await _call_anthropic_messages(base_url, api_key, model, system_prompt, history, max_tokens, timeout)
    return await _call_openai_chat_completions(base_url, api_key, model, system_prompt, history, max_tokens, timeout)


async def _call_anthropic_messages(
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    history: list[dict],
    max_tokens: int,
    timeout: int = 300,
) -> str:
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            f"{base_url}/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": max_tokens,
                "system": system_prompt,
                "messages": history,
            },
        )
    if resp.status_code != 200:
        raise HTTPException(502, f"{model} error {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    chunks = [block.get("text", "") for block in data.get("content", []) if isinstance(block, dict)]
    text = "".join(chunks).strip()
    if not text:
        raise HTTPException(502, f"{model} returned an empty text response")
    return text


async def _call_openai_chat_completions(
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    history: list[dict],
    max_tokens: int,
    timeout: int = 300,
) -> str:
    messages = [{"role": "system", "content": system_prompt}, *history]
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
            },
        )
    if resp.status_code != 200:
        raise HTTPException(502, f"{model} error {resp.status_code}: {resp.text[:300]}")
    if "text/event-stream" in resp.headers.get("content-type", ""):
        return _parse_openai_sse(resp.text, model)
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _parse_openai_sse(raw: str, model: str) -> str:
    chunks: list[str] = []
    summary_chunks: list[str] = []
    for line in raw.splitlines():
        line = line.strip()
        if not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if not payload or payload == "[DONE]":
            continue
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            continue
        choice = (data.get("choices") or [{}])[0]
        delta = choice.get("delta") or {}
        message = choice.get("message") or {}
        content = delta.get("content") or message.get("content")
        if content:
            chunks.append(content)
        elif delta.get("agent_summary"):
            summary_chunks.append(delta["agent_summary"])
    text = "".join(chunks).strip()
    if not text:
        text = "".join(summary_chunks).strip()
    if not text:
        raise HTTPException(502, f"{model} returned an empty streaming response")
    return text


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
