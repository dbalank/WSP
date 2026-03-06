"""
Tool: Valued Ecosystem Components (VECs) Library
Provides lookup and filtering of VECs based on project context.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

_LIBRARY_PATH = Path(__file__).resolve().parent.parent / "libraries" / "vecs.json"
_cache: Optional[list[dict]] = None


def _load() -> list[dict]:
    global _cache
    if _cache is None:
        with open(_LIBRARY_PATH, "r") as f:
            _cache = json.load(f)
    return _cache


def get_all_vecs() -> list[dict]:
    """Return the full VEC catalogue."""
    return _load()


def get_relevant_vecs(
    sensitive_area_types: list[str],
    project_type: str = "",
) -> list[dict]:
    """
    Filter VECs by relevance to detected sensitive area types and project type.
    Returns VECs sorted by relevance score.
    """
    vecs = _load()
    scored: list[dict] = []

    # Keyword mapping for scoring relevance
    type_keywords = {
        "Watercourse": ["aquatic", "water", "fish"],
        "Wildlife Habitat": ["wildlife", "species", "habitat"],
        "Vegetation": ["vegetation", "forest", "plant"],
        "Cultural Heritage": ["indigenous", "cultural", "traditional"],
        "Wetland": ["aquatic", "water", "wetland"],
    }

    for vec in vecs:
        score = 0.5  # Base relevance

        vec_name_lower = vec.get("name", "").lower()
        vec_cat_lower = vec.get("category", "").lower()
        vec_desc_lower = vec.get("description", "").lower()
        combined = f"{vec_name_lower} {vec_cat_lower} {vec_desc_lower}"

        for area_type in sensitive_area_types:
            keywords = type_keywords.get(area_type, [])
            for kw in keywords:
                if kw in combined:
                    score += 0.15

        # Cap score
        score = min(score, 0.99)

        scored.append({
            **vec,
            "relevance_score": round(score, 2),
            "selected": score > 0.6,
        })

    scored.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored
