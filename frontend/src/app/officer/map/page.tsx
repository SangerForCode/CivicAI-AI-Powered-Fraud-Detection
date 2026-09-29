"use client";

/** Analytical risk map: markers, state shading and a filterable side list. */

import { useMemo, useState } from "react";

import { IndiaMap, MapLegend } from "@/components/IndiaMap";
import { OfficerShell } from "@/components/OfficerShell";
import { RiskPill } from "@/components/RiskPill";
import { WorkPreviewCard } from "@/components/WorkPreview";
import { MapPinIcon } from "@/components/icons";
import { ErrorState } from "@/components/states";
import { Card, CardHeader, Skeleton, cx } from "@/components/ui";
import { formatCount } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { fetchFilterOptions, fetchMapWorks } from "@/services/api";
import type { Category, RiskLevel } from "@/types/assessment";
import type { WorkSummary } from "@/types/portal";

/** Stable empty reference, so memo dependencies do not change every render. */
const NO_WORKS: WorkSummary[] = [];

const LEVELS: (RiskLevel | "")[] = ["", "critical", "high", "medium", "low"];

export default function OfficerMapPage() {
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<RiskLevel | "">("");
  const [selected, setSelected] = useState<WorkSummary | null>(null);

  const options = useAsync(() => fetchFilterOptions(), []);
  const key = `${state}|${category}|${level}`;
  const works = useAsync(
    () =>
      fetchMapWorks({
        state: state || undefined,
        category: (category || undefined) as Category | undefined,
        risk_level: (level || undefined) as RiskLevel | undefined,
        limit: 600,
      }),
    [key],
  );

  const markers = works.state.kind === "ready" ? works.state.data : NO_WORKS;

  // Shade states by their count of flagged works, so clusters read at a glance.
  const tints = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const work of markers) {
      if (work.risk_level === "high" || work.risk_level === "critical") {
        counts[work.state] = (counts[work.state] ?? 0) + 1;
      }
    }
    const max = Math.max(...Object.values(counts), 1);
    const shaded: Record<string, string> = {};
    for (const [name, count] of Object.entries(counts)) {
      // Kept faint on purpose. The shading is a density hint behind the
      // markers; at full strength it washes the whole country orange and
      // reads as a verdict on every state rather than a count.
      const intensity = Math.round((0.05 + (count / max) * 0.16) * 100);
      shaded[name] = `color-mix(in srgb, var(--color-risk-high) ${intensity}%, var(--color-brand-50))`;
    }
    return shaded;
  }, [markers]);

  const flagged = markers.filter(
    (work) => work.risk_level === "high" || work.risk_level === "critical",
  );

  return (
    <OfficerShell
      title="Risk Map"
      subtitle="Where flagged works are concentrated, and which ones they are."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardHeader
            title={
              works.state.kind === "ready"
                ? `${formatCount(markers.length)} works · ${formatCount(flagged.length)} flagged`
                : "Loading map"
            }
            subtitle="Shading shows states holding high or critical works."
            action={
              <div className="flex flex-wrap gap-2">
                <select
                  value={state}
                  onChange={(event) => { setState(event.target.value); setSelected(null); }}
                  aria-label="Filter by state"
                  className="rounded-[var(--radius-field)] border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink focus:border-brand-400 focus:outline-none"
                >
                  <option value="">All states</option>
                  {options.state.kind === "ready"
                    ? options.state.data.states.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))
                    : null}
                </select>
                <select
                  value={category}
                  onChange={(event) => { setCategory(event.target.value); setSelected(null); }}
                  aria-label="Filter by category"
                  className="rounded-[var(--radius-field)] border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink focus:border-brand-400 focus:outline-none"
                >
                  <option value="">All categories</option>
                  {options.state.kind === "ready"
                    ? options.state.data.categories.map((bucket) => (
                        <option key={bucket.key} value={bucket.key}>{bucket.label}</option>
                      ))
                    : null}
                </select>
              </div>
            }
          />

          <div className="flex flex-wrap gap-1.5 border-b border-line px-5 py-2.5">
            {LEVELS.map((candidate) => (
              <button
                key={candidate || "all"}
                type="button"
                onClick={() => { setLevel(candidate); setSelected(null); }}
                className={cx(
                  "rounded-full border px-3 py-1 text-[12px] font-medium capitalize transition-colors duration-150",
                  level === candidate
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-line text-ink-muted hover:bg-sunken",
                )}
              >
                {candidate || "All levels"}
              </button>
            ))}
          </div>

          <div className="bg-sunken/40 p-3 sm:p-5">
            {works.state.kind === "error" ? (
              <ErrorState error={works.state.error} onRetry={works.reload} />
            ) : works.state.kind === "loading" ? (
              <Skeleton className="mx-auto h-[380px] w-full max-w-[520px] sm:h-[520px]" />
            ) : (
              <IndiaMap
                works={markers}
                highlightStates={tints}
                selectedId={selected?.work_id ?? null}
                onSelect={setSelected}
                className="mx-auto max-w-[560px]"
              />
            )}
          </div>

          <div className="border-t border-line px-5 py-3">
            <MapLegend />
          </div>
        </Card>

        <div className="space-y-4">
          {selected ? (
            <Card className="animate-rise overflow-hidden">
              <WorkPreviewCard
                work={selected}
                href={`/officer/works/${selected.work_id}`}
                onClose={() => setSelected(null)}
              />
            </Card>
          ) : (
            <Card className="p-5 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-line bg-sunken text-ink-subtle">
                <MapPinIcon className="h-5 w-5" />
              </span>
              <p className="mt-2.5 text-[13px] font-medium text-ink">Select a marker</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                Pick a point on the map, or a row below, to preview that work before opening it.
              </p>
            </Card>
          )}

          <Card className="overflow-hidden">
            <CardHeader title="Flagged works in view" subtitle="High and critical only." />
            {works.state.kind === "ready" ? (
              flagged.length === 0 ? (
                <p className="px-5 py-4 text-[12.5px] text-ink-muted">
                  No high or critical works in the current selection.
                </p>
              ) : (
                <ul className="thin-scroll max-h-[420px] divide-y divide-line overflow-y-auto">
                  {flagged.slice(0, 40).map((work) => (
                    <li key={work.work_id}>
                      <button
                        type="button"
                        onClick={() => setSelected(work)}
                        className={cx(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-sunken",
                          selected?.work_id === work.work_id && "bg-brand-50",
                        )}
                      >
                        <RiskPill
                          score={work.risk_score}
                          level={work.risk_level}
                          size="sm"
                          showLabel={false}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-ink">
                            {work.title}
                          </span>
                          <span className="block truncate text-[11px] text-ink-subtle">
                            {work.work_id} · {work.district}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-9 w-full" />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </OfficerShell>
  );
}
