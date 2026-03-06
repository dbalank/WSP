"""
Executor 6: Mitigation
Matches mitigation measures to impact cells and identifies gaps.
Uses: MitigationLibrary tool.
"""

from __future__ import annotations

import logging

from ..models.mitigation import MitigationResult, MitigationMeasure, MitigationGap
from ..models.project import Severity
from ..models.state import WorkflowState
from ..tools.mitigation_library import match_measures_to_impacts, identify_gaps

logger = logging.getLogger(__name__)


class MitigationExecutor:
    """
    Microsoft Agent Framework Executor for mitigation generation.
    """

    name = "mitigation"
    display_name = "Mitigation"

    async def execute(self, state: WorkflowState) -> WorkflowState:
        state.mark_executor_running(self.name, "Matching mitigation measures...")
        logger.info(f"[{self.name}] Starting mitigation matching")

        try:
            if not state.impact_matrix:
                raise ValueError("ImpactMatrix required for mitigation")

            cells_raw = [c.model_dump() for c in state.impact_matrix.cells]
            factors_raw = [f.model_dump() for f in state.impact_matrix.impact_factors]
            vecs_raw = [{"id": v.id, "name": v.name, "category": v.category} for v in state.impact_matrix.vecs]

            # Match measures
            raw_measures = match_measures_to_impacts(cells_raw, factors_raw, vecs_raw)
            measures = [
                MitigationMeasure(
                    id=m["id"],
                    impact_factor_id=m["impact_factor_id"],
                    vec_id=m["vec_id"],
                    title=m["title"],
                    description=m["description"],
                    measure_type=m["type"],
                    effectiveness=Severity(m["effectiveness"]),
                    residual_impact=Severity(m["residual_impact"]),
                    source=m["source"],
                    is_custom=m["is_custom"],
                )
                for m in raw_measures
            ]

            # Identify gaps
            raw_gaps = identify_gaps(cells_raw, raw_measures, factors_raw, vecs_raw)
            gaps = [
                MitigationGap(
                    impact_factor_id=g["impact_factor_id"],
                    vec_id=g["vec_id"],
                    description=g["description"],
                    recommendation=g["recommendation"],
                )
                for g in raw_gaps
            ]

            state.mitigation_result = MitigationResult(
                measures=measures,
                summary=(
                    f"Identified {len(measures)} mitigation measures addressing "
                    f"significant impact interactions. {len(gaps)} gap(s) require "
                    f"project-specific measures."
                ),
                gap_analysis=gaps,
            )

            state.mark_executor_complete(
                self.name,
                f"Matched {len(measures)} measures, {len(gaps)} gaps",
            )

        except Exception as e:
            state.mark_executor_error(self.name, str(e))
            logger.error(f"[{self.name}] Error: {e}")

        return state
