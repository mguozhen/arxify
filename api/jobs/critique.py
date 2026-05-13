"""Critique job — calls MiroThinker DeepCritique directly (no subprocess)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

AI_RESEARCHER_DIR = os.environ.get(
    "AI_RESEARCHER_DIR",
    "/Users/hunter/ai-researcher",
)


def run(*, job_id: str, project_id: str, config: dict, user_id: str) -> None:
    """Config:
    - idea_summary: str
    - context: str (optional)
    """
    sys.path.insert(0, str(Path(AI_RESEARCHER_DIR)))
    from tools.miro_critique import MiroThinkerCritiqueTool  # noqa
    tool = MiroThinkerCritiqueTool()
    result = tool.use_tool(
        idea_summary=config["idea_summary"],
        context=config.get("context", ""),
    )
    # TODO: write result to S3 + artifact row
    _ = result
