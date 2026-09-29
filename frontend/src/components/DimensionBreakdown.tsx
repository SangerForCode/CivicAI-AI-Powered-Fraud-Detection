"use client";

/** The four scoring dimensions, always all shown — including unavailable ones. */

import { Badge, Card, CardHeader, FieldChip, cx } from "@/components/ui";
import { DIMENSION_DESCRIPTIONS, formatScore, formatWeight, humaniseField } from "@/lib/format";
import type { DimensionResult } from "@/types/assessment";

/** Colour a dimension by its own score, using the same bands as the overall level. */
function scoreTone(score: number | null): string {
  if (score === null) return "text-ink-subtle";
  if (score < 25) return "text-risk-low";
  if (score < 50) return "text-risk-medium";
  if (score < 75) return "text-risk-high";
  return "text-risk-critical";
}

export function DimensionBreakdown({ dimensions }: { dimensions: DimensionResult[] }) {
  return (
    <Card>
      <CardHeader
        title="Dimension Breakdown"
        subtitle="Each dimension is scored only when the information it needs is available."
      />
      <div className="divide-y divide-line">
        {dimensions.map((dimension) => (
          <DimensionRow key={dimension.key} dimension={dimension} />
        ))}
      </div>
    </Card>
  );
}

function DimensionRow({ dimension }: { dimension: DimensionResult }) {
  const unavailable = !dimension.available;

  return (
    <div className={cx("px-5 py-4", unavailable && "bg-sunken/60")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-ink">{dimension.label}</h3>
            <Badge>Weight {formatWeight(dimension.weight)}</Badge>
            {unavailable ? (
              <Badge tone="border-line-strong bg-sunken text-ink-muted">Unavailable</Badge>
            ) : (
              <Badge tone="border-risk-low-line bg-risk-low-bg text-risk-low">Available</Badge>
            )}
          </div>
          <p className="mt-1 text-[12.5px] text-ink-subtle">
            {DIMENSION_DESCRIPTIONS[dimension.key]}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className={cx("tabular text-[26px] font-semibold leading-none", scoreTone(dimension.score))}>
            {formatScore(dimension.score)}
          </p>
          <p className="mt-1 text-[11px] text-ink-subtle">
            {dimension.score === null ? "not scored" : "of 100"}
          </p>
        </div>
      </div>

      <p
        className={cx(
          "mt-3 text-[12.5px] leading-relaxed",
          unavailable ? "text-ink-muted" : "text-ink-muted",
        )}
      >
        {dimension.explanation}
      </p>

      {dimension.triggered_rules.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] font-medium text-ink-subtle">Triggered:</span>
          {dimension.triggered_rules.map((ruleId) => (
            <code
              key={ruleId}
              className="rounded-md border border-line bg-sunken px-1.5 py-0.5 font-mono text-[11.5px] text-ink"
            >
              {ruleId}
            </code>
          ))}
        </div>
      ) : null}

      {dimension.missing_fields.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] font-medium text-ink-subtle">
            {unavailable ? "Requires:" : "Not provided:"}
          </span>
          {dimension.missing_fields.map((field) => (
            <FieldChip key={field}>{humaniseField(field)}</FieldChip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
