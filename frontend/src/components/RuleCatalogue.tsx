"use client";

/**
 * Read-only view of `GET /risk/rules`.
 *
 * The engine owns the catalogue; this renders it and nothing more. Rules are
 * grouped by dimension so a reviewer can see which inputs each check needs
 * before deciding what to enter on the form.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { Badge, Card, CardHeader, Button, FieldChip, Spinner, cx } from "@/components/ui";
import {
  DIMENSION_DESCRIPTIONS,
  SEVERITY_CLASSES,
  SEVERITY_LABELS,
  humaniseField,
} from "@/lib/format";
import { ApiError, fetchRules } from "@/services/api";
import type { DimensionKey, RuleCatalogueResponse, RuleDescription } from "@/types/assessment";

const DIMENSION_ORDER: DimensionKey[] = [
  "financial_anomaly",
  "timeline_anomaly",
  "documentation_gaps",
  "stale_progress",
];

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  financial_anomaly: "Financial Anomaly",
  timeline_anomaly: "Timeline Anomaly",
  documentation_gaps: "Documentation Gaps",
  stale_progress: "Stale Progress Reporting",
};

type State =
  | { kind: "loading" }
  | { kind: "ready"; catalogue: RuleCatalogueResponse }
  | { kind: "error"; message: string };

export function RuleCatalogue() {
  const [state, setState] = useState<State>({ kind: "loading" });
  /** Guards against a fetch resolving after unmount. */
  const liveRef = useRef(true);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const catalogue = await fetchRules();
      if (!liveRef.current) return;
      setState({ kind: "ready", catalogue });
    } catch (caught) {
      if (!liveRef.current) return;
      setState({
        kind: "error",
        message:
          caught instanceof ApiError
            ? caught.message
            : "The rule catalogue could not be loaded.",
      });
    }
  }, []);

  useEffect(() => {
    liveRef.current = true;
    // Deferred rather than awaited in the effect body, so the first paint is
    // the loading state rather than a cascading re-render.
    const timer = setTimeout(() => void load(), 0);
    return () => {
      liveRef.current = false;
      clearTimeout(timer);
    };
  }, [load]);

  if (state.kind === "loading") {
    return (
      <Card className="flex items-center gap-3 px-6 py-10 text-[13px] text-ink-muted">
        <Spinner className="h-4 w-4 text-brand-600" />
        Loading the rule catalogue from the engine…
      </Card>
    );
  }

  if (state.kind === "error") {
    return (
      <Card className="px-6 py-8">
        <p className="text-[14px] font-semibold text-ink">Rule catalogue unavailable</p>
        <p className="mt-1 text-[13px] text-ink-muted">{state.message}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </Card>
    );
  }

  const byDimension = new Map<DimensionKey, RuleDescription[]>();
  for (const rule of state.catalogue.rules) {
    byDimension.set(rule.dimension, [...(byDimension.get(rule.dimension) ?? []), rule]);
  }

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-[13px] leading-relaxed text-ink-muted">
        Every check the engine can run, straight from{" "}
        <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[12px]">
          GET /risk/rules
        </code>
        . A rule is evaluated only when all the fields it requires are present — otherwise its
        dimension is reported as unavailable rather than scored as zero.
      </p>

      {DIMENSION_ORDER.map((key) => {
        const rules = byDimension.get(key) ?? [];
        if (rules.length === 0) return null;
        return (
          <Card key={key}>
            <CardHeader
              title={DIMENSION_LABELS[key]}
              subtitle={DIMENSION_DESCRIPTIONS[key]}
              action={<Badge>{rules.length} rules</Badge>}
            />
            <ul className="divide-y divide-line">
              {rules.map((rule) => (
                <li key={rule.rule_id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-[12px] font-medium text-brand-700">
                      {rule.rule_id}
                    </code>
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium",
                        SEVERITY_CLASSES[rule.severity],
                      )}
                    >
                      {SEVERITY_LABELS[rule.severity]}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink">{rule.description}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11.5px] text-ink-subtle">Requires</span>
                    {rule.required_fields.map((field) => (
                      <FieldChip key={field}>{humaniseField(field)}</FieldChip>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
