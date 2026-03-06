"""
Screening orchestration routes.
Handles the full workflow execution (orchestrate), status polling,
and individual step endpoints (intake, legal, impact, etc.).
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from ..models.project import ProjectData, ProjectState
from ..models.state import WorkflowState, AgentStatus
from ..orchestrator.state_manager import StateManager, ReadinessGate
from ..orchestrator.workflow_builder import (
    WorkflowBuilder,
    is_exempt,
    is_screening_required,
)
from ..executors.project_structuring import ProjectStructuringExecutor
from ..executors.legal_threshold import LegalThresholdExecutor
from ..executors.screening_decision import ScreeningDecisionExecutor
from ..executors.context_analysis import ContextAnalysisExecutor
from ..executors.impact_analysis import ImpactAnalysisExecutor
from ..executors.mitigation import MitigationExecutor
from ..executors.historical_comparison import HistoricalComparisonExecutor
from ..executors.consistency_validation import ConsistencyValidationExecutor
from ..executors.report_generation import ReportGenerationExecutor
from .projects import get_project_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/project", tags=["screening"])

# Stores active workflow states per project
_workflow_states: dict[str, WorkflowState] = {}


class ReadinessResponse(BaseModel):
    is_ready: bool
    missing_fields: list[str]
    completeness: float


class OrchestrationStatusResponse(BaseModel):
    is_complete: bool
    error: Optional[str]
    agent_statuses: list[AgentStatus]
    current_executor: str


class IntakeExtractRequest(BaseModel):
    raw_text: str


class IntakeRefineRequest(BaseModel):
    field: str
    value: str


def _build_workflow():
    """Construct the adaptive DAG workflow with all executors."""
    return (
        WorkflowBuilder("EIA Screening Workflow")
        .add_executor(ProjectStructuringExecutor())
        .add_executor(LegalThresholdExecutor())
        .add_executor(ScreeningDecisionExecutor())
        .add_executor(ContextAnalysisExecutor())
        .add_executor(ImpactAnalysisExecutor())
        .add_executor(MitigationExecutor())
        .add_executor(HistoricalComparisonExecutor())
        .add_executor(ConsistencyValidationExecutor())
        .add_executor(ReportGenerationExecutor())
        # Linear chain: structuring -> legal -> screening_decision
        .add_edge("project_structuring", "legal_threshold")
        .add_edge("legal_threshold", "screening_decision")
        # CONDITIONAL BRANCH: exempt path
        .add_edge(
            "screening_decision",
            "report_generation",
            condition=is_exempt,
            label="Exempt — skip to report",
        )
        # CONDITIONAL BRANCH: full screening path
        .add_edge(
            "screening_decision",
            "context_analysis",
            condition=is_screening_required,
            label="Full screening required",
        )
        .add_edge("context_analysis", "impact_analysis")
        .add_edge("impact_analysis", "mitigation")
        .add_edge("mitigation", "historical_comparison")
        .add_edge("historical_comparison", "consistency_validation")
        .add_edge("consistency_validation", "report_generation")
        .set_entry_point("project_structuring")
        .build()
    )


async def _run_workflow(project_id: str, project: ProjectData) -> None:
    """Background task: execute the full workflow."""
    state = WorkflowState(project=project)
    _workflow_states[project_id] = state

    workflow = _build_workflow()
    try:
        _workflow_states[project_id] = await workflow.execute(state)
    except Exception as e:
        state.error = str(e)
        state.is_complete = True
        _workflow_states[project_id] = state
        logger.error(f"Workflow failed for {project_id}: {e}")


# ───────────────────────────────────────
# Readiness & Orchestration
# ───────────────────────────────────────

@router.post("/{project_id}/validate-readiness")
async def validate_readiness(project_id: str) -> ReadinessResponse:
    """Check if a project is ready for screening."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    project = store[project_id]
    is_ready, missing, completeness = ReadinessGate.validate(project)
    return ReadinessResponse(
        is_ready=is_ready,
        missing_fields=missing,
        completeness=completeness,
    )


@router.post("/{project_id}/orchestrate")
async def start_orchestration(
    project_id: str, background_tasks: BackgroundTasks
) -> dict:
    """Start the full screening workflow as a background task."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    project = store[project_id]

    # Check readiness
    is_ready, missing, _ = ReadinessGate.validate(project)
    if not is_ready:
        raise HTTPException(
            status_code=400,
            detail=f"Project not ready. Missing: {', '.join(missing)}",
        )

    # Advance state
    if project.state == ProjectState.DRAFT:
        project = StateManager.transition(project, ProjectState.READY_FOR_SCREENING)
        store[project_id] = project

    background_tasks.add_task(_run_workflow, project_id, project)
    return {"status": "started", "project_id": project_id}


@router.get("/{project_id}/orchestrate/status")
async def get_orchestration_status(project_id: str) -> OrchestrationStatusResponse:
    """Poll the current orchestration status."""
    state = _workflow_states.get(project_id)
    if not state:
        return OrchestrationStatusResponse(
            is_complete=False,
            error=None,
            agent_statuses=[],
            current_executor="",
        )
    return OrchestrationStatusResponse(
        is_complete=state.is_complete,
        error=state.error,
        agent_statuses=state.agent_statuses,
        current_executor=state.current_executor,
    )


# ───────────────────────────────────────
# Individual Step Endpoints
# ───────────────────────────────────────

@router.post("/{project_id}/intake/extract")
async def extract_intake(project_id: str, req: IntakeExtractRequest) -> dict:
    """Run the ProjectStructuring executor on raw text input."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    project = store[project_id]
    project.description = req.raw_text

    executor = ProjectStructuringExecutor()
    state = WorkflowState(project=project)
    state = await executor.execute(state)
    store[project_id] = state.project

    return {
        "project": state.project.model_dump(),
        "extraction_confidence": 0.85,
    }


