"""
EIA Screening Platform — Legal Threshold Data Models
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from .project import ScreeningOutcome


class RegulatoryReference(BaseModel):
    id: str
    name: str
    section: str
    description: str = ""
    url: str = ""


class ThresholdTrigger(BaseModel):
    id: str
    name: str
    description: str
    triggered: bool = False
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    reasoning: str = ""
    regulatory_ref: str = ""


class ThresholdEvaluation(BaseModel):
    """Output of the Legal Threshold executor."""

    project_type_id: str
    project_type_name: str
    regulatory_references: list[RegulatoryReference] = Field(default_factory=list)
    triggers: list[ThresholdTrigger] = Field(default_factory=list)
    overall_outcome: ScreeningOutcome = ScreeningOutcome.PENDING
    reasoning: str = ""

    @property
    def any_triggered(self) -> bool:
        return any(t.triggered for t in self.triggers)

    @property
    def trigger_count(self) -> int:
        return sum(1 for t in self.triggers if t.triggered)


class SensitiveAreaCheck(BaseModel):
    """Result of the geospatial sensitive area overlap check for below-threshold projects."""

    checked: bool = False
    areas_found: int = 0
    area_names: list[str] = Field(default_factory=list)


class ScreeningDecision(BaseModel):
    """
    Output of the Screening Decision executor.

    Decision tree (per NV IA workflow):
    - ABOVE thresholds → screening_required
    - BELOW thresholds → geospatial check:
        - overlap with sensitive area → screening_required
        - no overlap → exempt
    """

    is_exempt: bool = False
    decision_reasoning: str = ""
    next_path: str = "screening"  # "exempt" | "screening"
    threshold_evaluation: ThresholdEvaluation | None = None
    sensitive_area_check: SensitiveAreaCheck | dict | None = None
