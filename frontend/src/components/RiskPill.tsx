/** The score-plus-band pill used in tables, cards and map popovers. */

import { RISK_LEVEL_CLASSES, RISK_LEVEL_LABELS, UNKNOWN_LEVEL_CLASSES, riskPillText } from "@/lib/format";
import { cx } from "@/components/ui";
import type { RiskLevel } from "@/types/assessment";

export function RiskPill({
  score,
  level,
  size = "md",
  showLabel = true,
  className,
}: {
  score: number | null;
  level: RiskLevel | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const classes = level ? RISK_LEVEL_CLASSES[level] : UNKNOWN_LEVEL_CLASSES;
  const sizes = {
    sm: "px-2 py-0.5 text-[11.5px]",
    md: "px-2.5 py-1 text-[12.5px]",
    lg: "px-3 py-1.5 text-[14px]",
  } as const;

  return (
    <span
      className={cx(
        "tabular inline-flex items-center gap-1.5 rounded-full border font-semibold",
        classes,
        sizes[size],
        className,
      )}
    >
      {riskPillText(score)}
      {showLabel ? (
        <span className="font-medium opacity-80">
          {level ? RISK_LEVEL_LABELS[level] : "Not assessable"}
        </span>
      ) : null}
    </span>
  );
}

/** A horizontal score bar. Preferred over a gauge: it compares well in a list. */
export function RiskBar({
  score,
  level,
  label,
  caption,
}: {
  score: number | null;
  level: RiskLevel | null;
  label: string;
  caption?: string;
}) {
  const unavailable = score === null;
  const colour = unavailable
    ? "var(--color-risk-unknown)"
    : `var(--color-risk-${level ?? "unknown"})`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] text-ink">{label}</span>
        <span className="tabular text-[12.5px] font-semibold text-ink">
          {unavailable ? "Not assessed" : Math.round(score)}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sunken">
        {unavailable ? (
          // A hatched track, so "unknown" never reads as "zero".
          <div
            className="h-full w-full opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, var(--color-line-strong) 0 4px, transparent 4px 8px)",
            }}
          />
        ) : (
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.max(score, 1.5)}%`, background: colour }}
          />
        )}
      </div>
      {caption ? <p className="mt-1 text-[11px] text-ink-subtle">{caption}</p> : null}
    </div>
  );
}
