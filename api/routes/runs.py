"""Runs — async jobs that exercise the ai-researcher pipeline.

Each run has a type:
- `ideation` -> spawn ai-researcher perform_ideation_temp_free.py
- `rank`     -> spawn ai-researcher rank_ideas.py
- `tournament` -> spawn ai-researcher tournament_ideas.py
- `writeup`  -> spawn AI-Scientist-v2 perform_writeup.py (LaTeX -> PDF)

Runs are enqueued on Bull/Redis; workers run them via subprocess. Results land
as artifacts in S3/R2 + a row in the `artifact` table.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.jobs import dispatcher
from api.utils.session import current_user

router = APIRouter()

VALID_TYPES = {"ideation", "rank", "tournament", "writeup", "deep_critique"}


class RunCreate(BaseModel):
    project_id: str
    type: str  # one of VALID_TYPES
    config: dict | None = None  # e.g. {"max_num_generations": 5, "num_reflections": 4}


class RunOut(BaseModel):
    id: str
    project_id: str
    type: str
    status: str  # queued | running | done | error
    cost_credits: int


CREDIT_COST = {
    "ideation": 500,
    "rank": 200,
    "tournament": 800,
    "writeup": 1500,
    "deep_critique": 100,
}


@router.post("", response_model=RunOut)
def create_run(body: RunCreate, user=Depends(current_user)):
    if not user:
        raise HTTPException(401)
    if body.type not in VALID_TYPES:
        raise HTTPException(400, f"type must be one of {VALID_TYPES}")
    cost = CREDIT_COST[body.type]
    if user["credits_remaining"] < cost:
        raise HTTPException(402, f"Need {cost} credits, have {user['credits_remaining']}. Upgrade your plan.")
    job_id = dispatcher.enqueue(
        type=body.type,
        project_id=body.project_id,
        config=body.config or {},
        user_id=user["id"],
    )
    return RunOut(
        id=job_id,
        project_id=body.project_id,
        type=body.type,
        status="queued",
        cost_credits=cost,
    )


@router.get("/{run_id}", response_model=RunOut)
def get_run(run_id: str, user=Depends(current_user)):
    if not user:
        raise HTTPException(401)
    # TODO: SELECT * FROM run WHERE id = $1
    raise HTTPException(404)
