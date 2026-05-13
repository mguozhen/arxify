"""Artifacts — outputs of runs.

Kinds: idea_json, ranking_md, tournament_md, paper_pdf, critique_md, paper_tex.
Stored in S3 (production) or local disk (dev). Frontend downloads via signed URL.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from api.utils.session import current_user

router = APIRouter()


@router.get("/{artifact_id}")
def get_artifact(artifact_id: str, user=Depends(current_user)):
    if not user:
        raise HTTPException(401)
    # TODO: SELECT s3_url, kind FROM artifact WHERE id = $1
    # Return either inline JSON or a signed URL.
    raise HTTPException(404)
