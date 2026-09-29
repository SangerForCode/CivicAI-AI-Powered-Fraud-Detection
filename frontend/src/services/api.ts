/**
 * The only module in the console that talks to the network.
 *
 * Components call these functions; nothing else imports `fetch`. Errors are
 * normalised into `ApiError` so the UI can distinguish a connectivity failure
 * from a validation rejection without parsing responses itself.
 */

import type {
  FieldError,
  HealthResponse,
  ProjectInput,
  RiskAssessment,
  RuleCatalogueResponse,
} from "@/types/assessment";
import type {
  AssistedAnalysis,
  CitizenReport,
  CitizenReportCreate,
  CitizenStats,
  DashboardSummary,
  FilterOptions,
  WorkDetail,
  WorkPage,
  WorkQuery,
  WorkSummary,
} from "@/types/portal";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export type ApiErrorKind = "network" | "validation" | "server" | "unexpected";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** Populated for `kind === "validation"`, keyed to `ProjectInput` fields. */
  readonly fieldErrors: FieldError[];

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; fieldErrors?: FieldError[] } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status;
    this.fieldErrors = options.fieldErrors ?? [];
  }
}

/** FastAPI validation payload shape. */
interface FastApiValidationDetail {
  loc?: (string | number)[];
  msg?: string;
}

function parseValidationErrors(body: unknown): FieldError[] {
  if (typeof body !== "object" || body === null) return [];
  const detail = (body as { detail?: unknown }).detail;
  if (!Array.isArray(detail)) return [];

  return detail.flatMap((item: FastApiValidationDetail): FieldError[] => {
    const loc = item?.loc;
    if (!Array.isArray(loc) || loc.length === 0) return [];
    // loc is ["body", "<field>"]; the field is the last meaningful segment.
    const field = String(loc[loc.length - 1]);
    return [{ field, message: item?.msg ?? "Invalid value." }];
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(
      "network",
      `Could not reach the risk engine at ${BASE_URL}. Check that the backend is running.`,
    );
  }

  if (response.status === 422) {
    const body = await response.json().catch(() => null);
    const fieldErrors = parseValidationErrors(body);
    throw new ApiError("validation", "The risk engine rejected this input.", {
      status: 422,
      fieldErrors,
    });
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ApiError(
      "server",
      `The risk engine returned ${response.status}${text ? `: ${text.slice(0, 200)}` : "."}`,
      { status: response.status },
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("unexpected", "The risk engine returned a response that could not be read.");
  }
}

/** `GET /health` — backs the connectivity indicator in the header. */
export function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health", { method: "GET", cache: "no-store" });
}

/** `POST /risk/assess` — the engine scores the project; the console only renders it. */
export function assessProject(project: ProjectInput): Promise<RiskAssessment> {
  return request<RiskAssessment>("/risk/assess", {
    method: "POST",
    body: JSON.stringify(project),
  });
}

/** `GET /risk/rules` — the catalogue the engine evaluates, shown read-only. */
export function fetchRules(): Promise<RuleCatalogueResponse> {
  return request<RuleCatalogueResponse>("/risk/rules", { method: "GET" });
}

/** Drops undefined/empty entries so a blank filter never narrows the query. */
function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

// --- portal ---------------------------------------------------------------

/** `GET /works` — the shared list behind the citizen explorer and officer table. */
export function fetchWorks(query: WorkQuery = {}): Promise<WorkPage> {
  return request<WorkPage>(`/works${queryString({ ...query })}`, { method: "GET" });
}

/** `GET /works/map` — marker set, highest risk first. */
export function fetchMapWorks(
  query: Pick<WorkQuery, "state" | "category" | "risk_level"> & { limit?: number } = {},
): Promise<WorkSummary[]> {
  return request<WorkSummary[]>(`/works/map${queryString({ ...query })}`, { method: "GET" });
}

export function fetchWork(workId: string): Promise<WorkDetail> {
  return request<WorkDetail>(`/works/${encodeURIComponent(workId)}`, { method: "GET" });
}

export function fetchAnalysis(workId: string): Promise<AssistedAnalysis> {
  return request<AssistedAnalysis>(`/works/${encodeURIComponent(workId)}/analysis`, {
    method: "GET",
  });
}

export function fetchWorkReports(workId: string): Promise<CitizenReport[]> {
  return request<CitizenReport[]>(`/works/${encodeURIComponent(workId)}/reports`, {
    method: "GET",
  });
}

/** `POST /works/{id}/reports` — a citizen observation, routed for human review. */
export function submitReport(
  workId: string,
  payload: CitizenReportCreate,
): Promise<CitizenReport> {
  return request<CitizenReport>(`/works/${encodeURIComponent(workId)}/reports`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchRecentReports(limit = 8): Promise<CitizenReport[]> {
  return request<CitizenReport[]>(`/reports/recent${queryString({ limit })}`, { method: "GET" });
}

export function fetchDashboard(): Promise<DashboardSummary> {
  return request<DashboardSummary>("/dashboard/summary", { method: "GET" });
}

export function fetchCitizenStats(): Promise<CitizenStats> {
  return request<CitizenStats>("/citizen/stats", { method: "GET" });
}

export function fetchFilterOptions(): Promise<FilterOptions> {
  return request<FilterOptions>("/filters", { method: "GET" });
}

export const apiBaseUrl = BASE_URL;
