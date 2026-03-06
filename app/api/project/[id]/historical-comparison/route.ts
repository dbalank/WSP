import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/historical-comparison
 * Returns mock historical comparison data.
 */
export async function POST() {
  return NextResponse.json({
    historical_matches: [
      {
        id: "hist_002",
        project_name: "Northern Pipeline Connector",
        project_type: "natural_gas_pipeline",
        province: "Alberta",
        year: 2024,
        outcome: "screening_required",
        similarity_score: 0.89,
        structural_comparison: {
          shared_vecs: ["caribou_habitat", "wetlands", "indigenous_land_use", "groundwater"],
          shared_impacts: ["habitat_fragmentation", "wetland_loss", "traditional_land_use_disruption"],
          section_count_delta: -2,
          style_similarity: 0.82,
        },
        decision_comparison: {
          same_outcome: true,
          triggers_delta: 0,
          critical_impacts_delta: 0,
          confidence_note: "Very similar project scope and regulatory context.",
        },
        key_lessons: [
          "Caribou habitat offset programme was key condition of approval.",
          "Horizontal directional drilling at wetlands reduced impacts significantly.",
          "Indigenous benefit agreements accelerated consultation.",
        ],
      },
      {
        id: "hist_001",
        project_name: "Coastal Wind Energy Park Phase 1",
        project_type: "wind_energy",
        province: "British Columbia",
        year: 2023,
        outcome: "screening_required",
        similarity_score: 0.62,
        structural_comparison: {
          shared_vecs: ["wildlife_habitat", "noise_sensitive_receptors"],
          shared_impacts: ["construction_noise", "visual_impact"],
          section_count_delta: 2,
          style_similarity: 0.55,
        },
        decision_comparison: {
          same_outcome: true,
          triggers_delta: 1,
          critical_impacts_delta: -1,
          confidence_note: "Different project type but similar regulatory environment.",
        },
        key_lessons: [
          "Seasonal construction restrictions were effective for wildlife protection.",
          "Community engagement early in process reduced opposition.",
        ],
      },
      {
        id: "hist_004",
        project_name: "Highland Copper-Gold Mine",
        project_type: "metal_mine",
        province: "British Columbia",
        year: 2023,
        outcome: "screening_required",
        similarity_score: 0.54,
        structural_comparison: {
          shared_vecs: ["fish_habitat", "groundwater", "species_at_risk", "indigenous_land_use"],
          shared_impacts: ["habitat_destruction", "water_table_drawdown"],
          section_count_delta: -4,
          style_similarity: 0.48,
        },
        decision_comparison: {
          same_outcome: true,
          triggers_delta: -1,
          critical_impacts_delta: -1,
          confidence_note: "More complex project with additional mining-specific impacts.",
        },
        key_lessons: [
          "Progressive reclamation plan was critical for approval.",
          "Water treatment plant design was a key regulatory requirement.",
        ],
      },
    ],
  });
}
