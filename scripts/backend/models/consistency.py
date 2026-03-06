"""
EIA Screening Platform — Consistency Validation Data Models
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from .project import Severity


class ConsistencyGap(BaseModel):
    id: str
    section: str
    description: str
    severity: Severity = Severity.MODERATE
    suggested_fix: str = ""


class ConsistencyDeviation(BaseModel):
    id: str
    section: str
    description: str
    historical_norm: str = ""
    current_value: str = ""
    severity: Severity = Severity.LOW


class ConsistencyReport(BaseModel):
    """Output of the Consistency Validation executor."""

    overall_score: float = Field(default=0.0, ge=0.0, le=1.0)
    gaps: list[ConsistencyGap] = Field(default_factory=list)
    deviations: list[ConsistencyDeviation] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
