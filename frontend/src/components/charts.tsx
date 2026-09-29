"use client";

/**
 * Hand-drawn SVG charts.
 *
 * Two small, specific charts do not justify a charting dependency, and drawing
 * them here keeps the palette under the design system's control rather than a
 * library's defaults.
 */

import { useId, useMemo } from "react";

import { cx } from "@/components/ui";
import { formatCount } from "@/lib/format";
import type { CountBucket } from "@/types/portal";

const RISK_COLOURS: Record<string, string> = {
  critical: "var(--color-risk-critical)",
  high: "var(--color-risk-high)",
  medium: "var(--color-risk-medium)",
  low: "var(--color-risk-low)",
  unscored: "var(--color-risk-unknown)",
};

function colourFor(key: string, index: number): string {
  return RISK_COLOURS[key] ?? ["#075c4b", "#1b8a6b", "#3f8a76", "#8ab5a6", "#b0d0c5"][index % 5];
}

/** Donut with a centred total. Segments are drawn as stroked arcs. */
export function DonutChart({
  buckets,
  total,
  totalLabel,
  size = 176,
}: {
  buckets: CountBucket[];
  total: number;
  totalLabel: string;
  size?: number;
}) {
  const titleId = useId();
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = buckets.filter((bucket) => bucket.count > 0);

  // Each arc starts where the previous ones ended. Summing the preceding
  // lengths keeps this a pure expression; the list is never more than a
  // handful of segments, so the repeated sum costs nothing.
  const segments = useMemo(() => {
    const lengths = visible.map(
      (bucket) => (total > 0 ? bucket.count / total : 0) * circumference,
    );
    return visible.map((bucket, index) => ({
      key: bucket.key,
      colour: colourFor(bucket.key, index),
      dash: `${lengths[index]} ${circumference - lengths[index]}`,
      offset: -lengths.slice(0, index).reduce((sum, value) => sum + value, 0),
    }));
  }, [visible, total, circumference]);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-labelledby={titleId}
        >
          <title id={titleId}>
            {`${totalLabel}: ` +
              visible.map((bucket) => `${bucket.label} ${bucket.count}`).join(", ")}
          </title>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-sunken)"
              strokeWidth={stroke}
            />
            {segments.map((segment) => (
              <circle
                key={segment.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.colour}
                strokeWidth={stroke}
                strokeDasharray={segment.dash}
                strokeDashoffset={segment.offset}
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-[22px] font-semibold leading-none text-ink">
            {formatCount(total)}
          </span>
          <span className="mt-1 text-[11px] text-ink-muted">{totalLabel}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-2">
        {visible.map((bucket, index) => {
          const share = total > 0 ? (bucket.count / total) * 100 : 0;
          return (
            <li key={bucket.key} className="flex items-center gap-2.5 text-[12.5px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: colourFor(bucket.key, index) }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-ink-muted">{bucket.label}</span>
              <span className="tabular shrink-0 font-medium text-ink">
                {share.toFixed(1)}%
              </span>
              <span className="tabular w-14 shrink-0 text-right text-ink-subtle">
                {formatCount(bucket.count)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Horizontal bars. One colour: the comparison is the length, not the hue. */
export function BarList({
  buckets,
  emptyMessage = "Nothing to show.",
  className,
}: {
  buckets: CountBucket[];
  emptyMessage?: string;
  className?: string;
}) {
  if (buckets.length === 0) {
    return <p className={cx("text-[12.5px] text-ink-muted", className)}>{emptyMessage}</p>;
  }
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <ul className={cx("space-y-2.5", className)}>
      {buckets.map((bucket) => (
        <li key={bucket.key} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-[12.5px] text-ink-muted">{bucket.label}</span>
          <span className="h-5 overflow-hidden rounded-[4px] bg-sunken">
            <span
              className="block h-full rounded-[4px] bg-brand-400 transition-[width] duration-500"
              style={{ width: `${Math.max((bucket.count / max) * 100, 3)}%` }}
            />
          </span>
          <span className="tabular w-9 text-right text-[12.5px] font-medium text-ink">
            {bucket.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
