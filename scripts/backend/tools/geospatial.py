"""
Tool: Geospatial Analysis
Spatial overlay analysis for detecting sensitive areas near the project.
In production, this would connect to GIS services (PostGIS, ArcGIS, etc.).
"""

from __future__ import annotations

import math
from typing import Optional


# Simulated sensitive area database
_SENSITIVE_AREAS = [
    {
        "id": "sa_peace_river",
        "name": "Peace River Watershed",
        "type": "Watercourse",
        "lat": 56.2,
        "lng": -120.8,
        "radius_km": 50,
        "severity": "high",
        "description": "Major river system with critical fish habitat including Bull Trout and Arctic Grayling.",
    },
    {
        "id": "sa_caribou_habitat",
        "name": "Boreal Caribou Critical Habitat",
        "type": "Wildlife Habitat",
        "lat": 55.9,
        "lng": -120.5,
        "radius_km": 80,
        "severity": "critical",
        "description": "Federal recovery strategy identifies this zone as critical for Southern Mountain caribou.",
    },
    {
        "id": "sa_old_growth",
        "name": "Old Growth Forest Stand",
        "type": "Vegetation",
        "lat": 55.8,
        "lng": -120.3,
        "radius_km": 15,
        "severity": "moderate",
        "description": "Mature boreal mixedwood stand with trees exceeding 120 years.",
    },
    {
        "id": "sa_sacred_site",
        "name": "Treaty 8 Sacred Site",
        "type": "Cultural Heritage",
        "lat": 55.85,
        "lng": -120.4,
        "radius_km": 10,
        "severity": "high",
        "description": "Traditional gathering and ceremonial site identified through Indigenous consultation.",
    },
    {
        "id": "sa_wetland",
        "name": "Pine River Wetland Complex",
        "type": "Wetland",
        "lat": 55.65,
        "lng": -121.0,
        "radius_km": 20,
        "severity": "moderate",
        "description": "Class IV wetland system providing critical staging habitat for migratory waterfowl.",
    },
]


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in kilometres."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def find_sensitive_areas(
    lat: float,
    lng: float,
    buffer_km: float = 100.0,
) -> list[dict]:
    """
    Find all sensitive areas within buffer_km of the project coordinates.
    Returns list of areas with calculated distance.
    """
    results = []
    for area in _SENSITIVE_AREAS:
        distance = _haversine_km(lat, lng, area["lat"], area["lng"])
        if distance <= buffer_km:
            results.append({
                "id": area["id"],
                "name": area["name"],
                "type": area["type"],
                "distance_km": round(distance, 2),
                "severity": area["severity"],
                "description": area["description"],
                "coordinates": {"lat": area["lat"], "lng": area["lng"]},
            })
    results.sort(key=lambda x: x["distance_km"])
    return results


def compute_spatial_overlays(
    lat: float,
    lng: float,
    nearby_areas: list[dict],
) -> list[dict]:
    """
    Generate spatial overlay analysis results.
    In production, this computes actual geometric intersections.
    """
    overlays = []
    for area in nearby_areas:
        overlays.append({
            "id": f"overlay_{area['id']}",
            "name": f"{area['name']} Overlay",
            "layer_type": area["type"],
            "intersects": area["distance_km"] < 5.0,
            "area_of_overlap_km2": max(0, round((5.0 - area["distance_km"]) * 10, 1))
            if area["distance_km"] < 5.0
            else 0,
        })
    return overlays
