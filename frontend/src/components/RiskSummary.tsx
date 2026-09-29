"use client";

/** Headline figures for an assessment: score, level, status, completeness. */

import { Badge, Card, cx } from "@/components/ui";
import {
  RISK_LEVEL_CLASSES,
  RISK_LEVEL_LABELS,
  UNKNOWN_LEVEL_CLASSES,
  formatScore,
} from "@/lib/format";
import type { RiskAssessment } from "@/types/assessment";

export function RiskSummary({ assessment }: { assessment: RiskAssessment }) {
  const { risk_score, risk_level, assessment_status, assessment_completeness } = assessment;
  const levelClasses = risk_level ? RISK_LEVEL_CLASSES[risk_level] : UNKNOWN_LEVEL_CLASSES;
  const incomplete = assessment_status === "incomplete";
  const completenessPercent = Math.round(assessment_completeness * 100);

  return (
    <Card>
      <div className="grid gap-px overflow-hidden rounded-[10px] bg-line sm:grid-cols-4">
        <div className={cx("bg-surface px-5 py-5", risk_score === null && "sm:col-span-1")}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Risk Score
          </p>
          <p className="tabular mt-1 text-[40px] font-semibold leading-none tracking-tight text-ink">
            {formatScore(risk_score)}
            {risk_score !== null ? (
              <span className="ml-1 text-[15px] font-normal text-ink-subtle">/ 100</span>
            ) : null}
          </p>
          {risk_score === null ? (
            <p className="mt-1.5 text-[12px] text-ink-muted">Not scored — no dimension assessable.</p>
          ) : null}
        </div>

        <div className="bg-surface px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Risk Level
          </p>
          <div className="mt-2">
            <span
              className={cx(
                "inline-flex items-center rounded-md border px-2.5 py-1 text-[14px] font-semibold",
                levelClasses,
              )}
            >
              {risk_level ? RISK_LEVEL_LABELS[risk_level] : "Not determined"}
            </span>
          </div>
        </div>

        <div className="bg-surface px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Assessment Status
          </p>
          <div className="mt-2">
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
          </div>
        </div>

        <div className="bg-surface px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Completeness
          </p>
          <p className="tabular mt-1 text-[22px] font-semibold leading-tight text-ink">
            {completenessPercent}%
          </p>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
            role="img"
            aria-label={`${completenessPercent}% of dimension weight was assessable`}
          >
            <div
              className="h-full rounded-full bg-brand-600"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11.5px] text-ink-subtle">of dimension weight assessed</p>
        </div>
      </div>

      {incomplete ? (
        <div className="border-t border-risk-medium-line bg-risk-medium-bg px-5 py-3">
          <p className="text-[12.5px] leading-relaxed text-risk-medium">
            <span className="font-semibold">This is an incomplete assessment.</span>{" "}
            {completenessPercent}% of the scoring weight could be evaluated from the information
            provided. The score reflects only the dimensions that could be assessed and should not
            be read as a complete picture of this work.
          </p>
        </div>
      ) : null}
    </Card>
  );
}
