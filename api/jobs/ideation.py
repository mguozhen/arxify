"""Ideation job — wraps perform_ideation_temp_free.py.

Reads project.input_markdown, writes it to a temp workshop .md file, invokes
the ai-researcher pipeline, then ingests the resulting ideas JSON.
"""
from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path

AI_SCIENTIST_DIR = os.environ.get(
    "AI_SCIENTIST_DIR",
    "/Users/hunter/论文/AI-Scientist-v2",
)


def run(*, job_id: str, project_id: str, config: dict, user_id: str) -> None:
    """Run ideation. Config keys:
    - input_markdown: str (workshop description)
    - max_num_generations: int (default 5)
    - num_reflections: int (default 4)
    - model: str (default claude-sonnet-4-5-20250929)
    """
    max_gen = config.get("max_num_generations", 5)
    n_refl = config.get("num_reflections", 4)
    model = config.get("model", "claude-sonnet-4-5-20250929")
    input_md = config["input_markdown"]

    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
        f.write(input_md)
        workshop_file = f.name

    venv_python = str(Path(AI_SCIENTIST_DIR) / "venv" / "bin" / "python")
    if not Path(venv_python).exists():
        venv_python = "python3"

    cmd = [
        venv_python,
        "ai_scientist/perform_ideation_temp_free.py",
        "--workshop-file", workshop_file,
        "--model", model,
        "--max-num-generations", str(max_gen),
        "--num-reflections", str(n_refl),
    ]
    env = {
        **os.environ,
        "ANTHROPIC_API_KEY": os.environ["ANTHROPIC_API_KEY"],
        "MIROMIND_API_KEY": os.environ["MIROMIND_API_KEY"],
    }
    if os.environ.get("ANTHROPIC_BASE_URL"):
        env["ANTHROPIC_BASE_URL"] = os.environ["ANTHROPIC_BASE_URL"]

    result = subprocess.run(
        cmd, cwd=AI_SCIENTIST_DIR, env=env,
        capture_output=True, text=True, timeout=3600,
    )

    # AI-Scientist writes ideas to ai_scientist/ideas/<workshop_basename>.json
    workshop_name = Path(workshop_file).stem
    ideas_json = Path(AI_SCIENTIST_DIR) / "ai_scientist" / "ideas" / f"{workshop_name}.json"

    # TODO: upload ideas_json to S3 and insert artifact rows for each idea.
    # TODO: update run.status = 'done' with cost_credits debited.
    pass
