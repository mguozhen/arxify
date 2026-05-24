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
          token TEXT UNIQUE,
          referred_count INTEGER NOT NULL DEFAULT 0,
          is_admin INTEGER NOT NULL DEFAULT 0,
          password_hash TEXT,
          password_salt TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_waitlist_token ON waitlist(token);

        CREATE TABLE IF NOT EXISTS demo_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip TEXT,
          kind TEXT NOT NULL,
          input TEXT NOT NULL,
          output TEXT,
          ok INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- "Workspaces" are admin-curated demo collections
        CREATE TABLE IF NOT EXISTS workspaces (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_email TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Hypotheses (the 17 research directions we built up across sessions)
        CREATE TABLE IF NOT EXISTS hypotheses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
          code TEXT NOT NULL,           -- D1, D8, H3, etc.
          title TEXT NOT NULL,
          paradox TEXT NOT NULL,
          hypothesis TEXT NOT NULL,
          identification TEXT NOT NULL,
          theory_anchor TEXT NOT NULL,
          journal_target TEXT NOT NULL,
          feasibility_6mo INTEGER NOT NULL DEFAULT 3,
          ab_test_difficulty INTEGER NOT NULL DEFAULT 3,
          status TEXT NOT NULL DEFAULT 'candidate',
          notes TEXT,
          proposal_json TEXT,           -- cached full-proposal expansion (JSON)
          proposal_generated_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_hyp_ws ON hypotheses(workspace_id);

        -- Data sources (cactus_prod, tars_prod_app, etc.)
        CREATE TABLE IF NOT EXISTS data_sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
          name TEXT NOT NULL,
          kind TEXT NOT NULL,           -- mysql | s3 | api | csv
          description TEXT,
          stats TEXT,                   -- "1.9M rows · since 2024-01"
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_ds_ws ON data_sources(workspace_id);

        -- Chat messages tied to workspaces — persists demo conversations
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
          role TEXT NOT NULL,           -- user | assistant
          content TEXT NOT NULL,
          model TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_chat_ws ON chat_messages(workspace_id);
        """)


init()
