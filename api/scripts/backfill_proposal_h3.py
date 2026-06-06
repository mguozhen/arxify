"""Translate H3's proposal_json into proposal_i18n by chunking per top-level key.

The whole-blob translation hits the flatkey router's gateway 524 timeout, so we
translate each top-level key separately (each <=1.3KB) and reassemble. Validates
with ProposalSection before writing.

Usage:
    FLATKEY_API_KEY=... ANTHROPIC_BASE_URL=https://router.flatkey.ai \
    ANTHROPIC_MODEL=claude-sonnet-4-6 python3 -m api.scripts.backfill_proposal_h3 [CODE]
"""
from __future__ import annotations

import json
import sys

from api.routes.workspace import ProposalSection
from api.scripts.backfill_i18n import _call, _extract_json
from api.utils.db import conn

LANG_NAME = {"zh": "Chinese", "en": "English"}

CHUNK_SYS = (
    "You are a precise bilingual academic translator. Translate the natural-language "
    "VALUES of the given JSON fragment into {lang}. Keep ALL keys, numbers, enum-like "
    "values (tier/severity/direction/id), citations (Author Year), journal names "
    "(JM/MISQ/Mgmt Sci/JCR/Org Sci/Mark Sci), and method names VERBATIM. Inside string "
    "values NEVER use ASCII double-quote (\") — use Chinese quotes if needed. Return the "
    "SAME-SHAPE JSON value only, no prose, no code fence."
)


def _translate_value(value, lang: str, attempts: int = 4):
    """Translate one JSON value (str / list / dict) into target language."""
    payload = json.dumps(value, ensure_ascii=False)
    sys_prompt = CHUNK_SYS.format(lang=LANG_NAME[lang])
    user = (
        f"Translate this JSON value into {LANG_NAME[lang]}. Return ONLY the translated "
        f"JSON value (same shape):\n{payload}"
    )
    last = None
    for i in range(attempts):
        try:
            txt = _call(sys_prompt, user, max_tokens=2000)
            # value may be a bare string/list/dict; _extract_json handles {}/[]
            t = txt.strip()
            if t.startswith("```"):
                seg = t.split("```")
                for part in seg:
                    p = part[4:] if part.startswith("json") else part
                    p = p.strip()
                    if p:
                        t = p
                        break
            # bare string case: model may return quoted string
            if isinstance(value, str):
                t2 = t.strip()
                if t2.startswith('"') and t2.endswith('"'):
                    return json.loads(t2)
                return t2.strip().strip('"')
            # shape-aware slice: lists use [ ], dicts use { }
            if isinstance(value, list):
                a, b = t.find("["), t.rfind("]")
            else:
                a, b = t.find("{"), t.rfind("}")
            if a >= 0 and b > a:
                t = t[a:b + 1]
            return json.loads(t)
        except Exception as e:
            last = e
            user = (
                f"Translate into {LANG_NAME[lang]}. Previous attempt failed ({e}). "
                f"Return STRICT valid JSON of the same shape, escape inner quotes, "
                f"no prose, no thinking — just the JSON value:\n{payload}"
            )
    raise last


def translate_proposal_chunked(prop: dict, lang: str) -> dict:
    out = {}
    for k, v in prop.items():
        if isinstance(v, (int, float, bool)) or v is None:
            out[k] = v
            continue
        out[k] = _translate_value(v, lang)
        print(f"    {lang}.{k} ✓", flush=True)
    return out


def main():
    code = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "H3"
    force = "--force" in sys.argv
    c = conn()
    r = c.execute(
        "SELECT * FROM hypotheses WHERE code=? AND workspace_id=1", (code,)
    ).fetchone()
    if not r or not r["proposal_json"]:
        sys.exit(f"{code}: no proposal_json")
    if r["proposal_i18n"] and not force:
        sys.exit(f"{code}: proposal_i18n already set (use --force)")
    prop = json.loads(r["proposal_json"])

    result = {}
    for lang in ("zh", "en"):
        print(f"  translating {lang} ({len(prop)} keys)…", flush=True)
        translated = translate_proposal_chunked(prop, lang)
        ProposalSection(**translated)  # validate schema
        result[lang] = translated
        print(f"  {lang} validated ✓", flush=True)

    c.execute(
        "UPDATE hypotheses SET proposal_i18n=? WHERE id=?",
        (json.dumps(result, ensure_ascii=False), r["id"]),
    )
    c.commit()
    print(f"{code}: proposal_i18n written ✓")


if __name__ == "__main__":
    main()
