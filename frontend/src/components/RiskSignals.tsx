"use client";

/**
 * Triggered rules, each with the observed values and the input fields that
 * produced it. The evidence fields are the point of this section: a reviewer
 * should be able to read a signal and know exactly which inputs to go check.
 */

import { Badge, Card, CardHeader, FieldChip, cx } from "@/components/ui";
import { SEVERITY_CLASSES, SEVERITY_LABELS, humaniseField } from "@/lib/format";
import type { RiskSignal } from "@/types/assessment";

export function RiskSignals({ signals }: { signals: RiskSignal[] }) {
  return (
    <Card>
      <CardHeader
        title="Triggered Risk Signals"
        subtitle="Indicators for human review. A signal is not a finding."
        action={
          <Badge>
            {signals.length} signal{signals.length === 1 ? "" : "s"}
          </Badge>
        }
      />

      {signals.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-ink-muted">
          No rules triggered on the information provided. Where a dimension was unavailable, this
          reflects an absence of information rather than an absence of risk.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {signals.map((signal) => (
            <SignalRow key={signal.rule_id} signal={signal} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function SignalRow({ signal }: { signal: RiskSignal }) {
  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[12px] font-medium text-ink">
          {signal.rule_id}
        </code>
        <span
          className={cx(
            "inline-flex items-center rounded border px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide",
            SEVERITY_CLASSES[signal.severity],
          )}
        >
          {SEVERITY_LABELS[signal.severity]}
        </span>
      </div>

      <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{signal.explanation}</p>

      {signal.observed.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Observed
          </p>
          <dl className="mt-1.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {signal.observed.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-3 border-b border-dashed border-line py-1">
                <dt className="text-[12.5px] text-ink-muted">{item.label}</dt>
                <dd className="tabular text-[12.5px] font-medium text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {signal.evidence_fields.length > 0 ? (
        <div className="mt-3 rounded-md border border-accent-600/20 bg-accent-50/60 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-700">
            Evidence fields
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {signal.evidence_fields.map((field) => (
              <FieldChip key={field}>{field}</FieldChip>
            ))}
          </div>
          <p className="mt-1.5 text-[11.5px] text-accent-700/80">
            {signal.evidence_fields.map(humaniseField).join(" · ")}
          </p>
        </div>
      ) : null}
    </li>
  );
}
