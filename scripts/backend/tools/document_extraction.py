"""
Tool: Document Extraction
Extracts structured fields from project documents (PDF, DOCX, plain text).
In production, uses Azure Document Intelligence or similar OCR/NLP service.
"""

from __future__ import annotations

import re
from typing import Optional


def extract_fields_from_text(raw_text: str) -> list[dict]:
    """
    Extract structured project fields from raw text using pattern matching.
    In production, this would use an LLM or Azure Document Intelligence.
    """
    fields: list[dict] = []

    # Project name extraction
    name_patterns = [
        r"(?:project\s+(?:name|title)\s*[:]\s*)(.+?)(?:\n|$)",
        r"^(.+?(?:project|pipeline|mine|facility))\s*\n",
    ]
    for pattern in name_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE | re.MULTILINE)
        if match:
            fields.append({
                "field_name": "Project Name",
                "value": match.group(1).strip(),
                "confidence": 0.92,
                "source": "Text extraction (pattern match)",
                "ai_reasoning": "Extracted using project name pattern recognition.",
            })
            break

    # Proponent extraction
    proponent_patterns = [
        r"(?:proponent|applicant|company|developer)\s*[:]\s*(.+?)(?:\n|$)",
        r"(\w+(?:\s+\w+)*\s+(?:Corp|Inc|Ltd|LLC|Company)\.?)",
    ]
    for pattern in proponent_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            fields.append({
                "field_name": "Proponent",
                "value": match.group(1).strip(),
                "confidence": 0.88,
                "source": "Text extraction (entity recognition)",
                "ai_reasoning": "Extracted using corporate entity pattern matching.",
            })
            break

    # Location extraction
    provinces = [
        "British Columbia", "Alberta", "Saskatchewan", "Manitoba",
        "Ontario", "Quebec", "New Brunswick", "Nova Scotia",
        "Prince Edward Island", "Newfoundland", "Yukon",
        "Northwest Territories", "Nunavut",
    ]
    for prov in provinces:
        if prov.lower() in raw_text.lower():
            fields.append({
                "field_name": "Province",
                "value": prov,
                "confidence": 0.95,
                "source": "Text extraction (geographic entity)",
                "ai_reasoning": f"Province '{prov}' identified in project description.",
            })
            break

    # Length/distance extraction
    length_match = re.search(
        r"(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:km|kilomet(?:re|er)s?)",
        raw_text,
        re.IGNORECASE,
    )
    if length_match:
        fields.append({
            "field_name": "Pipeline Length",
            "value": f"{length_match.group(1)} km",
            "confidence": 0.90,
            "source": "Text extraction (numeric pattern)",
            "ai_reasoning": "Distance value extracted with unit recognition.",
        })

    # River crossings
    crossing_match = re.search(
        r"(\d+)\s*(?:river|watercourse|stream)\s*cross",
        raw_text,
        re.IGNORECASE,
    )
    if crossing_match:
        fields.append({
            "field_name": "River Crossings",
            "value": crossing_match.group(1),
            "confidence": 0.85,
            "source": "Text extraction (infrastructure count)",
            "ai_reasoning": "Number of watercourse crossings identified in text.",
        })

    return fields


def validate_extraction(fields: list[dict]) -> dict:
    """
    Validate extracted fields for completeness and consistency.
    Returns a validation report.
    """
    required_fields = ["Project Name", "Proponent", "Province"]
    found_fields = {f["field_name"] for f in fields}
    missing = [f for f in required_fields if f not in found_fields]

    completeness = len(found_fields) / max(len(required_fields) + 3, 1) * 100

    return {
        "total_fields_extracted": len(fields),
        "required_fields_found": len(required_fields) - len(missing),
        "missing_required": missing,
        "completeness_percent": round(min(completeness, 100), 1),
        "avg_confidence": round(
            sum(f["confidence"] for f in fields) / max(len(fields), 1), 2
        ),
    }
