"use client";

/**
 * The assisted-analysis panel.
 *
 * The backend composes this text from the engine's own signals and the citizen
 * reports on file — there is no model forming an opinion, and the panel says
 * so in its own footer rather than leaving the reader to assume otherwise. It
 * is placed below the risk breakdown on purpose: the evidence outranks the
 * summary of it.
 */

import { ArrowRightIcon, SparkIcon } from "@/components/icons";
import { Card, Skeleton, cx } from "@/components/ui";
import type { AssistedAnalysis } from "@/types/portal";

export function AnalysisPanel({
  analysis,
  loading,
}: {
  analysis: AssistedAnalysis | null;
  loading?: boolean;
}) {
  if (loading || !analysis) {
    return (
      <Card className="p-5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <Skeleton className="mt-5 h-16 w-full" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-brand-50/60 px-5 py-3">
        <SparkIcon className="h-4 w-4 text-brand-700" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
          Assisted Analysis
        </span>
      </div>

      <div className="p-5">
        <p className="text-[13.5px] leading-relaxed text-ink">{analysis.headline}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {analysis.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[var(--radius-field)] border border-line bg-sunken/60 px-4 py-3"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {metric.label}
              </p>
              <p className="tabular mt-1 text-[22px] font-semibold leading-none text-ink">
                {metric.value}
                <span className="ml-1 text-[12px] font-normal text-ink-subtle">{metric.unit}</span>
              </p>
              <p className="mt-1.5 text-[11px] leading-snug text-ink-subtle">{metric.caption}</p>
            </div>
          ))}
        </div>

        {analysis.observations.length > 0 ? (
          <div className="mt-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              Analysis
            </h3>
            <ul className="mt-2 space-y-2">
              {analysis.observations.map((observation) => (
                <li key={observation} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink">
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"
                    aria-hidden="true"
                  />
                  {observation}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {analysis.review_actions.length > 0 ? (
          <div className="mt-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              Recommended review areas
            </h3>
            <ul className="mt-2 space-y-1.5">
              {analysis.review_actions.map((action) => (
                <li
                  key={action.action}
                  className={cx(
                    "flex gap-2.5 rounded-[var(--radius-field)] border border-line px-3 py-2.5",
                    "transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50/40",
                  )}
                >
                  <ArrowRightIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-medium text-ink">{action.action}</span>
                    <span className="block text-[11px] text-ink-subtle">{action.reason}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 space-y-1 border-t border-line pt-3">
          <p className="text-[11px] leading-relaxed text-ink-subtle">{analysis.method}</p>
          <p className="text-[11px] font-medium leading-relaxed text-ink-muted">
            {analysis.disclaimer}
          </p>
        </div>
      </div>
    </Card>
  );
}
