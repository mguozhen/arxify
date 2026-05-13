"""Writeup job — wraps AI-Scientist-v2 perform_writeup.py to produce a paper PDF.

This is the highest-cost job (~1500 credits) because writeup typically requires
LaTeX rendering + several Claude-Opus calls. Production deployment likely needs
GPU/CPU-heavy box (Modal) rather than Railway.
"""
from __future__ import annotations

import os
import subprocess
from pathlib import Path

AI_SCIENTIST_DIR = os.environ.get(
    "AI_SCIENTIST_DIR",
    "/Users/hunter/论文/AI-Scientist-v2",
)


def run(*, job_id: str, project_id: str, config: dict, user_id: str) -> None:
    """Config keys:
    - idea_json_path: str (idea spec produced by ideation)
    - experiment_results_path: str (user-uploaded CSV/markdown of empirical results)
    - target_pages: int (default 8 — full paper; 4 = ICBINB short paper)
    """
    venv_python = str(Path(AI_SCIENTIST_DIR) / "venv" / "bin" / "python")
    if not Path(venv_python).exists():
        venv_python = "python3"
    target_pages = config.get("target_pages", 8)
    script = "perform_writeup.py" if target_pages == 8 else "perform_icbinb_writeup.py"
    cmd = [
        venv_python,
        f"ai_scientist/{script}",
        # TODO: pass idea JSON + experiment results
    ]
    env = {**os.environ, "ANTHROPIC_API_KEY": os.environ["ANTHROPIC_API_KEY"]}
    subprocess.run(cmd, cwd=AI_SCIENTIST_DIR, env=env, timeout=3600)
    # TODO: collect .tex + .pdf, upload to S3, mark artifact paper_pdf + paper_tex
