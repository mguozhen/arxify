"""Pytest fixtures for arxify api tests.

Tests target a running uvicorn at http://127.0.0.1:8000 (started separately
by `bash scripts/dev.sh`). Tests are integration-style — they hit the live
API + DB rather than mocking, because the API is thin enough that mocking
adds more complexity than it removes.
"""
from __future__ import annotations

import os
import time

import httpx
import pytest

BASE = os.environ.get("ARXIFY_TEST_BASE", "http://127.0.0.1:8000")


@pytest.fixture(scope="session")
def api_base() -> str:
    # Ping health a few times before tests run
    for _ in range(10):
        try:
            r = httpx.get(f"{BASE}/health", timeout=5)
            if r.status_code == 200:
                return BASE
        except Exception:
            time.sleep(0.5)
    raise RuntimeError(f"API at {BASE} did not respond to /health")


@pytest.fixture
def client(api_base: str) -> httpx.Client:
    with httpx.Client(base_url=api_base, timeout=30) as c:
        yield c
