/**
 * EIA Screening Platform — API Client
 *
 * Service layer that bridges the Next.js frontend to the Python backend.
 * When PYTHON_BACKEND_URL is set, it proxies to FastAPI.
 * Otherwise, requests go to the Next.js API routes (which return mock data).
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = BACKEND_URL
    ? `${BACKEND_URL}${path}`
    : `/api${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ── Projects ──────────────────────────────────────────────
export const projectsApi = {
  list: () => request<unknown[]>("/projects"),
  get: (id: string) => request<unknown>(`/project/${id}`),
  create: (data: { name: string; description?: string; proponent?: string }) =>
    request<unknown>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Intake ────────────────────────────────────────────────
export const intakeApi = {
  extract: (projectId: string, rawText: string) =>
    request<unknown>(`/project/${projectId}/intake/extract`, {
      method: "POST",
      body: JSON.stringify({ raw_text: rawText }),
    }),
  refine: (projectId: string, field: string, value: string) =>
    request<unknown>(`/project/${projectId}/intake/refine`, {
      method: "POST",
      body: JSON.stringify({ field, value }),
    }),
};

// ── Screening ─────────────────────────────────────────────
export const screeningApi = {
  validateReadiness: (projectId: string) =>
    request<{ is_ready: boolean; missing_fields: string[]; completeness: number }>(
      `/project/${projectId}/validate-readiness`,
      { method: "POST" }
    ),
  orchestrate: (projectId: string) =>
    request<{ status: string }>(`/project/${projectId}/orchestrate`, {
      method: "POST",
    }),
  getStatus: (projectId: string) =>
    request<{
      is_complete: boolean;
      error: string | null;
      agent_statuses: unknown[];
      current_executor: string;
    }>(`/project/${projectId}/orchestrate/status`),
};

// ── Individual Steps ──────────────────────────────────────
export const stepsApi = {
  legalCategorization: (projectId: string) =>
    request<unknown>(`/project/${projectId}/legal-categorization`, {
      method: "POST",
    }),
  screeningDecision: (projectId: string) =>
    request<unknown>(`/project/${projectId}/screening-decision`, {
      method: "POST",
    }),
  contextAnalysis: (projectId: string) =>
    request<unknown>(`/project/${projectId}/context-analysis`, {
      method: "POST",
    }),
  impactAnalysis: (projectId: string) =>
    request<unknown>(`/project/${projectId}/impact-analysis`, {
      method: "POST",
    }),
  mitigation: (projectId: string) =>
    request<unknown>(`/project/${projectId}/mitigation`, {
      method: "POST",
    }),
  historicalComparison: (projectId: string) =>
    request<unknown>(`/project/${projectId}/historical-comparison`, {
      method: "POST",
    }),
  consistencyCheck: (projectId: string) =>
    request<unknown>(`/project/${projectId}/consistency-check`, {
      method: "POST",
    }),
  report: (projectId: string) =>
    request<unknown>(`/project/${projectId}/report`, { method: "POST" }),
};
