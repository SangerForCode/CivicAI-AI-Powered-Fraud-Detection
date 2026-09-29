/**
 * Transport types for the portal API.
 *
 * Mirrors `backend/app/portal/schemas.py`. As with the engine types, nothing
 * here derives a risk figure — the backend sends scores and pre-formatted
 * strings, and the client renders them.
 */

import type { Category, ProjectStage, RiskAssessment, RiskLevel } from "@/types/assessment";

export type ReviewStatus = "open" | "under_review" | "completed" | "flagged";
export type DocumentStatus = "on_record" | "missing";
export type MilestoneStatus = "done" | "current" | "upcoming";

export type IssueType =
  | "work_not_started"
  | "work_stalled"
  | "quality_concern"
  | "incomplete_work"
  | "not_as_described"
  | "other";

export interface Money {
  amount: string;
  /** Indian digit grouping, formatted by the backend. */
  formatted: string;
}

export interface Duration {
  days: number;
  /** e.g. "1 year 8 months" — never derived client-side. */
  human: string;
}

export interface Milestone {
  label: string;
  date: string | null;
  date_formatted: string | null;
  status: MilestoneStatus;
}

export interface WorkDocument {
  name: string;
  status: DocumentStatus;
  date: string | null;
  date_formatted: string | null;
  source: string;
}

export interface CitizenReport {
  report_id: string;
  work_id: string;
  issue_type: IssueType;
  issue_label: string;
  description: string;
  submitted_on: string;
  submitted_on_formatted: string;
  has_photo: boolean;
  reporter_area: string | null;
  status: string;
}

export interface CitizenReportCreate {
  issue_type: IssueType;
  description: string;
  reporter_area?: string;
  has_photo?: boolean;
}

export interface WorkSummary {
  work_id: string;
  title: string;
  category: Category;
  category_label: string;
  state: string;
  district: string;
  block: string;
  lat: number;
  lon: number;
  sanctioned: Money;
  spent: Money | null;
  completion_percentage: number | null;
  stage: ProjectStage;
  stage_label: string;
  review_status: ReviewStatus;
  review_status_label: string;
  risk_score: number | null;
  risk_level: RiskLevel | null;
  key_flags: string[];
  citizen_report_count: number;
}

export interface WorkDetail {
  summary: WorkSummary;
  mp_name: string;
  agency: string;
  sanction_date: string;
  sanction_date_formatted: string;
  work_start_date: string | null;
  work_start_date_formatted: string | null;
  expected_completion: string | null;
  expected_completion_formatted: string | null;
  planned_duration: Duration | null;
  elapsed: Duration | null;
  schedule_note: string | null;
  last_progress_update: string | null;
  last_progress_update_formatted: string | null;
  since_last_update: Duration | null;
  image_key: string;
  milestones: Milestone[];
  documents: WorkDocument[];
  assessment: RiskAssessment;
  reports: CitizenReport[];
}

export interface WorkPage {
  works: WorkSummary[];
  total: number;
  offset: number;
  limit: number;
}

export interface CountBucket {
  key: string;
  label: string;
  count: number;
}

export interface TrendStat {
  key: string;
  label: string;
  value: number;
  delta_percent: number | null;
  delta_direction: "up" | "down" | null;
}

export interface DashboardSummary {
  kpis: TrendStat[];
  risk_distribution: CountBucket[];
  top_categories: CountBucket[];
  state_rollup: CountBucket[];
  high_risk_works: WorkSummary[];
  total_works: number;
  districts_covered: number;
  completed_percentage: number;
  disclaimer: string;
}

export interface CitizenStats {
  total_works: number;
  total_works_display: string;
  districts_covered: number;
  completed_percentage: number;
  disclaimer: string;
}

export interface FilterOptions {
  states: string[];
  districts: Record<string, string[]>;
  categories: CountBucket[];
  stages: CountBucket[];
}

export interface AnalysisMetric {
  label: string;
  value: number;
  unit: string;
  caption: string;
}

export interface ReviewAction {
  action: string;
  reason: string;
}

export interface AssistedAnalysis {
  headline: string;
  metrics: AnalysisMetric[];
  observations: string[];
  review_actions: ReviewAction[];
  corroborating_report_count: number;
  method: string;
  disclaimer: string;
}

/** Query parameters accepted by `GET /works`. */
export interface WorkQuery {
  state?: string;
  district?: string;
  category?: Category;
  stage?: ProjectStage;
  risk_level?: RiskLevel;
  review_status?: ReviewStatus;
  search?: string;
  sort?: "risk" | "amount" | "completion" | "id";
  offset?: number;
  limit?: number;
}
