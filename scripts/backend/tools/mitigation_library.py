"""
Tool: Mitigation Measures Library
Provides lookup and matching of mitigation measures to impact interactions.
"""

from __future__ import annotations

# Static mitigation measures catalogue
_MEASURES_CATALOGUE: list[dict] = [
    {
        "id": "mit_reduced_footprint",
        "title": "Reduced Operational Footprint",
        "description": "Narrow ROW width through sensitive habitat zones to minimise disturbance area.",
        "type": "minimisation",
        "applicable_factors": ["Vegetation Clearing", "Habitat Fragmentation"],
        "applicable_vecs": ["Wildlife", "Vegetation"],
        "effectiveness": "high",
        "source": "Wildlife Recovery Best Practices",
    },
    {
        "id": "mit_hdd",
        "title": "Horizontal Directional Drilling",
        "description": "HDD crossings to avoid in-stream construction and riparian disturbance at waterway crossings.",
        "type": "avoidance",
        "applicable_factors": ["Watercourse Alteration"],
        "applicable_vecs": ["Aquatic", "Physical"],
        "effectiveness": "high",
        "source": "DFO Fish Habitat Guidelines",
    },
    {
        "id": "mit_timing",
        "title": "Seasonal Timing Restrictions",
        "description": "No construction within sensitive zones during critical wildlife periods (breeding, calving, nesting).",
        "type": "avoidance",
        "applicable_factors": ["Noise & Vibration", "Vegetation Clearing", "Habitat Fragmentation"],
        "applicable_vecs": ["Wildlife"],
        "effectiveness": "high",
        "source": "Federal Species Recovery Strategies",
    },
    {
        "id": "mit_erosion",
        "title": "Erosion and Sediment Control Plan",
        "description": "Comprehensive erosion control including silt fencing, check dams, and revegetation scheduling.",
        "type": "minimisation",
        "applicable_factors": ["Watercourse Alteration", "Spill / Contamination"],
        "applicable_vecs": ["Aquatic", "Physical"],
        "effectiveness": "moderate",
        "source": "BC Water Sustainability Act Guidelines",
    },
    {
        "id": "mit_indigenous_plan",
        "title": "Indigenous Engagement and Accommodation Plan",
        "description": "Structured engagement process with affected First Nations including traditional land use mapping.",
        "type": "minimisation",
        "applicable_factors": ["Land Use Disruption"],
        "applicable_vecs": ["Indigenous"],
        "effectiveness": "moderate",
        "source": "Crown Consultation Guidelines",
    },
    {
        "id": "mit_reclamation",
        "title": "Progressive Reclamation Program",
        "description": "Phased revegetation using native seed mixes and monitoring for minimum 5 years post-construction.",
        "type": "rehabilitation",
        "applicable_factors": ["Vegetation Clearing", "Habitat Fragmentation"],
        "applicable_vecs": ["Wildlife", "Vegetation", "Physical"],
        "effectiveness": "moderate",
        "source": "Provincial Reclamation Standards",
    },
    {
        "id": "mit_spill_response",
        "title": "Spill Prevention and Response Plan",
        "description": "Containment systems, spill kits at all crossing locations, and emergency response within 2 hours.",
        "type": "minimisation",
        "applicable_factors": ["Spill / Contamination"],
        "applicable_vecs": ["Aquatic", "Physical"],
        "effectiveness": "high",
        "source": "Transport Canada ERPG",
    },
    {
        "id": "mit_ghg_offset",
        "title": "GHG Emission Offset Program",
        "description": "Carbon offset credits and best-available emission control technology for compressor stations.",
        "type": "offset",
        "applicable_factors": ["Emissions (GHG)"],
        "applicable_vecs": ["Climate", "Physical"],
        "effectiveness": "moderate",
        "source": "BC Carbon Tax Act",
    },
]


def get_all_measures() -> list[dict]:
    """Return the full mitigation measures catalogue."""
    return _MEASURES_CATALOGUE


def match_measures_to_impacts(
    impact_cells: list[dict],
    factors: list[dict],
    vecs: list[dict],
) -> list[dict]:
    """
    Match mitigation measures to identified high/critical impact cells.
    Returns matched measures with residual impact estimates.
    """
    # Build lookup maps
    factor_map = {f["id"]: f for f in factors}
    vec_map = {v["id"]: v for v in vecs}

    matched: list[dict] = []
    seen: set[str] = set()

    # Only consider cells with moderate+ severity
    significant_cells = [
        c for c in impact_cells
        if c.get("severity") in ("moderate", "high", "critical")
    ]

    for cell in significant_cells:
        factor = factor_map.get(cell["impact_factor_id"], {})
        vec = vec_map.get(cell["vec_id"], {})

        for measure in _MEASURES_CATALOGUE:
            key = f"{measure['id']}_{cell['impact_factor_id']}_{cell['vec_id']}"
            if key in seen:
                continue

            # Check if measure applies to this factor/VEC combination
            factor_match = any(
                kw.lower() in factor.get("name", "").lower()
                for kw in measure.get("applicable_factors", [])
            )
            vec_match = any(
                kw.lower() in vec.get("category", "").lower()
                for kw in measure.get("applicable_vecs", [])
            )

            if factor_match or vec_match:
                seen.add(key)
                # Estimate residual impact
                residual = _estimate_residual(cell["severity"], measure["effectiveness"])
                matched.append({
                    "id": f"matched_{len(matched) + 1}",
                    "measure_id": measure["id"],
                    "title": measure["title"],
                    "description": measure["description"],
                    "type": measure["type"],
                    "effectiveness": measure["effectiveness"],
                    "residual_impact": residual,
                    "source": measure["source"],
                    "impact_factor_id": cell["impact_factor_id"],
                    "vec_id": cell["vec_id"],
                    "is_custom": False,
                })

    return matched


def identify_gaps(
    impact_cells: list[dict],
    matched_measures: list[dict],
    factors: list[dict],
    vecs: list[dict],
) -> list[dict]:
    """Identify high/critical impacts without adequate mitigation."""
    factor_map = {f["id"]: f for f in factors}
    vec_map = {v["id"]: v for v in vecs}

    covered_keys = {
        (m["impact_factor_id"], m["vec_id"]) for m in matched_measures
    }

    gaps = []
    for cell in impact_cells:
        if cell.get("severity") in ("high", "critical"):
            key = (cell["impact_factor_id"], cell["vec_id"])
            if key not in covered_keys:
                gaps.append({
                    "impact_factor_id": cell["impact_factor_id"],
                    "vec_id": cell["vec_id"],
                    "description": (
                        f"No mitigation measure identified for {factor_map.get(cell['impact_factor_id'], {}).get('name', '')} "
                        f"interaction with {vec_map.get(cell['vec_id'], {}).get('name', '')} "
                        f"(severity: {cell['severity']})"
                    ),
                    "recommendation": "Develop a project-specific mitigation measure for this interaction.",
                })

    return gaps


def _estimate_residual(original_severity: str, effectiveness: str) -> str:
    """Estimate residual impact after mitigation."""
    reduction_map = {
        ("critical", "high"): "moderate",
        ("critical", "moderate"): "high",
        ("high", "high"): "low",
        ("high", "moderate"): "moderate",
        ("moderate", "high"): "low",
        ("moderate", "moderate"): "low",
    }
    return reduction_map.get((original_severity, effectiveness), "low")
