"""
Executor 2: Legal Threshold Evaluation
Categorizes the project against regulatory thresholds.
Uses: LegalLibrary tool.
"""

from __future__ import annotations

import logging

from ..models.project import ScreeningOutcome
from ..models.threshold import ThresholdEvaluation, ThresholdTrigger, RegulatoryReference
from ..models.state import WorkflowState
from ..tools.legal_library import get_thresholds_for_type, evaluate_threshold

logger = logging.getLogger(__name__)


class LegalThresholdExecutor:
    """
    Microsoft Agent Framework Executor for legal threshold evaluation.
    
    Responsibilities:
    - Retrieve applicable thresholds for the project type
    - Evaluate each threshold against project data
    - Produce a ThresholdEvaluation with triggered/not-triggered status
    """

    name = "legal_threshold"
    display_name = "Legal Threshold"

    async def execute(self, state: WorkflowState) -> WorkflowState:
        state.mark_executor_running(self.name, "Evaluating regulatory thresholds...")
        logger.info(f"[{self.name}] Starting threshold evaluation")

        try:
            project = state.project
            project_type_id = _infer_type_id(project.profile.project_type)

            # Step 1: Get applicable thresholds
            thresholds = get_thresholds_for_type(project_type_id)

            # Step 2: Evaluate each threshold
            evaluations = []
            for threshold in thresholds:
                result = evaluate_threshold(threshold, project.model_dump())
                evaluations.append(result)

            # Step 3: Build evaluation result
            triggers = [
                ThresholdTrigger(
                    id=e["threshold_id"],
                    name=e["threshold_name"],
                    description=e.get("description", ""),
                    triggered=e["triggered"],
                    confidence=e["confidence"],
                    reasoning=e["reasoning"],
                    regulatory_ref=e["regulatory_ref"],
                )
                for e in evaluations
            ]

            any_triggered = any(t.triggered for t in triggers)
            outcome = ScreeningOutcome.SCREENING_REQUIRED if any_triggered else ScreeningOutcome.EXEMPT

            state.threshold_evaluation = ThresholdEvaluation(
                project_type_id=project_type_id,
                project_type_name=project.profile.project_type,
                regulatory_references=[
                    RegulatoryReference(
                        id=f"ref_{i}",
                        name=t.get("name", ""),
                        section=t.get("regulatory_ref", ""),
                        description=t.get("description", ""),
                    )
                    for i, t in enumerate(thresholds)
                ],
                triggers=triggers,
                overall_outcome=outcome,
                reasoning=_build_reasoning(triggers, outcome),
            )

            state.mark_executor_complete(
                self.name,
                f"Evaluated {len(triggers)} thresholds — outcome: {outcome.value}",
            )

        except Exception as e:
            state.mark_executor_error(self.name, str(e))
            logger.error(f"[{self.name}] Error: {e}")

        return state


def _infer_type_id(project_type_name: str) -> str:
    """Map project type name to ID."""
    mapping = {
        "natural gas pipeline": "pipeline_gas",
        "oil pipeline": "pipeline_oil",
        "metal mine": "mine_metal",
        "wind energy facility": "wind_farm",
        "hydroelectric dam": "hydro_dam",
        "lng terminal": "lng_terminal",
    }
    return mapping.get(project_type_name.lower(), "pipeline_gas")


def _build_reasoning(triggers: list[ThresholdTrigger], outcome: ScreeningOutcome) -> str:
    triggered_names = [t.name for t in triggers if t.triggered]
    if not triggered_names:
        return "No regulatory thresholds triggered. Project qualifies for exemption from full screening."
    return (
        f"Project triggers {len(triggered_names)} threshold(s): {', '.join(triggered_names)}. "
        f"Full environmental impact screening is required under the Impact Assessment Act."
    )
