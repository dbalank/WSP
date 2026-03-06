"""
EIA Screening Platform — FastAPI Application
Enterprise-grade Environmental Impact Assessment backend powered
by Microsoft Agent Framework.

Run with: uv run uvicorn scripts.backend.main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.projects import router as projects_router
from .routes.screening import router as screening_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("eia_platform")

app = FastAPI(
    title="EIA Screening Platform API",
    description=(
        "Enterprise-grade Environmental Impact Assessment screening platform "
        "powered by Microsoft Agent Framework. Provides AI-driven regulatory "
        "compliance, impact analysis, and report generation."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(projects_router)
app.include_router(screening_router)


@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "EIA Screening Platform",
        "version": "1.0.0",
        "framework": "Microsoft Agent Framework",
        "agents": 9,
        "tools": 8,
    }
