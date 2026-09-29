"use client";

/**
 * Officer dashboard.
 *
 * It has one job: answer "what needs attention?" before the reader scrolls.
 * KPIs, then where the risk is concentrated, then the actual queue.
 */

import Link from "next/link";
import { useMemo } from "react";

import { BarList, DonutChart } from "@/components/charts";
import { IndiaMap, MapLegend } from "@/components/IndiaMap";
import { OfficerShell } from "@/components/OfficerShell";
import { RiskPill } from "@/components/RiskPill";
import {
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  EyeIcon,
  TriangleAlertIcon,
  WorksIcon,
} from "@/components/icons";
import { ErrorState } from "@/components/states";
import { Badge, Button, Card, CardHeader, Disclaimer, Skeleton, Stat, cx } from "@/components/ui";
import { REVIEW_STATUS_CLASSES, formatCount } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { fetchDashboard, fetchMapWorks } from "@/services/api";

const KPI_ICONS: Record<string, React.ReactNode> = {
  total: <WorksIcon className="h-[18px] w-[18px]" />,
  high_risk: <TriangleAlertIcon className="h-[18px] w-[18px]" />,
  under_review: <EyeIcon className="h-[18px] w-[18px]" />,
  completed: <CheckIcon className="h-[18px] w-[18px]" />,
};

const KPI_TONES: Record<string, string> = {
  total: "border-brand-100 bg-brand-50 text-brand-700",
  high_risk: "border-risk-critical-line bg-risk-critical-bg text-risk-critical",
  under_review: "border-risk-medium-line bg-risk-medium-bg text-risk-medium",
  completed: "border-risk-low-line bg-risk-low-bg text-risk-low",
};

