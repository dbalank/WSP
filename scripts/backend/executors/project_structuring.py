"""
Executor 1: Project Structuring
Receives raw text/documents, extracts structured project profile using AI.
Uses: ProjectLibrary, DocumentExtraction tools.
"""

from __future__ import annotations

import logging
from datetime import datetime

from ..models.project import ProjectData, ProjectProfile, ProjectLocation, ExtractedField
from ..models.state import WorkflowState
from ..tools.project_library import match_project_type
from ..tools.document_extraction import extract_fields_from_text, validate_extraction

logger = logging.getLogger(__name__)


class ProjectStructuringExecutor:
    """
    Microsoft Agent Framework Executor for project structuring.
    
    Responsibilities:
    - Parse raw intake text using document extraction tools
    - Match to canonical project type from the library
    - Build a structured ProjectProfile
    - Calculate data completeness score
    """

    name = "project_structuring"
    display_name = "Project Structuring"

    async def execute(self, state: WorkflowState) -> WorkflowState:
        """Execute the project structuring phase."""
        state.mark_executor_running(self.name, "Extracting project data...")
        logger.info(f"[{self.name}] Starting extraction for project {state.project.id}")

        try:
            # Step 1: Extract fields from raw text
            raw_text = state.project.raw_intake_text or state.project.description
            extracted_fields = extract_fields_from_text(raw_text)

            # Step 2: Match project type
            matched_type = match_project_type(raw_text)

            # Step 3: Build profile
            profile = ProjectProfile(
                project_type=matched_type["name"] if matched_type else "",
                project_subtype=matched_type.get("subtypes", [""])[0] if matched_type else "",
                proponent=_find_field(extracted_fields, "Proponent"),
                location=ProjectLocation(
                    province=_find_field(extracted_fields, "Province"),
                    region=state.project.profile.location.region,
                    coordinates=state.project.profile.location.coordinates,
                    nearby_features=state.project.profile.location.nearby_features,
                    indigenous_territory=state.project.profile.location.indigenous_territory,
                ),
                physical_activities=state.project.profile.physical_activities,
                components=state.project.profile.components,
            )

            # Step 4: Validate and compute completeness
            validation = validate_extraction(extracted_fields)

            # Step 5: Update state
            state.project.profile = profile
            state.project.extracted_fields = [
                ExtractedField(
                    field_name=f["field_name"],
                    value=f["value"],
                    confidence=f["confidence"],
                    source=f["source"],
                    ai_reasoning=f["ai_reasoning"],
                )
                for f in extracted_fields
            ]
            state.project.completeness = validation["completeness_percent"]
            state.project.updated_at = datetime.utcnow()

            state.mark_executor_complete(
                self.name,
                f"Extracted {len(extracted_fields)} fields, completeness: {validation['completeness_percent']}%",
            )
            logger.info(f"[{self.name}] Completed: {len(extracted_fields)} fields extracted")

        except Exception as e:
            state.mark_executor_error(self.name, str(e))
            logger.error(f"[{self.name}] Error: {e}")

        return state


def _find_field(fields: list[dict], name: str) -> str:
    """Find a field value by name."""
    for f in fields:
        if f["field_name"] == name:
            return f["value"]
    return ""
