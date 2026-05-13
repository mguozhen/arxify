"""Tournament job — wraps tournament_ideas.py."""
from __future__ import annotations

import os
import subprocess
from pathlib import Path

AI_SCIENTIST_DIR = os.environ.get(
    "AI_SCIENTIST_DIR",
    "/Users/hunter/论文/AI-Scientist-v2",
)


def run(*, job_id: str, project_id: str, config: dict, user_id: str) -> None:
    venv_python = str(Path(AI_SCIENTIST_DIR) / "venv" / "bin" / "python")
    if not Path(venv_python).exists():
        venv_python = "python3"
    out_md = f"/tmp/{job_id}_tournament.md"
    cmd = [
        venv_python,
        "ai_scientist/tournament_ideas.py",
        "--ideas", config["ideas_path"],
        "--out", out_md,
    ]
    env = {**os.environ, "MIROMIND_API_KEY": os.environ["MIROMIND_API_KEY"]}
    subprocess.run(cmd, cwd=AI_SCIENTIST_DIR, env=env, timeout=1800)
    # TODO: upload + artifact insert
