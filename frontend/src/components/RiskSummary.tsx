"use client";

/** Headline figures for an assessment: score, level, status, completeness. */

import { AlertIcon, ChartIcon, GaugeIcon, ShieldIcon } from "@/components/icons";
import { Badge, StatCard, cx } from "@/components/ui";
import {
  RISK_LEVEL_CLASSES,
  RISK_LEVEL_LABELS,
  UNKNOWN_LEVEL_CLASSES,
  formatScore,
} from "@/lib/format";
import type { RiskAssessment } from "@/types/assessment";

/** Icon-tile tints, matching the level band so the strip reads at a glance. */
const LEVEL_TILE: Record<string, string> = {
  low: "border-risk-low-line bg-risk-low-bg text-risk-low",
  medium: "border-risk-medium-line bg-risk-medium-bg text-risk-medium",
  high: "border-risk-high-line bg-risk-high-bg text-risk-high",
  critical: "border-risk-critical-line bg-risk-critical-bg text-risk-critical",
};

export function RiskSummary({ assessment }: { assessment: RiskAssessment }) {
  const { risk_score, risk_level, assessment_status, assessment_completeness } = assessment;
  const levelClasses = risk_level ? RISK_LEVEL_CLASSES[risk_level] : UNKNOWN_LEVEL_CLASSES;
  const tile = risk_level
    ? LEVEL_TILE[risk_level]
    : "border-risk-unknown-line bg-risk-unknown-bg text-risk-unknown";
  const incomplete = assessment_status === "incomplete";
  const completenessPercent = Math.round(assessment_completeness * 100);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Risk Score"
          icon={<GaugeIcon className="h-[18px] w-[18px]" />}
          iconTone={tile}
          value={
            <p className="tabular text-[34px] font-semibold leading-none tracking-tight text-ink">
              {formatScore(risk_score)}
              {risk_score !== null ? (
                <span className="ml-1 text-[14px] font-normal text-ink-subtle">/ 100</span>
              ) : null}
            </p>
          }
          caption={risk_score === null ? "Not scored — no dimension assessable." : "Engine-computed"}
        />

        <StatCard
          label="Risk Level"
          icon={<AlertIcon className="h-[18px] w-[18px]" />}
          iconTone={tile}
          value={
            <span
              className={cx(
                "inline-flex items-center rounded-full border px-3 py-1 text-[14px] font-semibold",
                levelClasses,
              )}
            >
              {risk_level ? RISK_LEVEL_LABELS[risk_level] : "Not determined"}
            </span>
          }
          caption="Band derived from the overall score"
        />

        <StatCard
          label="Assessment Status"
          icon={<ShieldIcon className="h-[18px] w-[18px]" />}
          iconTone={
            incomplete
              ? "border-risk-medium-line bg-risk-medium-bg text-risk-medium"
              : "border-risk-low-line bg-risk-low-bg text-risk-low"
          }
          value={
            <Badge
              tone={
                incomplete
                  ? "border-risk-medium-line bg-risk-medium-bg text-risk-medium"
                  : "border-risk-low-line bg-risk-low-bg text-risk-low"
              }
              className="text-[13px]"
            >
              {incomplete ? "Incomplete" : "Complete"}
            </Badge>
          }
          caption={incomplete ? "Some dimensions could not be assessed" : "All dimensions assessed"}
        />

        <StatCard
          label="Completeness"
          icon={<ChartIcon className="h-[18px] w-[18px]" />}
          value={
            <p className="tabular text-[26px] font-semibold leading-tight text-ink">
              {completenessPercent}%
            </p>
          }
          caption="of dimension weight assessed"
        >
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
            role="img"
            aria-label={`${completenessPercent}% of dimension weight was assessable`}
          >
            <div
              className="h-full rounded-full bg-brand-600"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </StatCard>
      </div>

      {incomplete ? (
        <div className="rounded-[var(--radius-card)] border border-risk-medium-line bg-risk-medium-bg px-5 py-3.5">
          <p className="text-[12.5px] leading-relaxed text-risk-medium">
            <span className="font-semibold">This is an incomplete assessment.</span>{" "}
            {completenessPercent}% of the scoring weight could be evaluated from the information
            provided. The score reflects only the dimensions that could be assessed and should not
            be read as a complete picture of this work.
          </p>
        </div>
      ) : null}
    </div>
  );
}
