import { NextResponse } from "next/server";

/**
 * GET /api/projects — List all projects
 * POST /api/projects — Create a new project
 *
 * In production, these proxy to the Python FastAPI backend.
 * For the v0 preview, they return mock data.
 */

const MOCK_PROJECTS = [
  {
    id: "proj_001",
    name: "Northern Expansion Pipeline Project",
    proponent: "Northern Energy Corp.",
    project_type: "Natural Gas Pipeline",
    state: "draft",
    completeness: 82,
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "proj_002",
    name: "Caribou Creek Wind Farm",
    proponent: "GreenPower BC Inc.",
    project_type: "Wind Energy Facility",
    state: "screening_required",
    completeness: 100,
    updated_at: "2026-02-28T00:00:00Z",
  },
  {
    id: "proj_003",
    name: "Kootenay Copper Mine Expansion",
    proponent: "Pacific Minerals Ltd.",
    project_type: "Metal Mine",
    state: "analysis_complete",
    completeness: 100,
    updated_at: "2026-02-25T00:00:00Z",
  },
];

export async function GET() {
  return NextResponse.json(MOCK_PROJECTS);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newProject = {
    id: `proj_${Date.now().toString(36)}`,
    name: body.name || "Untitled Project",
    proponent: body.proponent || "",
    project_type: "",
    state: "draft",
    completeness: 0,
    updated_at: new Date().toISOString(),
  };
  return NextResponse.json(newProject, { status: 201 });
}
