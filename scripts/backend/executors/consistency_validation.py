"""
Executor 8: Consistency Validation
Detects gaps and deviations from historical norms.
"""

from __future__ import annotations

import logging

from ..models.consistency import ConsistencyReport, ConsistencyGap, ConsistencyDeviation
from ..models.project import Severity
from ..models.state import WorkflowState

logger = logging.getLogger(__name__)


class ConsistencyValidationExecutor:
    """
    Microsoft Agent Framework Executor for consistency validation.
    
    Compares current screening against historical patterns
    to detect anomalies, gaps, and deviations.
    """

    name = "consistency_validation"
    display_name = "Consistency Validation"

    async def execute(self, state: WorkflowState) -> WorkflowState:
        state.mark_executor_running(self.name, "Validating consistency...")
        logger.info(f"[{self.name}] Starting consistency validation")

        try:
            gaps: list[ConsistencyGap] = []
            deviations: list[ConsistencyDeviation] = []
            recommendations: list[str] = []

            # Check mitigation coverage
            if state.mitigation_result:
                if state.mitigation_result.gap_analysis:
                    gaps.append(
                        ConsistencyGap(
                            id="gap_mit",
                            section="Mitigation",
                            description=f"{len(state.mitigation_result.gap_analysis)} impact interactions lack mitigation measures.",
                            severity=Severity.MODERATE,
                            suggested_fix="Develop project-specific mitigation measures for uncovered impact interactions.",
                        )
                    )
                    recommendations.append(
                        "Address mitigation gaps before finalising the screening report."
                    )

            # Check historical alignment
            if state.historical_matches:
                non_matching = [
                    m for m in state.historical_matches
                    if not m.decision_comparison.outcome_match
                ]
                if non_matching:
                    deviations.append(
                        ConsistencyDeviation(
                            id="dev_outcome",
                            section="Screening Decision",
                            description="Current outcome differs from some historical precedents.",
                            historical_norm=non_matching[0].outcome,
                            current_value=state.screening_decision.next_path if state.screening_decision else "unknown",
                            severity=Severity.LOW,
                        )
                    )
                    recommendations.append(
                        "Document rationale for outcome divergence from historical precedents."
                    )

            # Check VEC coverage
            if state.context_result and state.impact_matrix:
                selected_vecs = {v.id for v in state.context_result.vecs if v.selected}
                assessed_vecs = {c.vec_id for c in state.impact_matrix.cells}
                missing_vecs = selected_vecs - assessed_vecs
                if missing_vecs:
                    gaps.append(
                        ConsistencyGap(
                            id="gap_vecs",
                            section="Impact Analysis",
                            description=f"{len(missing_vecs)} selected VECs not assessed in the impact matrix.",
                            severity=Severity.HIGH,
                            suggested_fix="Include all selected VECs in the impact assessment matrix.",
                        )
                    )

            # Compute overall score
            penalty = len(gaps) * 8 + len(deviations) * 4
            overall_score = max(0, min(100, 100 - penalty))

            if overall_score >= 85:
                recommendations.append("Screening is consistent with historical practices.")
            elif overall_score >= 70:
                recommendations.append("Minor adjustments recommended for full alignment.")
            else:
                recommendations.append("Significant consistency issues require attention before finalisation.")

            state.consistency_report = ConsistencyReport(
                overall_score=overall_score,
                gaps=gaps,
                deviations=deviations,
                recommendations=recommendations,
            )

            state.mark_executor_complete(
                self.name,
                f"Score: {overall_score}%, {len(gaps)} gaps, {len(deviations)} deviations",
            )

        except Exception as e:
            state.mark_executor_error(self.name, str(e))
            logger.error(f"[{self.name}] Error: {e}")

        return state
