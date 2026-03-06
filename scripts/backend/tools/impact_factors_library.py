"""
Tool: Impact Factors Library
Provides lookup of canonical impact factors for the impact analysis matrix.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

_LIBRARY_PATH = Path(__file__).resolve().parent.parent / "libraries" / "impact_factors.json"
_cache: Optional[list[dict]] = None


def _load() -> list[dict]:
    global _cache
    if _cache is None:
        with open(_LIBRARY_PATH, "r") as f:
            _cache = json.load(f)
    return _cache


def get_all_impact_factors() -> list[dict]:
    """Return the full impact factor catalogue."""
    return _load()


def get_factors_for_project_type(project_type: str) -> list[dict]:
    """
    Return impact factors relevant to a specific project type.
    In production, uses LLM-based relevance scoring.
    """
    factors = _load()
    # For now, return all factors — in production, filter by project type
    return factors


def generate_severity_matrix(
    factors: list[dict],
    vecs: list[dict],
    project_description: str = "",
) -> list[dict]:
    """
    Generate the IF x VEC severity matrix.
    In production, an LLM rates each cell with reasoning.
    This provides a deterministic baseline.
    """
    severity_levels = ["none", "low", "moderate", "high", "critical"]
    cells = []

    for factor in factors:
        for vec in vecs:
            # Heuristic scoring based on category alignment
            severity = _heuristic_severity(factor, vec)
            cells.append({
                "impact_factor_id": factor["id"],
                "vec_id": vec["id"],
                "severity": severity,
                "likelihood": "probable",
                "duration": "long-term",
                "reversibility": "partially reversible",
                "ai_reasoning": (
                    f"Assessment of {factor['name']} interaction with {vec['name']} "
                    f"based on project characteristics and environmental context."
                ),
            })

    return cells


def _heuristic_severity(factor: dict, vec: dict) -> str:
    """Simple heuristic for baseline severity estimation."""
    factor_cat = factor.get("category", "").lower()
    vec_cat = vec.get("category", "").lower()

    # High-impact combinations
    high_combos = {
        ("biophysical", "wildlife"), ("biophysical", "aquatic"),
        ("aquatic", "aquatic"), ("chemical", "aquatic"),
        ("socioeconomic", "indigenous"),
    }

    critical_combos = {
        ("biophysical", "wildlife"),  # When habitat fragmentation meets caribou
    }

    combo = (factor_cat, vec_cat)
    if combo in critical_combos and "fragment" in factor.get("name", "").lower():
        return "critical"
    elif combo in high_combos:
        return "high"
    elif factor_cat == vec_cat:
        return "moderate"
    else:
        return "low"
