"""
EIA Screening Platform — Context Analysis Data Models
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from .project import Coordinates, Severity


class SensitiveArea(BaseModel):
    id: str
    name: str
    area_type: str = Field(default="", description="E.g., Watercourse, Wildlife Habitat")
    distance: float = Field(default=0.0, description="Distance in km from project")
    severity: Severity = Severity.NONE
    description: str = ""
    coordinates: Optional[Coordinates] = None


class VEC(BaseModel):
    """Valued Ecosystem Component."""

    id: str
    name: str
    category: str = Field(default="", description="E.g., Aquatic, Wildlife, Indigenous")
    description: str = ""
    relevance_score: float = Field(default=0.0, ge=0.0, le=1.0)
    regulatory_basis: str = ""
    selected: bool = True


class SpatialOverlay(BaseModel):
    id: str
    name: str
    layer_type: str = ""
    intersects: bool = False
    area_of_overlap: float = Field(default=0.0, description="Area in km2")


class ContextResult(BaseModel):
    """Output of the Context Analysis executor."""

    sensitive_areas: list[SensitiveArea] = Field(default_factory=list)
    vecs: list[VEC] = Field(default_factory=list)
    spatial_overlays: list[SpatialOverlay] = Field(default_factory=list)
    context_summary: str = ""
