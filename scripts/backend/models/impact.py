"""
EIA Screening Platform — Impact Analysis Data Models
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from .project import Severity


class ImpactFactor(BaseModel):
    id: str
    name: str
    category: str = ""
    description: str = ""
    phase: str = Field(default="", description="E.g., Construction, Operation, Decommissioning")


class CellOverride(BaseModel):
    severity: Severity
    justification: str = ""
    overridden_by: str = ""
    overridden_at: str = ""


class ImpactCell(BaseModel):
    """A single cell in the IF x VEC matrix."""

    impact_factor_id: str
    vec_id: str
    severity: Severity = Severity.NONE
    likelihood: str = Field(default="probable", description="probable | possible | unlikely")
    duration: str = Field(default="", description="E.g., short-term, long-term, permanent")
    reversibility: str = Field(default="", description="reversible | partially reversible | irreversible")
    ai_reasoning: str = ""
    user_override: Optional[CellOverride] = None

    @property
    def effective_severity(self) -> Severity:
        if self.user_override:
            return self.user_override.severity
        return self.severity


class ImpactMatrix(BaseModel):
    """Output of the Impact Analysis executor — the full IF x VEC matrix."""

    impact_factors: list[ImpactFactor] = Field(default_factory=list)
    cells: list[ImpactCell] = Field(default_factory=list)
