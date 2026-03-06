import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/intake/extract
 * Simulates the AI-powered project text extraction.
 * In production, proxies to Python's ProjectStructuringExecutor.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const rawText: string = body.raw_text || "";

  // Simulated extraction — parses key phrases from the raw text
  const lower = rawText.toLowerCase();

  const extractedProfile = {
    proponent: extractBetween(rawText, "proponent:", "\n") || "Extracted Proponent Corp.",
    project_type: lower.includes("pipeline")
      ? "natural_gas_pipeline"
      : lower.includes("mine") || lower.includes("mining")
        ? "metal_mine"
        : lower.includes("wind")
          ? "wind_energy"
          : lower.includes("solar")
            ? "solar_energy"
            : lower.includes("hydro") || lower.includes("dam")
              ? "hydroelectric"
              : "general_infrastructure",
    project_subtype: "",
    location: {
      province: lower.includes("bc") || lower.includes("british columbia")
        ? "British Columbia"
        : lower.includes("alberta")
          ? "Alberta"
          : lower.includes("ontario")
            ? "Ontario"
            : "British Columbia",
      region: "Northern Region",
      latitude: 54.23,
      longitude: -125.76,
      nearest_community: "Prince George",
    },
    physical_activities: extractList(rawText, [
      "land clearing", "excavation", "grading", "blasting",
      "pipeline construction", "road construction", "dam construction",
      "turbine installation", "drilling", "water withdrawal",
    ]),
    components: extractList(rawText, [
      "access roads", "processing plant", "tailings facility",
      "compressor station", "power line", "camp facilities",
      "water treatment", "storage facility", "transmission line",
    ]),
    capacity_description: extractBetween(rawText, "capacity:", "\n") || "",
    regulatory_triggers: [],
  };

  return NextResponse.json({
    project_id: id,
    project: {
      id,
      name: extractBetween(rawText, "project:", "\n") || `Project ${id}`,
      description: rawText.substring(0, 500),
      profile: extractedProfile,
      state: "draft",
      completeness: calculateCompleteness(extractedProfile),
    },
    extraction_confidence: 0.85,
    extracted_fields: Object.keys(extractedProfile).length,
  });
}

function extractBetween(text: string, start: string, end: string): string {
  const lower = text.toLowerCase();
  const startIdx = lower.indexOf(start.toLowerCase());
  if (startIdx === -1) return "";
  const afterStart = startIdx + start.length;
  const endIdx = lower.indexOf(end.toLowerCase(), afterStart);
  return text.substring(afterStart, endIdx === -1 ? afterStart + 100 : endIdx).trim();
}

function extractList(text: string, candidates: string[]): string[] {
  const lower = text.toLowerCase();
  return candidates.filter((c) => lower.includes(c));
}

function calculateCompleteness(profile: Record<string, unknown>): number {
  const fields = [
    "proponent", "project_type", "location", "physical_activities", "components",
  ];
  let filled = 0;
  for (const f of fields) {
    const val = profile[f];
    if (val && (typeof val !== "object" || (Array.isArray(val) ? val.length > 0 : true))) {
      filled++;
    }
  }
  return Math.round((filled / fields.length) * 100);
}
