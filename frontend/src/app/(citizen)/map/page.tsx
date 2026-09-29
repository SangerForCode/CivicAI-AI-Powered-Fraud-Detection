"use client";

/** Citizen map: works placed on India, filterable, with a compact detail card. */

import Link from "next/link";
import { useMemo, useState } from "react";

import { IndiaMap, MapLegend } from "@/components/IndiaMap";
import { RiskPill } from "@/components/RiskPill";
import { MapPinIcon } from "@/components/icons";
import { ErrorState } from "@/components/states";
import { Badge, Button, Card, CardHeader, SectionTitle, Skeleton } from "@/components/ui";
import { formatCount } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { fetchFilterOptions, fetchMapWorks } from "@/services/api";
import type { Category, RiskLevel } from "@/types/assessment";
import type { WorkSummary } from "@/types/portal";

/** Stable empty reference, so memo dependencies do not change every render. */
const NO_WORKS: WorkSummary[] = [];

export default function CitizenMapPage() {
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<WorkSummary | null>(null);

  const options = useAsync(() => fetchFilterOptions(), []);
  const key = `${state}|${category}`;
  const works = useAsync(
    () =>
      fetchMapWorks({
        state: state || undefined,
        category: (category || undefined) as Category | undefined,
        limit: 500,
      }),
    [key],
  );

  const markers = works.state.kind === "ready" ? works.state.data : NO_WORKS;
  const counts = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const work of markers) {
      const level = work.risk_level ?? "unscored";
      tally[level] = (tally[level] ?? 0) + 1;
    }
    return tally;
  }, [markers]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <SectionTitle
        title="Map view"
        subtitle="Every marker is one work. Colour shows the engine's current risk band."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <CardHeader
            title={
              works.state.kind === "ready"
                ? `${formatCount(markers.length)} works shown`
                : "Loading works"
            }
            subtitle="Select a marker to see the work."
            action={
              <div className="flex flex-wrap gap-2">
                <select
                  value={state}
                  onChange={(event) => {
                    setState(event.target.value);
                    setSelected(null);
                  }}
                  aria-label="Filter by state"
                  className="rounded-[var(--radius-field)] border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink focus:border-brand-400 focus:outline-none"
                >
                  <option value="">All states</option>
                  {options.state.kind === "ready"
                    ? options.state.data.states.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))
                    : null}
                </select>
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setSelected(null);
                  }}
                  aria-label="Filter by category"
                  className="rounded-[var(--radius-field)] border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink focus:border-brand-400 focus:outline-none"
                >
                  <option value="">All categories</option>
                  {options.state.kind === "ready"
                    ? options.state.data.categories.map((bucket) => (
                        <option key={bucket.key} value={bucket.key}>
                          {bucket.label}
                        </option>
                      ))
                    : null}
                </select>
              </div>
            }
          />

          <div className="bg-sunken/40 p-3 sm:p-5">
            {works.state.kind === "error" ? (
              <ErrorState error={works.state.error} onRetry={works.reload} />
            ) : works.state.kind === "loading" ? (
              <Skeleton className="mx-auto h-[380px] w-full max-w-[520px] sm:h-[520px]" />
            ) : (
              <IndiaMap
                works={markers}
                selectedId={selected?.work_id ?? null}
                onSelect={setSelected}
                className="mx-auto max-w-[560px]"
                markerScale={1}
              />
            )}
          </div>

          <div className="border-t border-line px-5 py-3">
            <MapLegend />
          </div>
        </Card>

        <div className="space-y-4">
          {selected ? (
            <Card className="animate-rise p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="tabular font-mono text-[11.5px] text-ink-subtle">
                  {selected.work_id}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close work details"
                  className="text-ink-subtle transition-colors duration-150 hover:text-ink"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <h3 className="mt-1 text-[14.5px] font-semibold leading-snug text-ink">
                {selected.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-muted">
                <MapPinIcon className="h-3.5 w-3.5 text-ink-subtle" />
                {selected.block}, {selected.district} · {selected.state}
              </p>

              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Risk score</dt>
                  <dd className="mt-1">
                    <RiskPill score={selected.risk_score} level={selected.risk_level} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Completion</dt>
                  <dd className="tabular mt-1 text-[14px] font-semibold text-ink">
                    {selected.completion_percentage === null
                      ? "Not reported"
                      : `${Math.round(selected.completion_percentage)}%`}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Sanctioned</dt>
                  <dd className="tabular mt-1 text-[14px] font-semibold text-ink">
                    {selected.sanctioned.formatted}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge>{selected.category_label}</Badge>
                <Badge>{selected.stage_label}</Badge>
              </div>

              <Link href={`/works/${selected.work_id}`} className="mt-4 block">
                <Button className="w-full">View Project</Button>
              </Link>
            </Card>
          ) : (
            <Card className="p-5 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-line bg-sunken text-ink-subtle">
                <MapPinIcon className="h-5 w-5" />
              </span>
              <p className="mt-2.5 text-[13px] font-medium text-ink">Select a marker</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                Tap any point on the map to see that work and open its full record.
              </p>
            </Card>
          )}

          <Card className="p-4">
            <p className="text-[12.5px] font-medium text-ink">Works shown, by risk band</p>
            <ul className="mt-3 space-y-2">
              {(["critical", "high", "medium", "low"] as RiskLevel[]).map((level) => (
                <li key={level} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2 capitalize text-ink-muted">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: `var(--color-risk-${level})` }}
                      aria-hidden="true"
                    />
                    {level}
                  </span>
                  <span className="tabular font-medium text-ink">{counts[level] ?? 0}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-subtle">
              A risk band is a prompt to check a record, not a judgement about the work or anyone
              involved in it.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
