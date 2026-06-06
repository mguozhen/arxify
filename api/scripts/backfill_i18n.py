"""One-time backfill: translate all ws1 hypotheses into clean zh + en.

Writes `content_i18n` (all 22 hypotheses) and `proposal_i18n` (H3 only, from
proposal_json) into api/data/arxify.db. Run locally, spot-check, then COMMIT the
db file — Railway has no volume so runtime writes are lost.

Usage:
    FLATKEY_API_KEY=sk-... ANTHROPIC_BASE_URL=https://router.flatkey.ai \
    python3 -m api.scripts.backfill_i18n [--force] [--proposal-only]

The LLM call goes through the flatkey Anthropic-shape proxy (same as
_call_claude_chat). Set HTTPS_PROXY if your egress needs it (not required for
flatkey).
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request

from api.utils.db import conn

BASE_URL = os.environ.get("ANTHROPIC_BASE_URL", "https://router.flatkey.ai").rstrip("/")
API_KEY = os.environ.get("FLATKEY_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")

SHORT_FIELDS = [
    "title", "paradox", "hypothesis", "identification",
    "theory_anchor", "journal_target", "notes",
]


def _call(system: str, user: str, max_tokens: int = 4000) -> str:
    if not API_KEY:
        sys.exit("No FLATKEY_API_KEY / ANTHROPIC_API_KEY in env")
    body = json.dumps({
        "model": MODEL,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/v1/messages",
        data=body,
        headers={
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    opener = urllib.request.build_opener(
        urllib.request.ProxyHandler({"https": proxy, "http": proxy}) if proxy
        else urllib.request.ProxyHandler({})
    )
    raw = opener.open(req, timeout=300).read().decode()
    obj = json.loads(raw)
    # content may include thinking blocks first; take the first text block
    for block in obj.get("content", []):
        if block.get("type") == "text" and block.get("text"):
            return block["text"]
    raise RuntimeError(f"no text block in response: {raw[:300]}")


def _extract_json(text: str):
    t = text.strip()
    if "```" in t:
        seg = t.split("```")
        for part in seg:
            p = part[4:] if part.startswith("json") else part
            p = p.strip()
            if p.startswith("{") or p.startswith("["):
                t = p
                break
    s, e = t.find("{"), t.rfind("}")
    if s >= 0 and e > s:
        t = t[s:e + 1]
    return json.loads(t)


def _call_json(system: str, user: str, max_tokens: int, attempts: int = 3):
    """Call LLM and parse JSON, retrying with a stricter nudge on parse failure."""
    last_err = None
    msg = user
    for i in range(attempts):
        txt = _call(system, msg, max_tokens=max_tokens)
        try:
            return _extract_json(txt)
        except Exception as e:
            last_err = e
            # nudge: resend with the broken output and ask for strict JSON
            msg = (
                user
                + "\n\nYour previous reply was NOT valid JSON ("
                + str(e)
                + "). Return STRICT valid JSON only: escape all quotes and newlines "
                "inside string values, no trailing commas, no prose. Reply with the "
                "JSON object only."
            )
    raise last_err


TRANSLATE_SYS = (
    "You are a precise bilingual academic translator for an IS/Management research "
    "dissertation. You translate field values between Chinese and English, producing "
    "ONE clean version in each language. Rules: keep numbers, statistics, citations "
    "(Author Year), journal names/codes (JM, MISQ, Mgmt Sci, JCR, Org Sci, Mark Sci), "
    "method names (DiD, RDD, Heckman, IV, FE), and code tokens (D8, H3, NPS) VERBATIM. "
    "Do not invent content. Output JSON only."
)


def translate_short(row) -> dict:
    src = {k: row[k] for k in SHORT_FIELDS}
    user = (
        "These hypothesis fields are currently mixed Chinese/English. Produce a clean "
        "Chinese version and a clean English version of EACH field. Return ONLY JSON:\n"
        '{"zh": {' + ", ".join(f'"{k}": "..."' for k in SHORT_FIELDS) + "}, "
        '"en": {' + ", ".join(f'"{k}": "..."' for k in SHORT_FIELDS) + "}}\n\n"
        "Source fields:\n" + json.dumps(src, ensure_ascii=False, indent=2)
    )
    out = _call_json(TRANSLATE_SYS, user, max_tokens=3000)
    # validate keys
    for lang in ("zh", "en"):
        assert lang in out, f"missing {lang}"
        for k in SHORT_FIELDS:
            out[lang].setdefault(k, src.get(k) or "")
    return out


def translate_proposal(proposal: dict) -> dict:
    """Translate the proposal JSON blob into zh + en, preserving structure/numbers."""
    user = (
        "Translate the natural-language VALUES of this research-proposal JSON into a "
        "clean Chinese version and a clean English version. Keep ALL keys, numbers, "
        "enum-like values (tier, severity, direction, id), citations, and journal "
        "names IDENTICAL. Return ONLY JSON: {\"zh\": <same schema>, \"en\": <same schema>}.\n\n"
        + json.dumps(proposal, ensure_ascii=False)
    )
    return _call_json(TRANSLATE_SYS, user, max_tokens=8000)


def main():
    force = "--force" in sys.argv
    proposal_only = "--proposal-only" in sys.argv
    with conn() as c:
        rows = c.execute(
            "SELECT * FROM hypotheses WHERE workspace_id=1 ORDER BY id"
        ).fetchall()
        print(f"{len(rows)} hypotheses in ws1")
        for r in rows:
            if not proposal_only:
                if r["content_i18n"] and not force:
                    print(f"  [{r['code']}] content_i18n exists, skip")
                else:
                    try:
                        ci = translate_short(r)
                        c.execute(
                            "UPDATE hypotheses SET content_i18n=? WHERE id=?",
                            (json.dumps(ci, ensure_ascii=False), r["id"]),
                        )
                        c.commit()
                        print(f"  [{r['code']}] content_i18n ✓")
                        time.sleep(0.5)
                    except Exception as e:
                        print(f"  [{r['code']}] content FAILED: {e}")
            # proposal
            if r["proposal_json"] and (force or not r["proposal_i18n"]):
                try:
                    prop = json.loads(r["proposal_json"])
                    pi = translate_proposal(prop)
                    c.execute(
                        "UPDATE hypotheses SET proposal_i18n=? WHERE id=?",
                        (json.dumps(pi, ensure_ascii=False), r["id"]),
                    )
                    c.commit()
                    print(f"  [{r['code']}] proposal_i18n ✓")
                except Exception as e:
                    print(f"  [{r['code']}] proposal FAILED: {e}")

    # summary
    with conn() as c:
        n_ci = c.execute(
            "SELECT COUNT(*) FROM hypotheses WHERE workspace_id=1 AND content_i18n IS NOT NULL"
        ).fetchone()[0]
        n_pi = c.execute(
            "SELECT COUNT(*) FROM hypotheses WHERE workspace_id=1 AND proposal_i18n IS NOT NULL"
        ).fetchone()[0]
    print(f"DONE: content_i18n on {n_ci}/{len(rows)} | proposal_i18n on {n_pi}")


if __name__ == "__main__":
    main()
