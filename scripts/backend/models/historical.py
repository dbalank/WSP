"""
EIA Screening Platform — Historical Comparison Data Models

Per the NV IA Screening Process workflow, historical comparison occurs at
TWO distinct points in the pipeline, each with specific checklist items:

Phase 1 — After Project Description + Context:
  - Is the list of components comparable?
  - Are the description length and style comparable?
  - Is there any gap?
  - What was the decision? What were the criteria?

Phase 2 — After Impacts + Mitigation:
  - Is the list of impacts comparable?
  - Is the list of mitigation actions comparable?
  - Are the description length and style comparable?
  - Is there any gap?
  - What was the decision? What were the criteria?
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class StructuralComparison(BaseModel):
    """
    Structural comparison between current and historical projects.
    Used for both Phase 1 (project description) and Phase 2 (impacts/mitigation).
    """

    component_overlap: float = Field(default=0.0, ge=0.0, le=1.0)
    style_consistency: float = Field(default=0.0, ge=0.0, le=1.0)
    length_ratio: float = Field(default=0.0, ge=0.0)
    notes: str = ""
    comparison_phase: str = ""  # "project_description" | "impacts_mitigation"
    # Phase 1 checklist items
    phase1_checklist: Optional[dict] = None  # {components_comparable, style_comparable, length_comparable, gaps_identified}
    # Phase 2 checklist items
    phase2_checklist: Optional[dict] = None  # {impacts_comparable, mitigations_comparable, style_comparable, gaps_identified}


class DecisionComparison(BaseModel):
    """Decision criteria comparison: outcome alignment, divergences."""

    outcome_match: bool = False
    criteria_alignment: float = Field(default=0.0, ge=0.0, le=1.0)
    divergences: list[str] = Field(default_factory=list)
    notes: str = ""


class HistoricalMatch(BaseModel):
    """
    A single historical project match with dual-phase comparison data.
    """

    id: str
    project_name: str
    project_type: str = ""
    year: int = 0
    outcome: str = ""
    similarity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    # Phase 1: Project Description & Context comparison
    structural_comparison: StructuralComparison = Field(default_factory=StructuralComparison)
    # Phase 2: Impacts & Mitigation comparison (new per workflow audit)
    impact_mitigation_comparison: Optional[StructuralComparison] = None
    # Decision criteria comparison (applies to both phases)
    decision_comparison: DecisionComparison = Field(default_factory=DecisionComparison)
