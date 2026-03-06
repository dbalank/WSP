"""
Executor 9: Report Generation
Assembles the final screening report from all upstream data.
Supports both Exemption and Full Screening report types.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

from ..models.report import (
    ScreeningReport,
    ExemptionReport,
    ReportSection,
    SourceTrace,
    AuditEntry,
)
from ..models.project import ProjectState
from ..models.state import WorkflowState

logger = logging.getLogger(__name__)


class ReportGenerationExecutor:
    """
    Microsoft Agent Framework Executor for report generation.
    
    Implements progressive section generation:
    - Exemption path: compact report with exemption justification
    - Full screening path: comprehensive multi-section report
    """

    name = "report_generation"
    display_name = "Report Generation"

    async def execute(self, state: WorkflowState) -> WorkflowState:
        state.mark_executor_running(self.name, "Generating report...")
        logger.info(f"[{self.name}] Starting report generation")

        try:
            if state.screening_decision and state.screening_decision.is_exempt:
                state.exemption_report = self._generate_exemption_report(state)
            else:
                state.screening_report = self._generate_screening_report(state)

            state.project.state = ProjectState.UNDER_REVIEW
            state.is_complete = True
            state.completed_at = datetime.utcnow()

            state.mark_executor_complete(self.name, "Report generated successfully")

        except Exception as e:
            state.mark_executor_error(self.name, str(e))
            logger.error(f"[{self.name}] Error: {e}")

        return state

    def _generate_exemption_report(self, state: WorkflowState) -> ExemptionReport:
        """Generate a compact exemption report."""
        return ExemptionReport(
            id=f"rpt_{uuid.uuid4().hex[:8]}",
            project_id=state.project.id,
            title=f"Exemption Report: {state.project.name}",
            exemption_basis=(
                state.threshold_evaluation.reasoning
                if state.threshold_evaluation
                else "No regulatory thresholds triggered."
            ),
            regulatory_references=[
                ref.model_dump()
                for ref in (state.threshold_evaluation.regulatory_references if state.threshold_evaluation else [])
            ],
            generated_at=datetime.utcnow(),
        )

    def _generate_screening_report(self, state: WorkflowState) -> ScreeningReport:
        """Generate a comprehensive screening report with all sections."""
        sections: list[ReportSection] = []
        order = 0

        # Section 1: Executive Summary
        order += 1
        sections.append(ReportSection(
            id=f"sec_{order}",
            title="Executive Summary",
            content=self._build_executive_summary(state),
            sources=[
                SourceTrace(id="src_1", source_type="ai_generated", reference="AI Summary Engine", excerpt="Generated from project data and analysis results."),
            ],
            order=order,
        ))

        # Section 2: Project Description
        order += 1
        sections.append(ReportSection(
            id=f"sec_{order}",
            title="Project Description",
            content=(
                f"{state.project.name}\n\n"
                f"{state.project.description}\n\n"
                f"Proponent: {state.project.profile.proponent}\n"
                f"Location: {state.project.profile.location.province}, {state.project.profile.location.region}\n"
                f"Project Type: {state.project.profile.project_type} ({state.project.profile.project_subtype})\n\n"
                f"Physical Activities:\n" + "\n".join(f"  - {a}" for a in state.project.profile.physical_activities) + "\n\n"
                f"Components:\n" + "\n".join(f"  - {c}" for c in state.project.profile.components)
            ),
            sources=[
                SourceTrace(id="src_2", source_type="ai_generated", reference="Project Intake Data", excerpt="Extracted from project description."),
            ],
            order=order,
        ))

        # Section 3: Legal Threshold Analysis
        order += 1
        if state.threshold_evaluation:
            trigger_text = "\n".join(
                f"  - {t.name}: {'TRIGGERED' if t.triggered else 'Not triggered'} (Confidence: {t.confidence:.0%})\n    {t.reasoning}"
                for t in state.threshold_evaluation.triggers
            )
            sections.append(ReportSection(
                id=f"sec_{order}",
                title="Legal Threshold Analysis",
                content=(
                    f"Project Type: {state.threshold_evaluation.project_type_name}\n"
                    f"Overall Outcome: {state.threshold_evaluation.overall_outcome}\n\n"
                    f"Threshold Evaluations:\n{trigger_text}\n\n"
                    f"Reasoning: {state.threshold_evaluation.reasoning}"
                ),
                sources=[
                    SourceTrace(id="src_3", source_type="regulation", reference=ref.section, excerpt=ref.description)
                    for ref in state.threshold_evaluation.regulatory_references[:3]
                ],
                order=order,
            ))

        # Section 4: Environmental Context
        order += 1
        if state.context_result:
            area_text = "\n".join(
                f"  - {a.name} ({a.area_type}): {a.severity.value} severity, {a.distance_km}km"
                for a in state.context_result.sensitive_areas
            )
            vec_text = "\n".join(
                f"  - {v.name} ({v.category}): relevance {v.relevance_score:.0%}"
                for v in state.context_result.vecs if v.selected
            )
            sections.append(ReportSection(
                id=f"sec_{order}",
                title="Environmental Context",
                content=(
                    f"Sensitive Areas:\n{area_text}\n\n"
                    f"Selected VECs:\n{vec_text}\n\n"
                    f"Summary: {state.context_result.context_summary}"
                ),
                sources=[
                    SourceTrace(id="src_4", source_type="library", reference="Geospatial Analysis", excerpt="Spatial overlay results."),
                ],
                order=order,
            ))

        # Section 5: Impact Assessment
        order += 1
        if state.impact_matrix:
            critical = sum(1 for c in state.impact_matrix.cells if c.severity.value == "critical")
            high = sum(1 for c in state.impact_matrix.cells if c.severity.value == "high")
            sections.append(ReportSection(
                id=f"sec_{order}",
                title="Impact Assessment Matrix",
                content=(
                    f"Impact Matrix: {len(state.impact_matrix.impact_factors)} factors x {len(state.impact_matrix.vecs)} VECs = "
                    f"{len(state.impact_matrix.cells)} interactions assessed.\n\n"
                    f"Critical impacts: {critical}\n"
                    f"High impacts: {high}\n"
                    f"Total significant interactions: {critical + high}"
                ),
                sources=[
                    SourceTrace(id="src_5", source_type="ai_generated", reference="Impact Analysis Engine", excerpt="AI-generated severity assessments."),
                ],
                order=order,
            ))

        # Section 6: Mitigation Measures
        order += 1
        if state.mitigation_result:
            measures_text = "\n".join(
                f"  - {m.title} ({m.measure_type}): {m.description}"
                for m in state.mitigation_result.measures[:10]
            )
            sections.append(ReportSection(
                id=f"sec_{order}",
                title="Mitigation Measures",
                content=(
                    f"Total measures: {len(state.mitigation_result.measures)}\n\n"
                    f"Key Measures:\n{measures_text}\n\n"
                    f"Gaps: {len(state.mitigation_result.gap_analysis)}\n"
                    f"Summary: {state.mitigation_result.summary}"
                ),
                sources=[
                    SourceTrace(id="src_6", source_type="library", reference="Mitigation Library", excerpt="Standard mitigation measures."),
                ],
                order=order,
            ))

        # Section 7: Conclusions
        order += 1
        sections.append(ReportSection(
            id=f"sec_{order}",
            title="Conclusions and Recommendations",
            content=self._build_conclusions(state),
            sources=[
                SourceTrace(id="src_7", source_type="ai_generated", reference="AI Conclusions Engine", excerpt="Synthesised from all upstream analyses."),
            ],
            order=order,
        ))

        # Build audit trail
        audit_trail = [
            AuditEntry(
                id="audit_1",
                timestamp=datetime.utcnow(),
                action="Report Generated",
                actor="EIA Agent Framework",
                section="All",
                previous_value="",
                new_value="Initial report generation",
            ),
        ]

        return ScreeningReport(
            id=f"rpt_{uuid.uuid4().hex[:8]}",
            project_id=state.project.id,
            title=f"Environmental Impact Screening Report: {state.project.name}",
            sections=sections,
            audit_trail=audit_trail,
            generated_at=datetime.utcnow(),
            status="draft",
        )

    def _build_executive_summary(self, state: WorkflowState) -> str:
        project = state.project
        lines = [
            f"This report presents the environmental impact screening assessment for the {project.name}, "
            f"proposed by {project.profile.proponent} in {project.profile.location.province}.",
            "",
        ]

        if state.threshold_evaluation:
            lines.append(
                f"Legal threshold analysis determined: {state.threshold_evaluation.overall_outcome}. "
                f"{state.threshold_evaluation.reasoning}"
            )

        if state.impact_matrix:
            critical = sum(1 for c in state.impact_matrix.cells if c.severity.value == "critical")
            lines.append(f"\nThe impact assessment identified {critical} critical interactions requiring attention.")

        if state.consistency_report:
            lines.append(f"\nConsistency validation score: {state.consistency_report.overall_score}%.")

        return "\n".join(lines)

    def _build_conclusions(self, state: WorkflowState) -> str:
        lines = ["Based on the comprehensive assessment:\n"]

        if state.threshold_evaluation:
            lines.append(f"1. The project {'requires' if state.threshold_evaluation.overall_outcome == 'screening_required' else 'is exempt from'} full environmental impact assessment.")

        if state.mitigation_result:
            lines.append(f"2. {len(state.mitigation_result.measures)} mitigation measures have been identified.")
            if state.mitigation_result.gap_analysis:
                lines.append(f"3. {len(state.mitigation_result.gap_analysis)} mitigation gap(s) require project-specific attention.")

        if state.consistency_report:
            lines.append(f"4. Overall consistency with historical screening practices: {state.consistency_report.overall_score}%.")

        return "\n".join(lines)
