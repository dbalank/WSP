"""
Tool: Project Library
Provides lookup of canonical project type definitions for the structuring executor.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

_LIBRARY_PATH = Path(__file__).resolve().parent.parent / "libraries" / "project_types.json"

_cache: Optional[list[dict]] = None


def _load() -> list[dict]:
    global _cache
    if _cache is None:
        with open(_LIBRARY_PATH, "r") as f:
            _cache = json.load(f)
    return _cache


def get_all_project_types() -> list[dict]:
    """Return the full project type catalogue."""
    return _load()


def match_project_type(description: str) -> dict | None:
    """
    Simple keyword-match heuristic to identify the best project type.
    In production, this would use an embedding-based similarity search.
    """
    description_lower = description.lower()
    best_match: dict | None = None
    best_score = 0

    for pt in _load():
        score = 0
        # Check category match
        if pt["category"].lower() in description_lower:
            score += 3
        # Check name match
        if pt["name"].lower() in description_lower:
            score += 5
        # Check component keywords
        for comp in pt.get("typical_components", []):
            if comp.lower() in description_lower:
                score += 1
        # Check activity keywords
        for act in pt.get("typical_activities", []):
            if act.lower() in description_lower:
                score += 1

        if score > best_score:
            best_score = score
            best_match = pt

    return best_match


def get_project_type_by_id(type_id: str) -> dict | None:
    """Lookup a specific project type by its ID."""
    for pt in _load():
        if pt["id"] == type_id:
            return pt
    return None
