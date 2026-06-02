"""Seed a second admin account that SHARES the dissertation hypotheses.

Creates `mguozhen03@gmail.com` as an admin and gives it its OWN copy of the
HKU DBA workspace + all hypotheses + data sources (chat is NOT copied — starts
fresh). Idempotent: re-running refreshes the copied content to match the source
workspace owned by mguozhen@gmail.com.

Run locally:
    ./api/venv/bin/python -m api.scripts.seed_second_admin
On Railway:
    railway run python -m api.scripts.seed_second_admin
"""
from __future__ import annotations

import secrets

from api.utils.db import conn
from api.utils.passwords import hash_password

SOURCE_EMAIL = "mguozhen@gmail.com"
NEW_EMAIL = "mguozhen03@gmail.com"
NEW_NAME = "Hunter 03 · HKU DBA (shared)"
NEW_PASSWORD = "admin"


def main() -> None:
    with conn() as c:
        # 1. source workspace
        src = c.execute(
            "SELECT id, title, description FROM workspaces WHERE owner_email = ? ORDER BY id LIMIT 1",
            (SOURCE_EMAIL,),
        ).fetchone()
        if not src:
            raise SystemExit(f"No source workspace for {SOURCE_EMAIL}")
        src_id = src["id"]

        # 2. ensure new admin user in waitlist (with password = NEW_PASSWORD)
        pw_hash, pw_salt = hash_password(NEW_PASSWORD)
        u = c.execute("SELECT id, token FROM waitlist WHERE email = ?", (NEW_EMAIL,)).fetchone()
        if u:
            token = u["token"]
            c.execute(
                "UPDATE waitlist SET is_admin = 1, password_hash = ?, password_salt = ? WHERE email = ?",
                (pw_hash, pw_salt, NEW_EMAIL),
            )
        else:
            token = secrets.token_urlsafe(16)
            c.execute(
                "INSERT INTO waitlist (email, context, source, token, is_admin, password_hash, password_salt) "
                "VALUES (?,?,?,?,1,?,?)",
                (NEW_EMAIL, NEW_NAME, "seed_second_admin", token, pw_hash, pw_salt),
            )

        # 3. ensure destination workspace owned by new email
        dst = c.execute(
            "SELECT id FROM workspaces WHERE owner_email = ? ORDER BY id LIMIT 1",
            (NEW_EMAIL,),
        ).fetchone()
        if dst:
            dst_id = dst["id"]
            c.execute(
                "UPDATE workspaces SET title = ?, description = ? WHERE id = ?",
                (src["title"], src["description"], dst_id),
            )
            # wipe prior copied content so re-run is a clean refresh
            c.execute("DELETE FROM hypotheses WHERE workspace_id = ?", (dst_id,))
            c.execute("DELETE FROM data_sources WHERE workspace_id = ?", (dst_id,))
        else:
            cur = c.execute(
                "INSERT INTO workspaces (owner_email, title, description) VALUES (?,?,?)",
                (NEW_EMAIL, src["title"], src["description"]),
            )
            dst_id = cur.lastrowid

        # 4. copy hypotheses
        hyp_cols = [
            "code", "title", "paradox", "hypothesis", "identification",
            "theory_anchor", "journal_target", "feasibility_6mo",
            "ab_test_difficulty", "status", "notes",
        ]
        rows = c.execute(
            f"SELECT {', '.join(hyp_cols)} FROM hypotheses WHERE workspace_id = ? ORDER BY id",
            (src_id,),
        ).fetchall()
        for r in rows:
            c.execute(
                f"INSERT INTO hypotheses (workspace_id, {', '.join(hyp_cols)}) "
                f"VALUES (?, {', '.join(['?'] * len(hyp_cols))})",
                (dst_id, *[r[k] for k in hyp_cols]),
            )
        n_hyp = len(rows)

        # 5. copy data sources
        ds_cols = ["name", "kind", "description", "stats", "notes"]
        ds_rows = c.execute(
            f"SELECT {', '.join(ds_cols)} FROM data_sources WHERE workspace_id = ? ORDER BY id",
            (src_id,),
        ).fetchall()
        for r in ds_rows:
            c.execute(
                f"INSERT INTO data_sources (workspace_id, {', '.join(ds_cols)}) "
                f"VALUES (?, {', '.join(['?'] * len(ds_cols))})",
                (dst_id, *[r[k] for k in ds_cols]),
            )
        n_ds = len(ds_rows)

        c.commit()

    print(f"✓ admin {NEW_EMAIL} ready")
    print(f"  token: {token}")
    print(f"  workspace id {dst_id}: {n_hyp} hypotheses, {n_ds} data sources copied from ws {src_id}")


if __name__ == "__main__":
    main()
