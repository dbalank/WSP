import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/consistency-check
 * Returns mock consistency validation results.
 */
export async function POST() {
  return NextResponse.json({
    consistency_report: {
      overall_score: 82,
      deviations: [
        {
          id: "dev_001",
          field: "Mitigation Gap: Water Crossing x Wetlands",
          severity: "high",
          description: "No standard mitigation identified for critical wetland impact from water crossing. Historical projects addressed this with HDD or temporary bypass channels.",
          recommendation: "Develop project-specific wetland crossing mitigation. Consider horizontal directional drilling (HDD) as per Northern Pipeline Connector precedent.",
        },
        {
          id: "dev_002",
          field: "Section Count",
          severity: "low",
          description: "Report has fewer sections than the closest historical match (Northern Pipeline Connector). Consider adding a dedicated Climate Change section.",
          recommendation: "Add GHG assessment section consistent with recent pipeline screening precedents.",
        },
      ],
      structural_notes: [
        "Report structure is broadly consistent with historical pipeline screening reports.",
        "VEC selection aligns well with comparable projects in the same regulatory jurisdiction.",
        "Mitigation coverage is 85% of what comparable projects included.",
      ],
      decision_notes: [
        "Screening decision (SCREENING REQUIRED) is consistent with all comparable pipeline projects.",
        "Number of triggered thresholds (2) is within expected range for this project type.",
        "Critical impact count is consistent with historical norms.",
      ],
    },
  });
}