export default function OfficerDashboard() {
  const dashboard = useAsync(() => fetchDashboard(), []);
  const mapWorks = useAsync(() => fetchMapWorks({ limit: 400 }), []);

  const data = dashboard.state.kind === "ready" ? dashboard.state.data : null;

  // Tint each state by how many flagged works it holds, so the map carries
  // information rather than just repeating the marker layer.
  const stateTints = useMemo(() => {
    if (!data) return {};
    const max = Math.max(...data.state_rollup.map((bucket) => bucket.count), 1);
    const tints: Record<string, string> = {};
    for (const bucket of data.state_rollup) {
      // Faint: a density hint behind the markers, not a verdict on the state.
      const intensity = 0.05 + (bucket.count / max) * 0.16;
      tints[bucket.key] = `color-mix(in srgb, var(--color-risk-high) ${Math.round(
        intensity * 100,
      )}%, var(--color-brand-50))`;
    }
    return tints;
  }, [data]);

  return (
    <OfficerShell
      title="Dashboard"
      subtitle="Risk, Anomaly & Compliance Intelligence for MPLADS works"
      actions={
        <Link href="/officer/works" className="hidden sm:block">
          <Button size="sm">
            Open works queue
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Button>
        </Link>
      }
    >
      {dashboard.state.kind === "error" ? (
        <ErrorState error={dashboard.state.error} onRetry={dashboard.reload} />
      ) : (
        <div className="space-y-5">
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboard.state.kind === "loading"
              ? Array.from({ length: 4 }, (_, index) => (
                  <Card key={index} className="p-5">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="mt-3 h-8 w-20" />
                    <Skeleton className="mt-3 h-2.5 w-28" />
                  </Card>
                ))
              : data?.kpis.map((kpi) => (
                  <Stat
                    key={kpi.key}
                    label={kpi.label}
                    icon={KPI_ICONS[kpi.key]}
                    iconTone={KPI_TONES[kpi.key]}
                    value={
                      <p className="tabular text-[28px] font-semibold leading-none tracking-tight text-ink">
                        {formatCount(kpi.value)}
                      </p>
                    }
                    trend={
                      kpi.delta_percent !== null ? (
                        <p className="mt-2 flex items-center gap-1 text-[11.5px] text-ink-muted">
                          <ArrowUpIcon
                            className={cx(
                              "h-3 w-3",
                              kpi.delta_direction === "down" && "rotate-180",
                              kpi.key === "high_risk" ? "text-risk-high" : "text-accent-500",
                            )}
                          />
                          {kpi.delta_percent}% from last month
                        </p>
                      ) : null
                    }
                  />
                ))}
          </div>

          <p className="text-[11px] text-ink-subtle">
            Month-over-month figures are illustrative for this demonstration dataset; the counts
            themselves are live aggregates over the engine&apos;s output.
          </p>

          {/* Row 1: map + distribution */}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <Card className="overflow-hidden">
              <CardHeader
                title="Risk map — India"
                subtitle="Markers are individual works; shading shows states with flagged works."
                action={
                  <Link href="/officer/map">
                    <Button variant="secondary" size="sm">
                      Full map
                    </Button>
                  </Link>
                }
              />
              <div className="bg-sunken/40 p-4">
                {mapWorks.state.kind === "ready" ? (
                  <IndiaMap
                    works={mapWorks.state.data}
                    highlightStates={stateTints}
                    className="mx-auto max-w-[420px]"
                    markerScale={0.85}
                  />
                ) : (
                  <Skeleton className="mx-auto h-[320px] w-full max-w-[420px]" />
                )}
              </div>
              <div className="border-t border-line px-5 py-3">
                <MapLegend />
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Risk distribution"
                subtitle="Every work in the register, by band."
              />
              <div className="p-5">
                {data ? (
                  <DonutChart
                    buckets={data.risk_distribution}
                    total={data.total_works}
                    totalLabel="Total Works"
                  />
                ) : (
                  <Skeleton className="h-44 w-full" />
                )}
              </div>
            </Card>
          </div>

          {/* Row 2: categories + states */}
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Top risk categories"
                subtitle="Works at medium risk or above, by category."
              />
              <div className="p-5">
                {data ? <BarList buckets={data.top_categories} /> : <Skeleton className="h-40 w-full" />}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="States with most flagged works"
                subtitle="High and critical bands only."
              />
              <div className="p-5">
                {data ? (
                  <BarList
                    buckets={data.state_rollup}
                    emptyMessage="No state currently holds a high or critical work."
                  />
                ) : (
                  <Skeleton className="h-40 w-full" />
                )}
              </div>
            </Card>
          </div>

          {/* Row 3: the queue */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Highest-risk works"
              subtitle="Ordered by the engine's score. Open one to see the evidence behind it."
              action={
                <Link href="/officer/works">
                  <Button variant="secondary" size="sm">
                    View all
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              }
            />

            {data ? (
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line bg-sunken text-[11px] uppercase tracking-wide text-ink-muted">
                      <th scope="col" className="px-4 py-2.5 font-medium">Work ID</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Title</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">District</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Category</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Sanctioned</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Risk</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Key flag</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                      <th scope="col" className="px-4 py-2.5 font-medium"><span className="sr-only">Action</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.high_risk_works.map((work) => (
                      <tr
                        key={work.work_id}
                        className="border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-sunken/60"
                      >
                        <td className="tabular whitespace-nowrap px-4 py-3 font-mono text-[12px] text-ink-muted">
                          {work.work_id}
                        </td>
                        <td className="max-w-[16rem] px-4 py-3">
                          <span className="block truncate text-[12.5px] font-medium text-ink">
                            {work.title}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-ink-muted">
                          {work.district}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-ink-muted">
                          {work.category_label}
                        </td>
                        <td className="tabular whitespace-nowrap px-4 py-3 text-right text-[12.5px] text-ink">
                          {work.sanctioned.formatted}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <RiskPill score={work.risk_score} level={work.risk_level} size="sm" />
                        </td>
                        <td className="max-w-[12rem] px-4 py-3">
                          <span className="block truncate text-[12px] text-ink-muted">
                            {work.key_flags[0] ?? "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge tone={REVIEW_STATUS_CLASSES[work.review_status]}>
                            {work.review_status_label}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <Link href={`/officer/works/${work.work_id}`}>
                            <Button variant="secondary" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2 p-5">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-8 w-full" />
                ))}
              </div>
            )}
          </Card>

          {data ? <Disclaimer text={data.disclaimer} /> : null}
        </div>
      )}
    </OfficerShell>
  );
}
