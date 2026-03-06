"""
Executor 4: Context Analysis
Performs geospatial analysis and VEC identification.
Uses: Geospatial, VecsLibrary tools.
"""

from __future__ import annotations

import logging

from ..models.context import ContextResult, SensitiveArea, VECRecord, SpatialOverlay
from ..models.project import Severity
from ..models.state import WorkflowState
from ..tools.geospatial import find_sensitive_areas, compute_spatial_overlays
from ..tools.vecs_library import get_relevant_vecs

logger = logging.getLogger(__name__)


class ContextAnalysisExecutor:
    """
    Microsoft Agent Framework Executor for environmental context analysis.
    
    Responsibilities:
    - Run geospatial overlay analysis
    - Identify sensitive areas within buffer zone
    - Select relevant VECs based on context
    - Generate context summary
    """

    name = "context_analysis"
    display_name = "Context Analysis"

    async def execute(self, state: WorkflowState) -> WorkflowState:
        state.mark_executor_running(self.name, "Analysing environmental context...")
        logger.info(f"[{self.name}] Starting context analysis")

        try:
            coords = state.project.profile.location.coordinates

            # Step 1: Find sensitive areas
            lat = coords.lat if coords else 55.76
            lng = coords.lng if coords else -120.24
            raw_areas = find_sensitive_areas(lat, lng, buffer_km=100)

            sensitive_areas = [
                SensitiveArea(
                    id=a["id"],
                    name=a["name"],
                    area_type=a["type"],
                    distance_km=a["distance_km"],
                    severity=Severity(a["severity"]),
                    description=a["description"],
                    lat=a["coordinates"]["lat"],
                    lng=a["coordinates"]["lng"],
                )
                for a in raw_areas
            ]

            # Step 2: Compute spatial overlays
            raw_overlays = compute_spatial_overlays(lat, lng, raw_areas)
            spatial_overlays = [
                SpatialOverlay(
                    id=o["id"],
                    name=o["name"],
                    layer_type=o["layer_type"],
                    intersects=o["intersects"],
                    area_of_overlap_km2=o["area_of_overlap_km2"],
                )
                for o in raw_overlays
            ]

            # Step 3: Get relevant VECs
            area_types = list({a.area_type for a in sensitive_areas})
            raw_vecs = get_relevant_vecs(area_types, state.project.profile.project_type)
            vecs = [
                VECRecord(
                    id=v["id"],
                    name=v["name"],
                    category=v["category"],
                    description=v.get("description", ""),
                    relevance_score=v["relevance_score"],
                    regulatory_basis=v.get("regulatory_basis", ""),
                    selected=v["selected"],
                )
                for v in raw_vecs
            ]

            # Step 4: Generate summary
            critical_count = sum(1 for a in sensitive_areas if a.severity == Severity.CRITICAL)
            high_count = sum(1 for a in sensitive_areas if a.severity == Severity.HIGH)

            summary = (
                f"Identified {len(sensitive_areas)} sensitive areas within buffer zone "
                f"({critical_count} critical, {high_count} high severity). "
                f"Selected {sum(1 for v in vecs if v.selected)} VECs for detailed assessment. "
                f"{sum(1 for o in spatial_overlays if o.intersects)} spatial overlays detected."
            )

            state.context_result = ContextResult(
                sensitive_areas=sensitive_areas,
                vecs=vecs,
                spatial_overlays=spatial_overlays,
                context_summary=summary,
            )

            state.mark_executor_complete(
                self.name,
                f"Found {len(sensitive_areas)} sensitive areas, {len(vecs)} VECs",
            )

        except Exception as e:
            state.mark_executor_error(self.name, str(e))
            logger.error(f"[{self.name}] Error: {e}")

        return state