@router.post("/{project_id}/intake/refine")
async def refine_intake(project_id: str, req: IntakeRefineRequest) -> dict:
    """Manually refine an extracted field."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    project = store[project_id]

    # Simple field setter — maps flat field name to nested attribute
    field_map = {
        "name": lambda p, v: setattr(p, "name", v),
        "description": lambda p, v: setattr(p, "description", v),
        "proponent": lambda p, v: setattr(p.profile, "proponent", v),
        "project_type": lambda p, v: setattr(p.profile, "project_type", v),
        "project_subtype": lambda p, v: setattr(p.profile, "project_subtype", v),
        "province": lambda p, v: setattr(p.profile.location, "province", v),
        "region": lambda p, v: setattr(p.profile.location, "region", v),
    }

    setter = field_map.get(req.field)
    if setter:
        setter(project, req.value)
        project.updated_at = datetime.utcnow()
        store[project_id] = project
    else:
        raise HTTPException(status_code=400, detail=f"Unknown field: {req.field}")

    return {"project": project.model_dump()}


@router.post("/{project_id}/legal-categorization")
async def legal_categorization(project_id: str) -> dict:
    """Run legal threshold analysis on the project."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    project = store[project_id]
    executor = LegalThresholdExecutor()
    state = WorkflowState(project=project)
    state = await executor.execute(state)

    return {
        "threshold_evaluation": state.threshold_evaluation.model_dump() if state.threshold_evaluation else None,
    }


@router.post("/{project_id}/screening-decision")
async def screening_decision(project_id: str) -> dict:
    """Run the screening decision based on legal threshold output."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get cached workflow state or create new
    wf_state = _workflow_states.get(project_id)
    if not wf_state:
        raise HTTPException(status_code=400, detail="Run legal categorization first")

    executor = ScreeningDecisionExecutor()
    wf_state = await executor.execute(wf_state)
    _workflow_states[project_id] = wf_state

    return {
        "screening_decision": wf_state.screening_decision.model_dump() if wf_state.screening_decision else None,
    }


@router.post("/{project_id}/context-analysis")
async def context_analysis(project_id: str) -> dict:
    """Run environmental context analysis."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    executor = ContextAnalysisExecutor()
    state = _workflow_states.get(project_id, WorkflowState(project=store[project_id]))
    state = await executor.execute(state)
    _workflow_states[project_id] = state

    return {
        "context_result": state.context_result.model_dump() if state.context_result else None,
    }


@router.post("/{project_id}/impact-analysis")
async def impact_analysis(project_id: str) -> dict:
    """Run impact factor x VEC matrix analysis."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    executor = ImpactAnalysisExecutor()
    state = _workflow_states.get(project_id, WorkflowState(project=store[project_id]))
    state = await executor.execute(state)
    _workflow_states[project_id] = state

    return {
        "impact_matrix": state.impact_matrix.model_dump() if state.impact_matrix else None,
    }


@router.post("/{project_id}/mitigation")
async def mitigation_analysis(project_id: str) -> dict:
    """Generate mitigation measures for identified impacts."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    executor = MitigationExecutor()
    state = _workflow_states.get(project_id, WorkflowState(project=store[project_id]))
    state = await executor.execute(state)
    _workflow_states[project_id] = state

    return {
        "mitigation_result": state.mitigation_result.model_dump() if state.mitigation_result else None,
    }


@router.post("/{project_id}/historical-comparison")
async def historical_comparison(project_id: str) -> dict:
    """Run historical comparison analysis."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    executor = HistoricalComparisonExecutor()
    state = _workflow_states.get(project_id, WorkflowState(project=store[project_id]))
    state = await executor.execute(state)
    _workflow_states[project_id] = state

    return {
        "historical_matches": [m.model_dump() for m in state.historical_matches],
    }


@router.post("/{project_id}/consistency-check")
async def consistency_check(project_id: str) -> dict:
    """Run consistency validation."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    executor = ConsistencyValidationExecutor()
    state = _workflow_states.get(project_id, WorkflowState(project=store[project_id]))
    state = await executor.execute(state)
    _workflow_states[project_id] = state

    return {
        "consistency_report": state.consistency_report.model_dump() if state.consistency_report else None,
    }


@router.post("/{project_id}/report")
async def generate_report(project_id: str) -> dict:
    """Generate the final screening report."""
    store = get_project_store()
    if project_id not in store:
        raise HTTPException(status_code=404, detail="Project not found")

    executor = ReportGenerationExecutor()
    state = _workflow_states.get(project_id, WorkflowState(project=store[project_id]))
    state = await executor.execute(state)
    _workflow_states[project_id] = state

    report = state.screening_report or state.exemption_report
    return {
        "report": report.model_dump() if report else None,
    }


@router.get("/{project_id}/workflow-state")
async def get_full_workflow_state(project_id: str) -> dict:
    """Return the complete workflow state for debugging / frontend consumption."""
    state = _workflow_states.get(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="No workflow state found")
    return state.model_dump()
