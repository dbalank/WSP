import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/impact-analysis
 * Returns mock IF x VEC impact matrix.
 */

type Severity = "none" | "low" | "moderate" | "high" | "critical";

const IFS = [
  { id: "if_001", name: "Land Clearing", category: "construction" },
  { id: "if_002", name: "Excavation & Grading", category: "construction" },
  { id: "if_003", name: "Pipeline Installation", category: "construction" },
  { id: "if_004", name: "Water Crossing", category: "construction" },
  { id: "if_005", name: "Compressor Station Ops", category: "operation" },
  { id: "if_006", name: "Vehicle Traffic", category: "operation" },
];

const VECS = [
  { id: "vec_001", name: "Surface Water" },
  { id: "vec_002", name: "Fish Habitat" },
  { id: "vec_003", name: "Caribou" },
  { id: "vec_004", name: "Indigenous Use" },
  { id: "vec_005", name: "Air Quality" },
  { id: "vec_006", name: "Wetlands" },
];

const SEVERITY_MAP: Record<string, Severity> = {
  "if_001_vec_001": "moderate",
  "if_001_vec_002": "high",
  "if_001_vec_003": "critical",
  "if_001_vec_004": "high",
  "if_001_vec_005": "low",
  "if_001_vec_006": "high",
  "if_002_vec_001": "high",
  "if_002_vec_002": "moderate",
  "if_002_vec_003": "moderate",
  "if_002_vec_004": "low",
  "if_002_vec_005": "low",
  "if_002_vec_006": "high",
  "if_003_vec_001": "moderate",
  "if_003_vec_002": "high",
  "if_003_vec_003": "high",
  "if_003_vec_004": "moderate",
  "if_003_vec_005": "none",
  "if_003_vec_006": "moderate",
  "if_004_vec_001": "critical",
  "if_004_vec_002": "critical",
  "if_004_vec_003": "low",
  "if_004_vec_004": "high",
  "if_004_vec_005": "none",
  "if_004_vec_006": "critical",
  "if_005_vec_001": "low",
  "if_005_vec_002": "none",
  "if_005_vec_003": "moderate",
  "if_005_vec_004": "moderate",
  "if_005_vec_005": "high",
  "if_005_vec_006": "none",
  "if_006_vec_001": "low",
  "if_006_vec_002": "low",
  "if_006_vec_003": "high",
  "if_006_vec_004": "moderate",
  "if_006_vec_005": "moderate",
  "if_006_vec_006": "low",
};

export async function POST() {
  const cells = IFS.flatMap((ifItem) =>
    VECS.map((vec) => {
      const key = `${ifItem.id}_${vec.id}`;
      const severity = SEVERITY_MAP[key] || "none";
      return {
        impact_factor_id: ifItem.id,
        impact_factor_name: ifItem.name,
        vec_id: vec.id,
        vec_name: vec.name,
        severity,
        confidence: severity === "none" ? 0.99 : Math.random() * 0.3 + 0.65,
        reasoning: `AI-assessed interaction between ${ifItem.name} and ${vec.name}.`,
        is_overridden: false,
      };
    })
  );

  return NextResponse.json({
    impact_matrix: {
      impact_factors: IFS,
      vecs: VECS,
      cells,
    },
  });
}
