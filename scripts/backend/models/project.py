"""
EIA Screening Platform — Project Data Models
Strongly-typed Pydantic models for project intake and structuring.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProjectState(str, enum.Enum):
    DRAFT = "draft"
    READY_FOR_SCREENING = "ready_for_screening"
    EXEMPT = "exempt"
    SCREENING_REQUIRED = "screening_required"
    ANALYSIS_COMPLETE = "analysis_complete"
    UNDER_REVIEW = "under_review"
    FINALISED = "finalised"


class ScreeningOutcome(str, enum.Enum):
    EXEMPT = "exempt"
    SCREENING_REQUIRED = "screening_required"
    PENDING = "pending"


class Severity(str, enum.Enum):
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class Coordinates(BaseModel):
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")


class ProjectLocation(BaseModel):
    province: str = Field(default="", description="Province or territory")
    region: str = Field(default="", description="Region or district")
    coordinates: Optional[Coordinates] = None
    nearby_features: list[str] = Field(default_factory=list)
    indigenous_territory: list[str] = Field(default_factory=list)


class ExtractedField(BaseModel):
    field_name: str
    value: str
    confidence: float = Field(ge=0.0, le=1.0)
    source: str = Field(default="", description="Source document/section reference")
    ai_reasoning: str = Field(default="", description="AI explanation for this extraction")
    user_override: Optional[str] = None


class ProjectProfile(BaseModel):
    """Structured project profile — output of the Project Structuring executor."""

    project_type: str = Field(default="", description="E.g., 'Pipeline', 'Mine', 'Wind Farm'")
    project_subtype: str = Field(default="", description="E.g., 'Natural Gas Transmission'")
    proponent: str = Field(default="")
    location: ProjectLocation = Field(default_factory=ProjectLocation)
    physical_activities: list[str] = Field(default_factory=list)
    components: list[str] = Field(default_factory=list)


class ProjectData(BaseModel):
    """Complete project record — the root data object carried through the entire pipeline."""

    id: str
    name: str = Field(default="")
    description: str = Field(default="")
    profile: ProjectProfile = Field(default_factory=ProjectProfile)
    raw_intake_text: str = Field(default="")
    extracted_fields: list[ExtractedField] = Field(default_factory=list)
    completeness: float = Field(default=0.0, ge=0.0, le=100.0)
    state: ProjectState = Field(default=ProjectState.DRAFT)
    screening_outcome: ScreeningOutcome = Field(default=ScreeningOutcome.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True
