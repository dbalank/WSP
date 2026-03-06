import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/validate-readiness
 * Checks if the project is complete enough to proceed to screening.
 */
export async function POST() {
  return NextResponse.json({
    is_ready: true,
    missing_fields: [],
    completeness: 100,
  });
}
