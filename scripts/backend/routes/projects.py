"""
Projects CRUD routes.
Provides endpoints for creating, listing, and retrieving projects.
Uses in-memory storage for demonstration (replace with database in production).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models.project import (
    ProjectData,
    ProjectProfile,
    ProjectLocation,
    ProjectState,
    ScreeningOutcome,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])

# In-memory project store (production: replace with database)
_projects: dict[str, ProjectData] = {}


class CreateProjectRequest(BaseModel):
    name: str
    description: str = ""
    proponent: str = ""


class ProjectListItem(BaseModel):
    id: str
    name: str
    proponent: str
    project_type: str
    state: ProjectState
    completeness: float
    updated_at: str


@router.get("/")
async def list_projects() -> list[ProjectListItem]:
    """List all projects with summary data."""
    return [
        ProjectListItem(
            id=p.id,
            name=p.name,
            proponent=p.profile.proponent,
            project_type=p.profile.project_type,
            state=p.state,
            completeness=p.completeness,
            updated_at=p.updated_at.isoformat() if p.updated_at else "",
        )
        for p in _projects.values()
    ]


@router.post("/")
async def create_project(req: CreateProjectRequest) -> ProjectData:
    """Create a new project in DRAFT state."""
    project_id = f"proj_{uuid.uuid4().hex[:8]}"
    project = ProjectData(
        id=project_id,
        name=req.name,
        description=req.description,
        state=ProjectState.DRAFT,
        profile=ProjectProfile(
            proponent=req.proponent,
            project_type="",
            project_subtype="",
            location=ProjectLocation(
                province="",
                region="",
                latitude=0.0,
                longitude=0.0,
                nearest_community="",
            ),
            physical_activities=[],
            components=[],
            capacity_description="",
            regulatory_triggers=[],
        ),
        completeness=0.0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    _projects[project_id] = project
    return project


@router.get("/{project_id}")
async def get_project(project_id: str) -> ProjectData:
    """Retrieve a single project by ID."""
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="Project not found")
    return _projects[project_id]


@router.put("/{project_id}")
async def update_project(project_id: str, data: ProjectData) -> ProjectData:
    """Update an existing project."""
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="Project not found")
    data.updated_at = datetime.utcnow()
    _projects[project_id] = data
    return data


def get_project_store() -> dict[str, ProjectData]:
    """Expose the project store for other route modules."""
    return _projects
