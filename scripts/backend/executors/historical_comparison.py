"""
Executor 7: Historical Comparison
RAG-based search over past screening reports with dual comparison.
Uses: HistoricalRAG tool.

Per the NV IA Screening Process workflow, historical comparison happens
at TWO distinct points:
  Phase 1 (after Project Description + Context):
    - Is the list of components comparable?
    - Are the description length and style comparable?
    - Is there any gap?
    - What was the decision? What were the criteria?

  Phase 2 (after Impacts + Mitigation):
    - Is the list of impacts comparable?
    - Is the list of mitigation actions comparable?
    - Are the description length and style comparable?
    - Is there any gap?
    - What was the decision? What were the criteria?

This executor runs Phase 2 (post-impacts/mitigation). Phase 1 comparison
data is embedded within the same RAG search but tagged with comparison_phase.
"""

from __future__ import annotations

import logging

from ..models.historical import (
    HistoricalMatch,
    StructuralComparison,
    DecisionComparison,
)
from ..models.state import WorkflowState
from ..tools.historical_rag import (
    search_similar_projects,
    compute_structural_comparison,
    compute_decision_comparison,
)

logger = logging.getLogger(__name__)


class HistoricalComparisonExecutor:
    """
    Microsoft Agent Framework Executor for historical comparison.

    Implements dual-phase comparison as per the NV IA screening process:
    Phase 1: Project Description comparability (components, style, length, gaps)
    Phase 2: Impact/Mitigation comparability (impacts, measures, style, gaps)
    Both phases include decision criteria comparison (outcome + criteria alignment).
    """

    name = "historical_comparison"
    display_name = "Historical Comparison"

    async def execute(self, state: WorkflowState) -> WorkflowState:
        state.mark_executor_running(self.name, "Searching historical reports...")
        logger.info(f"[{self.name}] Starting dual-phase historical comparison")

        try:
            project = state.project

            # Step 1: RAG search for similar projects
            raw_matches = search_similar_projects(
                project_type=project.profile.project_type,
                province=project.profile.location.province,
                components=project.profile.components,
                top_k=3,
            )

            # Step 2: Build dual-phase comparisons for each match
            matches = []
            for raw in raw_matches:
                # PHASE 1: Project Description & Context comparison
                structural_phase1 = compute_structural_comparison(
                    project.profile.components, raw
                )
                structural_phase1["comparison_phase"] = "project_description"
                structural_phase1["checklist"] = {
                    "components_comparable": structural_phase1["component_overlap"] > 0.5,
                    "style_comparable": structural_phase1["style_consistency"] > 0.6,
                    "length_comparable": 0.7 < structural_phase1["length_ratio"] < 1.3,
                    "gaps_identified": structural_phase1["component_overlap"] < 0.8,
                }

                # PHASE 2: Impact & Mitigation comparison
                current_impact_factors = []
                current_mitigation_count = 0
                if state.impact_matrix:
                    current_impact_factors = [f.name for f in state.impact_matrix.impact_factors]
                if state.mitigation_result:
                    current_mitigation_count = len(state.mitigation_result.measures)

                hist_mitigation_count = raw.get("mitigation_count", 0)
                hist_vecs = raw.get("vecs_assessed", [])

                # Compute impact/mitigation comparability
                impact_overlap = 0.0
                if current_impact_factors and hist_vecs:
                    shared = len(set(v.lower() for v in current_impact_factors) & set(v.lower() for v in hist_vecs))
                    total = max(len(set(current_impact_factors) | set(hist_vecs)), 1)
                    impact_overlap = shared / total

                mitigation_ratio = 0.0
                if hist_mitigation_count > 0 and current_mitigation_count > 0:
                    mitigation_ratio = min(current_mitigation_count, hist_mitigation_count) / max(current_mitigation_count, hist_mitigation_count)

                structural_phase2 = {
                    "comparison_phase": "impacts_mitigation",
                    "impact_overlap": round(impact_overlap, 2),
                    "mitigation_ratio": round(mitigation_ratio, 2),
                    "style_consistency": structural_phase1["style_consistency"],
                    "checklist": {
                        "impacts_comparable": impact_overlap > 0.3,
                        "mitigations_comparable": mitigation_ratio > 0.5,
                        "style_comparable": structural_phase1["style_consistency"] > 0.6,
                        "gaps_identified": impact_overlap < 0.5 or mitigation_ratio < 0.5,
                    },
                    "notes": (
                        f"Impact factor overlap: {round(impact_overlap * 100)}%. "
                        f"Mitigation count ratio: {current_mitigation_count} vs {hist_mitigation_count} historical."
                    ),
                }

                # Decision comparison (applies to both phases)
                decision = compute_decision_comparison(
                    state.screening_decision.next_path if state.screening_decision else "screening",
                    raw,
                )

                matches.append(
                    HistoricalMatch(
                        id=raw["id"],
                        project_name=raw["project_name"],
                        project_type=raw["project_type"],
                        year=raw["year"],
                        outcome=raw["outcome"],
                        similarity_score=raw["_similarity"],
                        structural_comparison=StructuralComparison(
                            component_overlap=structural_phase1["component_overlap"],
                            style_consistency=structural_phase1["style_consistency"],
                            length_ratio=structural_phase1["length_ratio"],
                            notes=structural_phase1["notes"],
                            comparison_phase="project_description",
                            phase1_checklist=structural_phase1["checklist"],
                        ),
                        impact_mitigation_comparison=StructuralComparison(
                            component_overlap=structural_phase2["impact_overlap"],
                            style_consistency=structural_phase2["style_consistency"],
                            length_ratio=structural_phase2["mitigation_ratio"],
                            notes=structural_phase2["notes"],
                            comparison_phase="impacts_mitigation",
                            phase2_checklist=structural_phase2["checklist"],
                        ),
                        decision_comparison=DecisionComparison(
                            outcome_match=decision["outcome_match"],
                            criteria_alignment=decision["criteria_alignment"],
                            divergences=decision["divergences"],
                            notes=decision["notes"],
                        ),
                    )
                )

            state.historical_matches = matches

            state.mark_executor_complete(
                self.name,
                f"Found {len(matches)} similar projects with dual-phase comparison",
            )

        except Exception as e:
            state.mark_executor_error(self.name, str(e))
            logger.error(f"[{self.name}] Error: {e}")

        return state
