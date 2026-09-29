/**
 * Mirrors the backend schemas in `backend/app/schemas.py`.
 *
 * These are transport types only. Nothing here derives or adjusts a score —
 * the engine is the single source of truth and the console renders what it
 * returns.
 */

export type Category =
  | "road"
  | "drinking_water"
  | "sanitation"
  | "education"
  | "health"
  | "community_asset"
  | "public_lighting"
  | "sports"
  | "other";

export type ProjectStage =
  | "recommended"
  | "sanctioned"
  | "in_progress"
  | "completed"
  | "abandoned";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type AssessmentStatus = "complete" | "incomplete";

export type DimensionKey =
  | "financial_anomaly"
  | "timeline_anomaly"
  | "documentation_gaps"
  | "stale_progress";

export type DimensionStatus = "available" | "unavailable";

/**
 * The request body. Every optional field is omitted rather than sent as `0`
 * or `""` when the user leaves it blank — the engine distinguishes "unknown"
 * from "zero".
 */
export interface ProjectInput {
  project_id: string;
  project_name?: string;
  state?: string;
  district?: string;
  category?: Category;
  sanctioned_amount?: number;
  amount_spent?: number;
  completion_percentage?: number;
  planned_duration_days?: number;
  elapsed_days?: number;
  project_stage?: ProjectStage;
  documents?: string[];
  last_progress_update?: string;
  days_since_last_update?: number;
}

export interface ObservedValue {
  label: string;
  /** Pre-formatted by the backend, including ₹ and Indian digit grouping. */
  value: string;
}

export interface RiskSignal {
  rule_id: string;
  dimension: DimensionKey;
  severity: Severity;
  explanation: string;
  observed: ObservedValue[];
  evidence_fields: string[];
}

export interface DimensionResult {
  key: DimensionKey;
  label: string;
  /** null when the dimension could not be assessed. */
  score: number | null;
  weight: number;
  available: boolean;
  status: DimensionStatus;
  triggered_rules: string[];
  explanation: string;
  required_fields: string[];
  missing_fields: string[];
}

export interface DataQualityWarning {
  code: string;
  message: string;
  fields: string[];
}

export interface RiskAssessment {
  project_id: string;
  /** null when no dimension was assessable. Never rendered as 0. */
  risk_score: number | null;
  risk_level: RiskLevel | null;
  assessment_status: AssessmentStatus;
  assessment_completeness: number;
  dimensions: DimensionResult[];
  signals: RiskSignal[];
  missing_fields: string[];
  data_quality_warnings: DataQualityWarning[];
  disclaimer: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

/** A single field-addressed validation failure returned by the backend. */
export interface FieldError {
  field: string;
  message: string;
}
