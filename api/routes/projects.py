"""Projects — a container for user research work.

Each project holds an `input` (markdown describing background + data + ideas)
plus 0..N `runs` (ideation, ranking, tournament, writeup) and resulting
`artifacts`.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.utils.session import current_user

router = APIRouter()


class ProjectCreate(BaseModel):
    title: str
    input_markdown: str
    description: Optional[str] = None


class ProjectOut(BaseModel):
    id: str
    title: str
    status: str  # draft | running | done | error
    input_markdown: str
    description: Optional[str]


@router.post("", response_model=ProjectOut)
def create_project(body: ProjectCreate, user=Depends(current_user)):
    if not user:
        raise HTTPException(401)
    # TODO: insert into `project` table
    return ProjectOut(
        id="prj_demo",
        title=body.title,
        status="draft",
        input_markdown=body.input_markdown,
        description=body.description,
    )


@router.get("", response_model=list[ProjectOut])
def list_projects(user=Depends(current_user)):
    if not user:
        raise HTTPException(401)
    # TODO: SELECT * FROM project WHERE org_id = $1
    return []


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, user=Depends(current_user)):
    if not user:
        raise HTTPException(401)
    # TODO: SELECT * FROM project WHERE id = $1 AND org_id = $2
    raise HTTPException(404)
