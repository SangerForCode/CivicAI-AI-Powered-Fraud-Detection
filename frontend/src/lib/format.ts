/**
 * Display helpers.
 *
 * Presentation only. Nothing here participates in scoring, and no value shown
 * as evidence for a signal is formatted here — those arrive pre-formatted from
 * the engine so a reviewer sees the same rendering the rule reasoned about.
 */

import type { DimensionKey, ProjectStage, RiskLevel, Severity } from "@/types/assessment";

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
