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

from api.routes import auth, billing, projects, runs, artifacts, health, demo, waitlist, workspace


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Idempotent: ensure the shared second-admin account exists on every boot
    # so the dissertation hypotheses are reachable by mguozhen03@gmail.com too.
    try:
        from api.scripts.seed_second_admin import main as seed_second_admin
        seed_second_admin()
    except Exception as e:  # never let seeding crash the API
        print(f"[startup] seed_second_admin skipped: {e}")
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
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://arxify.io",
        "https://arxify.ai",
        "https://paer.paircode.ai",
        "https://arxify-omega.vercel.app",
    ],
    # allow any Vercel deployment URL (preview + prod aliases) so redeploys
    # don't silently break the browser CORS check.
    allow_origin_regex=r"https://arxify[a-z0-9-]*\.vercel\.app",
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
app.include_router(waitlist.router, prefix="/api/waitlist", tags=["waitlist"])
app.include_router(workspace.router, prefix="/api/workspace", tags=["workspace"])
