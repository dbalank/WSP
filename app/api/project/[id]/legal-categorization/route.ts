import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/legal-categorization
 * Returns mock legal threshold evaluation data.
 */
export async function POST() {
  return NextResponse.json({
    threshold_evaluation: {
      project_type_name: "Natural Gas Pipeline",
      overall_outcome: "screening_required",
      reasoning:
        "Project triggers physical activity thresholds under the Impact Assessment Act. Pipeline exceeds 75km length threshold and traverses multiple jurisdictions.",
      triggers: [
        {
          id: "trig_001",
          name: "Physical Activity Threshold",
          category: "designated_project",
          triggered: true,
          confidence: 0.92,
          reasoning: "Pipeline length exceeds 75km threshold under the Physical Activities Regulations.",
          regulatory_reference: "IAA Schedule, Part 1, Section 1(a)",
        },
        {
          id: "trig_002",
          name: "Provincial Environmental Assessment",
          category: "provincial_ea",
          triggered: true,
          confidence: 0.88,
          reasoning: "Project is a reviewable project under the BC Environmental Assessment Act (threshold > 20MW or > 40km pipeline).",
          regulatory_reference: "BC EAA, Reviewable Projects Regulation",
        },
        {
          id: "trig_003",
          name: "Species at Risk Trigger",
          category: "species_at_risk",
          triggered: false,
          confidence: 0.65,
          reasoning: "No confirmed critical habitat overlap identified at this stage. Further assessment recommended.",
          regulatory_reference: "SARA, Section 79",
        },
      ],
      regulatory_references: [
        { section: "IAA Schedule, Part 1", description: "Designated Physical Activities", url: "" },
        { section: "BC EAA Reg", description: "Reviewable Projects Regulation", url: "" },
      ],
    },
  });
}
