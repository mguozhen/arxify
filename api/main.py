"""arxify.ai — FastAPI backend.

Exposes the ai-researcher pipeline (https://github.com/mguozhen/ai-researcher)
as a SaaS REST API. Frontend at /Users/hunter/arxify/web (Next.js on Vercel).

Run locally:
    uvicorn api.main:app --reload --port 8000
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import auth, billing, projects, runs, artifacts, health, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Future: warm Redis pool, register cron jobs, etc.
    yield


app = FastAPI(
    title="arxify.ai API",
    description="From idea to paper — AI Research SaaS",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.environ.get("WEB_ORIGIN", "http://localhost:3000"),
        "https://arxify.ai",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(runs.router, prefix="/api/runs", tags=["runs"])
app.include_router(artifacts.router, prefix="/api/artifacts", tags=["artifacts"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])
