/**
 * Display helpers.
 *
 * Presentation only. Nothing here participates in scoring, and no value shown
 * as evidence for a signal is formatted here — those arrive pre-formatted from
 * the engine so a reviewer sees the same rendering the rule reasoned about.
 */

import type { DimensionKey, ProjectStage, RiskLevel, Severity } from "@/types/assessment";
import type { IssueType, MilestoneStatus, ReviewStatus } from "@/types/portal";

/** Turns a snake_case schema field into something readable in the UI. */
export function humaniseField(field: string): string {
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const STAGE_LABELS: Record<ProjectStage, string> = {
  recommended: "Recommended",
  sanctioned: "Sanctioned",
  in_progress: "In Progress",
  completed: "Completed",
  abandoned: "Abandoned",
};

export const CATEGORY_LABELS: Record<string, string> = {
  road: "Road",
  drinking_water: "Drinking Water",
  sanitation: "Sanitation",
  education: "Education",
  health: "Health",
  community_asset: "Community Asset",
  public_lighting: "Public Lighting",
  sports: "Sports",
  other: "Other",
};

export const DIMENSION_DESCRIPTIONS: Record<DimensionKey, string> = {
  financial_anomaly: "Expenditure against sanction and reported physical progress.",
  timeline_anomaly: "Elapsed time against the planned execution window.",
  documentation_gaps: "Records expected at the work's current stage.",
  stale_progress: "Recency of progress reporting on an active work.",
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  info: "Info",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Tailwind classes per risk level. Muted by design: a tint and a border, never a solid block. */
export const RISK_LEVEL_CLASSES: Record<RiskLevel, string> = {
  low: "text-risk-low bg-risk-low-bg border-risk-low-line",
  medium: "text-risk-medium bg-risk-medium-bg border-risk-medium-line",
  high: "text-risk-high bg-risk-high-bg border-risk-high-line",
  critical: "text-risk-critical bg-risk-critical-bg border-risk-critical-line",
};

export const UNKNOWN_LEVEL_CLASSES =
  "text-risk-unknown bg-risk-unknown-bg border-risk-unknown-line";

/** Severity reuses the risk palette so one visual language covers both. */
export const SEVERITY_CLASSES: Record<Severity, string> = {
  info: UNKNOWN_LEVEL_CLASSES,
  low: RISK_LEVEL_CLASSES.low,
  medium: RISK_LEVEL_CLASSES.medium,
  high: RISK_LEVEL_CLASSES.high,
  critical: RISK_LEVEL_CLASSES.critical,
};

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

/** Dimension weights arrive as a 0-1 fraction; reviewers read them as percentages. */
export function formatWeight(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

export function formatScore(score: number | null): string {
  return score === null ? "—" : String(Math.round(score));
}


// --- portal labels --------------------------------------------------------

export const REVIEW_STATUS_CLASSES: Record<ReviewStatus, string> = {
  open: "border-line bg-sunken text-ink-muted",
  under_review: "border-risk-medium-line bg-risk-medium-bg text-risk-medium",
  completed: "border-risk-low-line bg-risk-low-bg text-risk-low",
  flagged: "border-risk-high-line bg-risk-high-bg text-risk-high",
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  work_not_started: "Work does not appear to have started",
  work_stalled: "Work appears to have stopped",
  quality_concern: "Concern about quality of work",
  incomplete_work: "Recorded as done but appears incomplete",
  not_as_described: "Work on site differs from the description",
  other: "Other observation",
};

export const MILESTONE_CLASSES: Record<MilestoneStatus, { dot: string; text: string }> = {
  done: { dot: "bg-accent-500 border-accent-500", text: "text-ink" },
  current: { dot: "bg-brand-700 border-brand-700 ring-4 ring-brand-100", text: "text-ink" },
  upcoming: { dot: "bg-surface border-line-strong", text: "text-ink-subtle" },
};

/** Dot colour for a risk level, for map markers and legends. */
export const RISK_DOT: Record<RiskLevel, string> = {
  low: "var(--color-risk-low)",
  medium: "var(--color-risk-medium)",
  high: "var(--color-risk-high)",
  critical: "var(--color-risk-critical)",
};

export const UNKNOWN_DOT = "var(--color-risk-unknown)";

/** Compact Indian-style count, e.g. 1420 -> "1,420". Display only. */
export function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

/**
 * Risk score rendered for a pill. Null means the record could not be assessed,
 * which is shown as a dash rather than a zero.
 */
export function riskPillText(score: number | null): string {
  return score === null ? "—" : String(Math.round(score));
}
