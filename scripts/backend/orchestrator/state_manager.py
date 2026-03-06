"""
EIA Screening Platform — State Manager
Enforces the project state machine and readiness gating.

Valid state transitions:
  draft -> ready_for_screening
  ready_for_screening -> exempt | screening_required
  screening_required -> analysis_complete
  analysis_complete -> under_review
  under_review -> finalised
  exempt -> finalised

Readiness gate blocks orchestration if required project fields are missing.
"""

from __future__ import annotations

import logging
from typing import Optional

from ..models.project import ProjectData, ProjectState

logger = logging.getLogger(__name__)

# Valid state transitions map
VALID_TRANSITIONS: dict[ProjectState, list[ProjectState]] = {
    ProjectState.DRAFT: [ProjectState.READY_FOR_SCREENING],
    ProjectState.READY_FOR_SCREENING: [
        ProjectState.EXEMPT,
        ProjectState.SCREENING_REQUIRED,
    ],
    ProjectState.SCREENING_REQUIRED: [ProjectState.ANALYSIS_COMPLETE],
    ProjectState.ANALYSIS_COMPLETE: [ProjectState.UNDER_REVIEW],
    ProjectState.UNDER_REVIEW: [ProjectState.FINALISED],
    ProjectState.EXEMPT: [ProjectState.FINALISED],
    ProjectState.FINALISED: [],
}


class ReadinessGate:
    """
    Validates that a project has sufficient data to proceed to screening.
    Returns (is_ready, missing_fields, completeness_percent).
    """

    REQUIRED_FIELDS = [
        ("name", "Project name"),
        ("description", "Project description"),
        ("profile.proponent", "Proponent name"),
        ("profile.project_type", "Project type"),
        ("profile.location.province", "Province"),
        ("profile.location.region", "Region"),
        ("profile.physical_activities", "Physical activities (at least one)"),
        ("profile.components", "Project components (at least one)"),
    ]

    @classmethod
    def validate(cls, project: ProjectData) -> tuple[bool, list[str], float]:
        """
        Check completeness of project data.
        Returns (is_ready, missing_fields, completeness_percentage).
        """
        missing: list[str] = []
        total = len(cls.REQUIRED_FIELDS)
        present = 0

        for field_path, label in cls.REQUIRED_FIELDS:
            value = cls._get_nested(project, field_path)
            if value is None or value == "" or value == []:
                missing.append(label)
            else:
                present += 1

        completeness = (present / total) * 100 if total > 0 else 0
        is_ready = len(missing) == 0
        return is_ready, missing, completeness

    @staticmethod
    def _get_nested(obj: object, path: str) -> object:
        """Safely traverse a dot-separated attribute path."""
        parts = path.split(".")
        current = obj
        for part in parts:
            if current is None:
                return None
            if isinstance(current, dict):
                current = current.get(part)
            else:
                current = getattr(current, part, None)
        return current


class StateManager:
    """
    Enforces the project state machine.
    Validates state transitions and prevents illegal moves.
    """

    @staticmethod
    def can_transition(current: ProjectState, target: ProjectState) -> bool:
        """Check if a state transition is valid."""
        return target in VALID_TRANSITIONS.get(current, [])

    @staticmethod
    def transition(project: ProjectData, target: ProjectState) -> ProjectData:
        """
        Attempt a state transition. Raises ValueError if invalid.
        """
        current = project.state
        if not StateManager.can_transition(current, target):
            allowed = VALID_TRANSITIONS.get(current, [])
            raise ValueError(
                f"Invalid state transition: {current.value} -> {target.value}. "
                f"Allowed targets: {[s.value for s in allowed]}"
            )
        project.state = target
        logger.info(f"State transition: {current.value} -> {target.value}")
        return project

    @staticmethod
    def check_readiness_and_advance(project: ProjectData) -> tuple[ProjectData, bool, list[str], float]:
        """
        Validate readiness and advance to READY_FOR_SCREENING if possible.
        Returns (project, is_ready, missing_fields, completeness).
        """
        is_ready, missing, completeness = ReadinessGate.validate(project)
        if is_ready and project.state == ProjectState.DRAFT:
            project = StateManager.transition(project, ProjectState.READY_FOR_SCREENING)
        return project, is_ready, missing, completeness
