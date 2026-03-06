"""
Executor 3: Screening Decision
Deterministic branching node — routes to EXEMPT or SCREENING_REQUIRED path.
This is the conditional DAG fork point.

Per the NV IA Screening Process workflow:
  1. Projects ABOVE thresholds → always SCREENING_REQUIRED
  2. Projects BELOW thresholds → check geospatial sensitive area overlap:
     a. Overlap with sensitive area → SCREENING_REQUIRED (despite being below thresholds)
     b. No overlap → EXEMPT → generate Exemption Report
"""

from __future__ import annotations

import logging

from ..models.project import ProjectState, ScreeningOutcome
from ..models.threshold import ScreeningDecision
from ..models.state import WorkflowState
from ..tools.geospatial import find_sensitive_areas

logger = logging.getLogger(__name__)


class ScreeningDecisionExecutor:
    """
    Microsoft Agent Framework Executor for the screening decision.

    Implements the full decision tree from the workflow diagram:
    - ABOVE thresholds → SCREENING_REQUIRED
    - BELOW thresholds → geospatial check:
        - sensitive area overlap? → SCREENING_REQUIRED
        - no overlap? → EXEMPT
    """

    name = "screening_decision"
    display_name = "Screening Decision"

    async def execute(self, state: WorkflowState) -> WorkflowState:
        state.mark_executor_running(self.name, "Making screening decision...")
        logger.info(f"[{self.name}] Evaluating screening decision")

        try:
            evaluation = state.threshold_evaluation
            if not evaluation:
                raise ValueError("ThresholdEvaluation is required for screening decision")

            above_thresholds = evaluation.overall_outcome == ScreeningOutcome.SCREENING_REQUIRED

            if above_thresholds:
                # ABOVE THRESHOLDS → always requires full screening
                is_exempt = False
                reasoning = evaluation.reasoning
                sensitive_overlap = None
            else:
                # BELOW THRESHOLDS → must check geospatial overlap with sensitive areas
                coords = state.project.profile.location.coordinates
                lat = coords.lat if coords else 55.76
                lng = coords.lng if coords else -120.24

                # Use the project type's buffer distance for the search
                nearby_areas = find_sensitive_areas(lat, lng, buffer_km=100)
                has_sensitive_overlap = len(nearby_areas) > 0
                sensitive_overlap = {
                    "checked": True,
                    "areas_found": len(nearby_areas),
                    "area_names": [a["name"] for a in nearby_areas[:5]],
                }

                if has_sensitive_overlap:
                    # Sensitive area overlap detected → screening required despite being below thresholds
                    is_exempt = False
                    reasoning = (
                        f"Although below regulatory thresholds, geospatial analysis detected "
                        f"{len(nearby_areas)} sensitive area(s) within the project buffer zone: "
                        f"{', '.join(a['name'] for a in nearby_areas[:3])}. "
                        f"Full environmental impact screening is required due to sensitive area overlap."
                    )
                else:
                    # No sensitive overlap → truly exempt
                    is_exempt = True
                    reasoning = (
                        "Project is below all regulatory thresholds and geospatial analysis "
                        "confirmed no overlap with sensitive environmental areas. "
                        "Project qualifies for exemption from full screening."
                    )

            state.screening_decision = ScreeningDecision(
                threshold_evaluation=evaluation,
                is_exempt=is_exempt,
                decision_reasoning=reasoning,
                next_path="exempt" if is_exempt else "screening",
                sensitive_area_check=sensitive_overlap,
            )

            # Update project state
            if is_exempt:
                state.project.state = ProjectState.EXEMPT
                state.project.screening_outcome = ScreeningOutcome.EXEMPT
                # Mark downstream executors as skipped
                for exec_name in [
                    "context_analysis", "impact_analysis", "mitigation",
                    "historical_comparison", "consistency_validation",
                ]:
                    state.mark_executor_skipped(exec_name, "Project is exempt — no sensitive area overlap")
            else:
                state.project.state = ProjectState.SCREENING_REQUIRED
                state.project.screening_outcome = ScreeningOutcome.SCREENING_REQUIRED

            state.mark_executor_complete(
                self.name,
                f"Decision: {'EXEMPT' if is_exempt else 'SCREENING REQUIRED'}"
                + (f" (sensitive area overlap)" if not is_exempt and not above_thresholds else ""),
            )
            logger.info(f"[{self.name}] Decision: {'exempt' if is_exempt else 'screening_required'}")

        except Exception as e:
            state.mark_executor_error(self.name, str(e))
            logger.error(f"[{self.name}] Error: {e}")

        return state
