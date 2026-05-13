"""Ranking job — wraps rank_ideas.py."""
from __future__ import annotations

import os
import subprocess
from pathlib import Path

AI_SCIENTIST_DIR = os.environ.get(
    "AI_SCIENTIST_DIR",
    "/Users/hunter/论文/AI-Scientist-v2",
)


def run(*, job_id: str, project_id: str, config: dict, user_id: str) -> None:
    """Run cross-idea ranking. Config:
    - ideas_path: str (path to JSON produced by ideation)
    - top: int (default 5)
    """
    venv_python = str(Path(AI_SCIENTIST_DIR) / "venv" / "bin" / "python")
    if not Path(venv_python).exists():
        venv_python = "python3"
    out_md = f"/tmp/{job_id}_ranking.md"
    cmd = [
        venv_python,
        "ai_scientist/rank_ideas.py",
        "--ideas", config["ideas_path"],
        "--top", str(config.get("top", 5)),
        "--out", out_md,
    ]
    env = {**os.environ, "MIROMIND_API_KEY": os.environ["MIROMIND_API_KEY"]}
    subprocess.run(cmd, cwd=AI_SCIENTIST_DIR, env=env, timeout=900)
    # TODO: upload out_md to S3 + insert artifact row
