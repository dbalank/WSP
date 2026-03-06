import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/orchestrate — Start the full screening workflow
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ status: "started", project_id: id });
}
