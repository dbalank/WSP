"""
EIA Screening Platform — Mitigation Data Models
"""

from __future__ import annotations

import enum

from pydantic import BaseModel, Field

from .project import Severity


class MitigationType(str, enum.Enum):
    AVOIDANCE = "avoidance"
    MINIMISATION = "minimisation"
    REHABILITATION = "rehabilitation"
    OFFSET = "offset"


class MitigationMeasure(BaseModel):
    id: str
    impact_factor_id: str
    vec_id: str
    title: str
    description: str = ""
    mitigation_type: MitigationType = MitigationType.MINIMISATION
    effectiveness: Severity = Severity.MODERATE
    residual_impact: Severity = Severity.LOW
    source: str = ""
    is_custom: bool = False


class MitigationGap(BaseModel):
    impact_factor_id: str
    vec_id: str
    description: str
    recommendation: str = ""


class MitigationResult(BaseModel):
    """Output of the Mitigation executor."""

    measures: list[MitigationMeasure] = Field(default_factory=list)
    summary: str = ""
    gap_analysis: list[MitigationGap] = Field(default_factory=list)
