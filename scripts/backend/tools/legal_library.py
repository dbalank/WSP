"""
Tool: Legal Library
Provides lookup of regulatory thresholds and exemption criteria.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

_LIBRARY_PATH = Path(__file__).resolve().parent.parent / "libraries" / "legal_thresholds.json"

_cache: Optional[list[dict]] = None


def _load() -> list[dict]:
    global _cache
    if _cache is None:
        with open(_LIBRARY_PATH, "r") as f:
            _cache = json.load(f)
    return _cache


def get_thresholds_for_type(project_type_id: str) -> list[dict]:
    """
    Return all regulatory thresholds applicable to a given project type.
    Falls back to general thresholds if no type-specific rules exist.
    """
    thresholds = _load()
    type_specific = [
        t for t in thresholds
        if project_type_id in t.get("applicable_types", [])
    ]
    general = [t for t in thresholds if t.get("scope") == "general"]
    return type_specific + general


def evaluate_threshold(threshold: dict, project_data: dict) -> dict:
    """
    Evaluate a single threshold against project data.
    Returns an evaluation result with triggered status and reasoning.
    
    In production, this would use an LLM for nuanced interpretation
    of complex regulatory language.
    """
    triggered = False
    reasoning = ""

    rule_type = threshold.get("rule_type", "")
    rule_value = threshold.get("rule_value")

    if rule_type == "length_exceeds":
        # Check if any length-related field exceeds threshold
        for field in project_data.get("extracted_fields", []):
            if "length" in field.get("field_name", "").lower() or "km" in field.get("value", "").lower():
                try:
                    val_str = field["value"].replace("km", "").replace(",", "").strip()
                    val = float(val_str)
                    if val > float(rule_value):
                        triggered = True
                        reasoning = f"Project length ({val}km) exceeds threshold ({rule_value}km)."
                except (ValueError, TypeError):
                    reasoning = f"Could not parse length value: {field['value']}"

    elif rule_type == "crosses_waterway":
        desc = project_data.get("description", "").lower()
        raw = project_data.get("raw_intake_text", "").lower()
        combined = desc + " " + raw
        if any(kw in combined for kw in ["river crossing", "watercourse", "stream crossing", "creek crossing"]):
            triggered = True
            reasoning = "Project involves waterway crossings based on description analysis."

    elif rule_type == "indigenous_territory":
        location = project_data.get("profile", {}).get("location", {})
        territories = location.get("indigenous_territory", [])
        if territories:
            triggered = True
            reasoning = f"Project is within {', '.join(territories)} territory."

    elif rule_type == "capacity_exceeds":
        # Generic capacity check
        desc = project_data.get("description", "").lower()
        triggered = True  # Conservative — flag for manual review
        reasoning = "Capacity threshold requires expert review of project specifications."

    else:
        reasoning = f"Unknown rule type: {rule_type}. Manual evaluation required."

    return {
        "threshold_id": threshold.get("id", ""),
        "threshold_name": threshold.get("name", ""),
        "triggered": triggered,
        "reasoning": reasoning,
        "regulatory_ref": threshold.get("regulatory_ref", ""),
        "confidence": 0.85 if triggered else 0.70,
    }


def check_exemption(project_type_id: str, evaluations: list[dict]) -> dict:
    """
    Determine if the project is exempt based on threshold evaluations.
    A project is exempt only if NO thresholds are triggered.
    """
    triggered = [e for e in evaluations if e.get("triggered", False)]

    if not triggered:
        return {
            "is_exempt": True,
            "reasoning": "No regulatory thresholds triggered. Project qualifies for exemption.",
            "next_path": "exempt",
        }
    else:
        trigger_names = [e["threshold_name"] for e in triggered]
        return {
            "is_exempt": False,
            "reasoning": (
                f"Project triggers {len(triggered)} threshold(s): {', '.join(trigger_names)}. "
                "Full screening is required."
            ),
            "next_path": "screening",
        }
