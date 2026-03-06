import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/mitigation
 * Returns mock mitigation measures.
 */
export async function POST() {
  return NextResponse.json({
    mitigation_result: {
      measures: [
        {
          id: "mit_001",
          title: "Sediment and Erosion Control Plan",
          category: "water",
          measure_type: "preventive",
          description: "Install silt fencing, sediment ponds, and erosion blankets along watercourse boundaries. Maintain 30m riparian buffer zones.",
          target_impact_factor: "Land Clearing",
          target_vec: "Surface Water Quality",
          effectiveness: "high",
          confidence: 0.88,
          source: "library",
        },
        {
          id: "mit_002",
          title: "Wildlife Movement Corridor Preservation",
          category: "terrestrial",
          measure_type: "compensatory",
          description: "Maintain wildlife crossing structures. Install wildlife-friendly fencing. Schedule construction outside caribou calving season (May-June).",
          target_impact_factor: "Land Clearing",
          target_vec: "Caribou Populations",
          effectiveness: "high",
          confidence: 0.82,
          source: "library",
        },
        {
          id: "mit_003",
          title: "Aquatic Habitat Compensation",
          category: "water",
          measure_type: "compensatory",
          description: "Create or enhance aquatic habitat at 2:1 ratio for any lost habitat. Install fish passage structures at all water crossings. Restore spawning substrate.",
          target_impact_factor: "Water Crossing",
          target_vec: "Fish Habitat",
          effectiveness: "high",
          confidence: 0.85,
          source: "library",
        },
        {
          id: "mit_004",
          title: "Indigenous Community Engagement Protocol",
          category: "social",
          measure_type: "preventive",
          description: "Establish formal consultation framework with Lheidli Tenneh Nation. Integrate Traditional Ecological Knowledge in project planning. Implement benefit-sharing agreements.",
          target_impact_factor: "Pipeline Installation",
          target_vec: "Indigenous Land Use",
          effectiveness: "high",
          confidence: 0.79,
          source: "library",
        },
        {
          id: "mit_005",
          title: "Air Quality Management Plan",
          category: "air",
          measure_type: "preventive",
          description: "Implement dust suppression measures. Monitor PM2.5 and PM10 at site boundaries. Use Tier 4 construction equipment to reduce NOx emissions.",
          target_impact_factor: "Compressor Station Operations",
          target_vec: "Air Quality",
          effectiveness: "moderate",
          confidence: 0.75,
          source: "library",
        },
        {
          id: "mit_006",
          title: "Spill Prevention and Response",
          category: "water",
          measure_type: "reactive",
          description: "Maintain spill kits at all fuel storage areas. Secondary containment for hazardous materials. 24-hour spill response protocol with trained crew.",
          target_impact_factor: "Pipeline Installation",
          target_vec: "Surface Water Quality",
          effectiveness: "high",
          confidence: 0.91,
          source: "library",
        },
        {
          id: "mit_007",
          title: "Wetland Avoidance and Setback Protocol",
          category: "water",
          measure_type: "preventive",
          description: "Route pipeline around provincially significant wetlands where feasible. Maintain 30m setback from wetland boundaries. Use timber mats for equipment access.",
          target_impact_factor: "Excavation & Grading",
          target_vec: "Wetland Ecosystems",
          effectiveness: "moderate",
          confidence: 0.72,
          source: "library",
        },
      ],
      gap_analysis: [
        {
          id: "gap_001",
          impact_factor: "Water Crossing",
          vec: "Wetland Ecosystems",
          severity: "critical",
          description: "No specific mitigation identified for wetland impacts from water crossing construction. Project-specific measures needed.",
        },
      ],
      summary: "7 mitigation measures identified from the standard library. 1 gap requiring project-specific mitigation development.",
    },
  });
}
