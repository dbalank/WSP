"""
Tool: Historical RAG
Retrieval-Augmented Generation over past screening reports.
In production, this uses a vector database (Pinecone, Weaviate, pgvector).
"""

from __future__ import annotations


# Simulated historical reports database
_HISTORICAL_REPORTS = [
    {
        "id": "hist_001",
        "project_name": "Trans Mountain Pipeline Extension",
        "project_type": "Natural Gas Pipeline",
        "year": 2022,
        "outcome": "Screening Required",
        "province": "British Columbia",
        "components": ["Pipeline", "Pump Stations", "Marine Terminal"],
        "vecs_assessed": ["Surface Water", "Caribou", "Traditional Land Use"],
        "key_decisions": [
            "Full IA triggered by pipeline length > 40km",
            "Caribou critical habitat crossing required species-specific assessment",
            "Marine terminal addition triggered separate federal IA",
        ],
        "report_length_pages": 245,
        "mitigation_count": 34,
    },
    {
        "id": "hist_002",
        "project_name": "Coastal GasLink Pipeline",
        "project_type": "Natural Gas Pipeline",
        "year": 2023,
        "outcome": "Screening Required",
        "province": "British Columbia",
        "components": ["Pipeline", "Compressor Stations", "River Crossings"],
        "vecs_assessed": ["Surface Water", "Wildlife Habitat", "Indigenous Rights"],
        "key_decisions": [
            "670km pipeline triggered federal and provincial IA",
            "Multiple First Nations consultations required",
            "Wet'suwet'en territory crossing required enhanced engagement",
        ],
        "report_length_pages": 312,
        "mitigation_count": 48,
    },
    {
        "id": "hist_003",
        "project_name": "Small Creek Solar Farm",
        "project_type": "Renewable Energy",
        "year": 2024,
        "outcome": "Exempt",
        "province": "Alberta",
        "components": ["Solar Panels", "Substation", "Access Road"],
        "vecs_assessed": ["Grassland Habitat", "Migratory Birds"],
        "key_decisions": [
            "Below federal threshold — no federal IA",
            "Provincial screening determined low impact",
            "No sensitive habitats within buffer zone",
        ],
        "report_length_pages": 45,
        "mitigation_count": 8,
    },
]


def search_similar_projects(
    project_type: str,
    province: str = "",
    components: list[str] | None = None,
    top_k: int = 3,
) -> list[dict]:
    """
    Search for similar historical projects using keyword similarity.
    In production, uses embedding similarity + metadata filtering.
    """
    components = components or []
    scored = []

    for report in _HISTORICAL_REPORTS:
        score = 0.0

        # Type similarity
        if project_type.lower() in report["project_type"].lower():
            score += 0.4
        elif report["project_type"].lower() in project_type.lower():
            score += 0.3

        # Province match
        if province and province.lower() == report["province"].lower():
            score += 0.2

        # Component overlap
        if components:
            report_comps = [c.lower() for c in report["components"]]
            overlap = sum(1 for c in components if c.lower() in " ".join(report_comps))
            score += min(0.3, overlap * 0.1)

        scored.append({**report, "_similarity": round(min(score, 0.99), 2)})

    scored.sort(key=lambda x: x["_similarity"], reverse=True)
    return scored[:top_k]


def compute_structural_comparison(
    current_components: list[str],
    historical_report: dict,
) -> dict:
    """Compute structural comparison metrics between current and historical project."""
    hist_comps = [c.lower() for c in historical_report.get("components", [])]
    curr_comps = [c.lower() for c in current_components]

    # Component overlap
    overlap = len(set(curr_comps) & set(hist_comps))
    total = max(len(set(curr_comps) | set(hist_comps)), 1)
    component_overlap = overlap / total

    return {
        "component_overlap": round(component_overlap, 2),
        "style_consistency": 0.75,  # Placeholder — LLM evaluation in production
        "length_ratio": 0.82,  # Placeholder
        "notes": f"Shared {overlap} of {total} unique components with {historical_report['project_name']}.",
    }


def compute_decision_comparison(
    current_outcome: str,
    historical_report: dict,
) -> dict:
    """Compare decision criteria between current and historical project."""
    outcome_match = current_outcome.lower() == historical_report["outcome"].lower()

    return {
        "outcome_match": outcome_match,
        "criteria_alignment": 0.85 if outcome_match else 0.55,
        "divergences": [] if outcome_match else [
            f"Current project has different outcome ({current_outcome}) vs historical ({historical_report['outcome']})",
        ],
        "notes": historical_report.get("key_decisions", ["No key decisions recorded"])[0],
    }
