"""
EIA Screening Platform — Workflow State Model
Carries the complete state through the DAG.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .project import ProjectData
from .threshold import ThresholdEvaluation, ScreeningDecision
from .context import ContextResult
from .impact import ImpactMatrix
from .mitigation import MitigationResult
from .historical import HistoricalMatch
from .consistency import ConsistencyReport
from .report import ScreeningReport, ExemptionReport


class AgentPhase(str, enum.Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETE = "complete"
    ERROR = "error"
    SKIPPED = "skipped"


class AgentStatus(BaseModel):
    executor_name: str
    display_name: str
    phase: AgentPhase = AgentPhase.IDLE
    progress: float = Field(default=0.0, ge=0.0, le=100.0)
    message: str = ""
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class WorkflowState(BaseModel):
    """
    The master state object that flows through the entire DAG.
    Each executor reads from and writes to specific fields.
    """

    # Core project data
    project: ProjectData

    # Stage outputs (populated as executors complete)
    threshold_evaluation: Optional[ThresholdEvaluation] = None
    screening_decision: Optional[ScreeningDecision] = None
    context_result: Optional[ContextResult] = None
    impact_matrix: Optional[ImpactMatrix] = None
    mitigation_result: Optional[MitigationResult] = None
    historical_matches: list[HistoricalMatch] = Field(default_factory=list)
    consistency_report: Optional[ConsistencyReport] = None
    screening_report: Optional[ScreeningReport] = None
    exemption_report: Optional[ExemptionReport] = None

    # Orchestration tracking
    agent_statuses: list[AgentStatus] = Field(default_factory=list)
    current_executor: str = ""
    is_complete: bool = False
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    def mark_executor_running(self, name: str, message: str = "") -> None:
        for status in self.agent_statuses:
            if status.executor_name == name:
                status.phase = AgentPhase.RUNNING
                status.started_at = datetime.utcnow()
                status.message = message
                break
        self.current_executor = name

    def mark_executor_complete(self, name: str, message: str = "") -> None:
        for status in self.agent_statuses:
            if status.executor_name == name:
                status.phase = AgentPhase.COMPLETE
                status.progress = 100.0
                status.completed_at = datetime.utcnow()
                status.message = message
                break

    def mark_executor_error(self, name: str, error: str) -> None:
        for status in self.agent_statuses:
            if status.executor_name == name:
                status.phase = AgentPhase.ERROR
                status.message = error
                break
        self.error = error

    def mark_executor_skipped(self, name: str, reason: str = "") -> None:
        for status in self.agent_statuses:
            if status.executor_name == name:
                status.phase = AgentPhase.SKIPPED
                status.message = reason
                break
