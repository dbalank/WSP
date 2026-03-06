import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/context-analysis
 * Returns mock environmental context analysis.
 */
export async function POST() {
  return NextResponse.json({
    context_result: {
      sensitive_areas: [
        { id: "sa_001", name: "Caribou Habitat Zone A", area_type: "wildlife", severity: "high", distance_km: 2.3, description: "Critical caribou winter range, listed under SARA Schedule 1." },
        { id: "sa_002", name: "Fraser River Watershed", area_type: "water", severity: "critical", distance_km: 0.5, description: "Salmon spawning habitat, Fisheries Act jurisdiction." },
        { id: "sa_003", name: "First Nations Reserve Lands", area_type: "indigenous", severity: "high", distance_km: 4.1, description: "Within traditional territory of the Lheidli Tenneh Nation." },
        { id: "sa_004", name: "Wetland Complex B-14", area_type: "water", severity: "moderate", distance_km: 1.8, description: "Provincially significant wetland supporting migratory waterfowl." },
        { id: "sa_005", name: "Provincial Park Buffer", area_type: "protected", severity: "moderate", distance_km: 8.2, description: "Within 10km buffer of Kakwa Provincial Park." },
      ],
      vecs: [
        { id: "vec_001", name: "Surface Water Quality", category: "water", selected: true, relevance_score: 0.95, rationale: "Direct pathway from construction runoff to Fraser River." },
        { id: "vec_002", name: "Fish Habitat", category: "aquatic", selected: true, relevance_score: 0.92, rationale: "Salmon spawning habitat within project footprint." },
        { id: "vec_003", name: "Caribou Populations", category: "terrestrial", selected: true, relevance_score: 0.88, rationale: "SARA-listed species with critical habitat overlap." },
        { id: "vec_004", name: "Indigenous Land Use", category: "social", selected: true, relevance_score: 0.85, rationale: "Traditional territory of Lheidli Tenneh Nation." },
        { id: "vec_005", name: "Air Quality", category: "atmospheric", selected: true, relevance_score: 0.72, rationale: "Emissions from compressor stations and construction equipment." },
        { id: "vec_006", name: "Wetland Ecosystems", category: "water", selected: true, relevance_score: 0.78, rationale: "Provincially significant wetland in project area." },
        { id: "vec_007", name: "Visual Landscape", category: "social", selected: false, relevance_score: 0.35, rationale: "Limited visual receptors in project area." },
        { id: "vec_008", name: "Soil Quality", category: "terrestrial", selected: false, relevance_score: 0.45, rationale: "Standard construction impacts, manageable." },
      ],
      context_summary: "The project area contains several highly sensitive environmental features including SARA-listed caribou habitat, salmon spawning areas in the Fraser watershed, and First Nations traditional territory. Six VECs have been identified as requiring detailed impact assessment.",
    },
  });
}
