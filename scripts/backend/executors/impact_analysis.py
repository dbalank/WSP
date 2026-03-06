"""
Executor 5: Impact Analysis
Generates the IF x VEC impact matrix.
Uses: ImpactFactorsLibrary tool.
"""

from __future__ import annotations

import logging

from ..models.impact import ImpactMatrix, ImpactFactor, ImpactCell
from ..models.project import Severity
from ..models.state import WorkflowState
from ..tools.impact_factors_library import get_factors_for_project_type, generate_severity_matrix

logger = logging.getLogger(__name__)


class ImpactAnalysisExecutor:
    """
    Microsoft Agent Framework Executor for impact analysis.
    
    Responsibilities:
    - Get relevant impact factors for the project type
    - Generate IF x VEC severity matrix
    - Produce ImpactMatrix with per-cell reasoning
    """

    name = "impact_analysis"
    display_name = "Impact Analysis"

    async def execute(self, state: WorkflowState) -> WorkflowState:
        state.mark_executor_running(self.name, "Generating impact matrix...")
        logger.info(f"[{self.name}] Starting impact analysis")

        try:
            if not state.context_result:
                raise ValueError("ContextResult required for impact analysis")

            # Step 1: Get impact factors
            raw_factors = get_factors_for_project_type(state.project.profile.project_type)

            factors = [
                ImpactFactor(
                    id=f["id"],
                    name=f["name"],
                    category=f["category"],
                    description=f.get("description", ""),
                    phase=f.get("phase", "Construction"),
                )
                for f in raw_factors
            ]

            # Step 2: Get selected VECs from context
            selected_vecs = [v for v in state.context_result.vecs if v.selected]

            # Step 3: Generate severity matrix
            raw_cells = generate_severity_matrix(
                raw_factors,
                [{"id": v.id, "name": v.name, "category": v.category} for v in selected_vecs],
                state.project.description,
            )

            cells = [
                ImpactCell(
                    impact_factor_id=c["impact_factor_id"],
                    vec_id=c["vec_id"],
                    severity=Severity(c["severity"]),
                    likelihood=c["likelihood"],
                    duration=c["duration"],
                    reversibility=c["reversibility"],
                    ai_reasoning=c["ai_reasoning"],
                )
                for c in raw_cells
            ]

            state.impact_matrix = ImpactMatrix(
                impact_factors=factors,
                vecs=selected_vecs,
                cells=cells,
            )

            # Stats
            critical_count = sum(1 for c in cells if c.severity == Severity.CRITICAL)
            high_count = sum(1 for c in cells if c.severity == Severity.HIGH)

            state.mark_executor_complete(
                self.name,
                f"Generated {len(cells)} cells ({critical_count} critical, {high_count} high)",
            )

        except Exception as e:
            state.mark_executor_error(self.name, str(e))
            logger.error(f"[{self.name}] Error: {e}")

        return state
