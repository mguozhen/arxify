#!/usr/bin/env python3
"""Regression test: generated proposal decks are STORED and NOT re-generated.

Asserts:
  1. A hypothesis with a generated deck returns its variants on GET (cached).
  2. POST generate-proposal with force=false on an already-generated hypothesis
     returns the CACHED deck (same generated_at) — i.e. no duplicate generation.
  3. (opt-in, slow) force=true DOES produce a new generated_at.

Usage:
  python3 scripts/regression_proposal_cache.py [CODE] [--with-force]
Env:
  ARXIFY_BASE (default prod), ARXIFY_TOKEN (default ws2 admin token)
"""
import json, os, sys, time, urllib.request, urllib.error

BASE = os.environ.get("ARXIFY_BASE", "https://arxify-production.up.railway.app")
TOK = os.environ.get("ARXIFY_TOKEN", "dtUIzFIs1p2TzXmcWGT_qA")
CODE = next((a for a in sys.argv[1:] if not a.startswith("--")), "E0")
WITH_FORCE = "--with-force" in sys.argv


def _req(method, path, body=None, timeout=900):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method,
                               headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def variants_at(code):
    d = _req("GET", f"/api/workspace/hypotheses/{code}?token={TOK}")
    v = d.get("proposal_variants") or {}
    return {k: (val or {}).get("generated_at") for k, val in v.items()}


def main():
    fails = []
    print(f"== regression: proposal cache · {CODE} @ {BASE} ==")

    # 1. cached variants present on GET
    v1 = variants_at(CODE)
    print(f"[1] GET variants: {sorted(v1)} ({len(v1)} cached)")
    if not v1:
        fails.append("no cached variants — generate at least one deck first")
        print("    FAIL: nothing cached"); print_result(fails); return
    print("    PASS: decks are stored")

    # 2. force=false must NOT regenerate (returns cached, same generated_at)
    t0 = time.time()
    _req("POST", f"/api/workspace/hypotheses/{CODE}/generate-proposal?token={TOK}&force=false",
         {"model_provider": "flatkey-claude-4-8", "mode": "single"})
    dt = time.time() - t0
    v2 = variants_at(CODE)
    unchanged = v1 == v2
    print(f"[2] force=false returned in {dt:.1f}s; generated_at unchanged={unchanged}")
    if not unchanged or dt > 30:
        fails.append(f"force=false appears to regenerate (changed={not unchanged}, {dt:.1f}s)")
        print("    FAIL: cache not honored")
    else:
        print("    PASS: no duplicate generation (served from cache, fast)")

    # 3. optional: force=true regenerates (new generated_at)
    if WITH_FORCE:
        prev = v2.get("flatkey-claude-4-8")
        _req("POST", f"/api/workspace/hypotheses/{CODE}/generate-proposal?token={TOK}&force=true",
             {"model_provider": "flatkey-claude-4-8", "mode": "single"})
        new = variants_at(CODE).get("flatkey-claude-4-8")
        regenerated = new != prev
        print(f"[3] force=true regenerated={regenerated} ({prev} -> {new})")
        if not regenerated:
            fails.append("force=true did not regenerate")
            print("    FAIL")
        else:
            print("    PASS: explicit regenerate works")

    print_result(fails)


def print_result(fails):
    print("=" * 40)
    if fails:
        print("RESULT: FAIL"); [print(" -", f) for f in fails]; sys.exit(1)
    print("RESULT: PASS — decks cached, no duplicate generation")


if __name__ == "__main__":
    main()
