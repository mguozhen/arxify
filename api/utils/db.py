"""Local SQLite store for waitlist + demo runs.

For MVP demo we avoid Postgres complexity — single sqlite file at
`api/data/arxify.db`. Real production will use Drizzle/Postgres.
"""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Iterable

_DB_PATH = Path(os.environ.get(
    "ARXIFY_SQLITE_PATH",
    str(Path(__file__).parent.parent / "data" / "arxify.db"),
))
_DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def conn() -> sqlite3.Connection:
    c = sqlite3.connect(_DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init() -> None:
    with conn() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS waitlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          context TEXT,
          source TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS demo_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip TEXT,
          kind TEXT NOT NULL,    -- 'ideation' | 'critique'
          input TEXT NOT NULL,
          output TEXT,
          ok INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)


init()
