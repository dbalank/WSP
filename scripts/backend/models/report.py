"""
EIA Screening Platform — Report Data Models
"""

from __future__ import annotations

import enum
from datetime import datetime

from pydantic import BaseModel, Field


class SourceType(str, enum.Enum):
    REGULATION = "regulation"
    LIBRARY = "library"
    HISTORICAL = "historical"
    AI_GENERATED = "ai_generated"


class ReportStatus(str, enum.Enum):
    DRAFT = "draft"
    REVIEW = "review"
    FINAL = "final"


class SourceTrace(BaseModel):
    id: str
    source_type: SourceType = SourceType.AI_GENERATED
    reference: str = ""
    excerpt: str = ""


class ReportSection(BaseModel):
    id: str
    title: str
    content: str = ""
    sources: list[SourceTrace] = Field(default_factory=list)
    order: int = 0
    is_edited: bool = False


class AuditEntry(BaseModel):
    id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: str
    actor: str = "system"
    section: str = ""
    previous_value: str = ""
    new_value: str = ""


class ScreeningReport(BaseModel):
    """Full screening report — output of the Report Generation executor."""

    id: str
    project_id: str
    title: str = ""
    sections: list[ReportSection] = Field(default_factory=list)
    audit_trail: list[AuditEntry] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    status: ReportStatus = ReportStatus.DRAFT


class ExemptionReport(BaseModel):
    """Short-form report for exempt projects."""

    id: str
    project_id: str
    title: str = ""
    exemption_basis: str = ""
    reasoning: str = ""
    regulatory_references: list[str] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)
