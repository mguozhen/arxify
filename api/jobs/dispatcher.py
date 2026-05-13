"""Job dispatcher — routes run requests to the right worker.

For MVP we use Redis (via `rq` or `arq`) instead of Bull because we're already
in Python. Each job is a thin subprocess wrapper around the ai-researcher CLI
in /Users/hunter/ai-researcher or /Users/hunter/论文/AI-Scientist-v2.

Heavy LLM-touching jobs (ideation, writeup) can offload to Modal/Beam if
Railway can't host torch. For now we assume local Python in the worker image.
"""
from __future__ import annotations

import os
import uuid
from typing import Any

from api.jobs import ideation, ranking, tournament, writeup, critique


_HANDLERS = {
    "ideation": ideation.run,
    "rank": ranking.run,
    "tournament": tournament.run,
    "writeup": writeup.run,
    "deep_critique": critique.run,
}


def enqueue(*, type: str, project_id: str, config: dict, user_id: str) -> str:
    """Enqueue a job. Returns a job id immediately; the actual work happens in
    a worker process. For MVP / local dev with `ARXIFY_INLINE_JOBS=1` we run
    synchronously."""
    job_id = f"run_{uuid.uuid4().hex[:12]}"
    handler = _HANDLERS[type]

    if os.environ.get("ARXIFY_INLINE_JOBS"):
        # Local-dev mode: run synchronously, block. Easier to debug.
        handler(job_id=job_id, project_id=project_id, config=config, user_id=user_id)
    else:
        # TODO: arq.enqueue(handler, job_id, project_id, config, user_id)
        pass

    return job_id
