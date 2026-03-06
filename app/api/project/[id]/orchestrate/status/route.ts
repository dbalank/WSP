import { NextResponse } from "next/server";

/**
 * GET /api/project/:id/orchestrate/status — Poll workflow status
 */
export async function GET() {
  return NextResponse.json({
    is_complete: false,
    error: null,
    current_executor: "project_structuring",
    agent_statuses: [
      { executor_name: "project_structuring", display_name: "Project Structuring", phase: "complete", progress: 100, message: "Extracted project data" },
      { executor_name: "legal_threshold", display_name: "Legal Threshold", phase: "complete", progress: 100, message: "Evaluated thresholds" },
      { executor_name: "screening_decision", display_name: "Screening Decision", phase: "complete", progress: 100, message: "Decision: SCREENING REQUIRED" },
      { executor_name: "context_analysis", display_name: "Context Analysis", phase: "running", progress: 45, message: "Analysing geospatial data..." },
      { executor_name: "impact_analysis", display_name: "Impact Analysis", phase: "idle", progress: 0, message: "" },
      { executor_name: "mitigation", display_name: "Mitigation", phase: "idle", progress: 0, message: "" },
      { executor_name: "historical_comparison", display_name: "Historical Comparison", phase: "idle", progress: 0, message: "" },
      { executor_name: "consistency_validation", display_name: "Consistency Validation", phase: "idle", progress: 0, message: "" },
      { executor_name: "report_generation", display_name: "Report Generation", phase: "idle", progress: 0, message: "" },
    ],
  });
}
