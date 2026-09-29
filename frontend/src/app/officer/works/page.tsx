"use client";

/** The operational works queue: filter, sort, and open an investigation. */

import Link from "next/link";
import { useMemo, useState } from "react";

import { EMPTY_FILTERS, FilterBar, type FilterValues } from "@/components/Filters";
import { OfficerShell, ToolbarSearch } from "@/components/OfficerShell";
import { RiskPill } from "@/components/RiskPill";
import { WorkPreviewOnHover } from "@/components/WorkPreview";
import { MegaphoneIcon } from "@/components/icons";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { Badge, Button, Card, cx } from "@/components/ui";
import { REVIEW_STATUS_CLASSES, formatCount } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { fetchFilterOptions, fetchWorks } from "@/services/api";
import type { Category, ProjectStage, RiskLevel } from "@/types/assessment";
import type { ReviewStatus } from "@/types/portal";

const PAGE_SIZE = 25;

type SortKey = "risk" | "amount" | "completion" | "id";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "risk", label: "Risk score" },
  { key: "amount", label: "Sanctioned amount" },
  { key: "completion", label: "Completion" },
  { key: "id", label: "Work ID" },
];

export default function OfficerWorksPage() {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("risk");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const options = useAsync(() => fetchFilterOptions(), []);
  const key = useMemo(() => JSON.stringify({ filters, sort, page }), [filters, sort, page]);
  const works = useAsync(
    () =>
      fetchWorks({
        search: filters.search || undefined,
        state: filters.state || undefined,
        district: filters.district || undefined,
        category: (filters.category || undefined) as Category | undefined,
        stage: (filters.stage || undefined) as ProjectStage | undefined,
        risk_level: (filters.risk_level || undefined) as RiskLevel | undefined,
        review_status: (filters.review_status || undefined) as ReviewStatus | undefined,
        sort,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    [key],
  );

  const apply = (next: FilterValues) => {
    setFilters(next);
    setPage(0);
  };

  const total = works.state.kind === "ready" ? works.state.data.total : null;
  const pageCount = total === null ? 0 : Math.ceil(total / PAGE_SIZE);

  return (
    <OfficerShell
      title="Works"
      subtitle={
        total === null
          ? "The full works register."
          : `${formatCount(total)} work${total === 1 ? "" : "s"} in the current view.`
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarSearch
            value={filters.search}
            onChange={(search) => apply({ ...filters, search })}
            placeholder="Search by work ID, title, district…"
          />

          <label className="flex items-center gap-2 text-[12.5px] text-ink-muted">
            Sort by
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortKey);
                setPage(0);
              }}
              className="rounded-[var(--radius-field)] border border-line bg-surface px-2.5 py-2 text-[12.5px] text-ink focus:border-brand-400 focus:outline-none"
            >
              {SORTS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
          >
            {showFilters ? "Hide filters" : "Filters"}
          </Button>
        </div>

        {showFilters ? (
          <FilterBar
            values={filters}
            onChange={apply}
            options={options.state.kind === "ready" ? options.state.data : null}
            showReviewStatus
            className="animate-fade"
          />
        ) : null}

        {works.state.kind === "loading" ? (
          <TableSkeleton />
        ) : works.state.kind === "error" ? (
          <ErrorState error={works.state.error} onRetry={works.reload} />
        ) : works.state.data.works.length === 0 ? (
          <EmptyState
            title="No works match these filters"
            message="Widen the search or clear the filters to see the whole register."
            action={
              <Button variant="secondary" onClick={() => apply(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line bg-sunken text-[11px] uppercase tracking-wide text-ink-muted">
                      <th scope="col" className="px-4 py-2.5 font-medium">Work ID</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Title</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">District</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Category</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Sanctioned</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Progress</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Risk</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Key flag</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {works.state.data.works.map((work) => (
                      <tr
                        key={work.work_id}
                        className="border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-sunken/60"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="tabular font-mono text-[12px] text-ink-muted">
                            {work.work_id}
                          </span>
                          {work.citizen_report_count > 0 ? (
                            <span
                              className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-[11px] text-brand-700"
                              title={`${work.citizen_report_count} citizen report(s)`}
                            >
                              <MegaphoneIcon className="h-3 w-3" />
                              {work.citizen_report_count}
                            </span>
                          ) : null}
                        </td>
                        <td className="max-w-[18rem] px-4 py-3">
                          <WorkPreviewOnHover
                            work={work}
                            href={`/officer/works/${work.work_id}`}
                          >
                            <span className="block truncate text-[12.5px] font-medium text-ink">
                              {work.title}
                            </span>
                            <span className="block truncate text-[11px] text-ink-subtle">
                              {work.block}, {work.state}
                            </span>
                          </WorkPreviewOnHover>
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
                        <td className="tabular whitespace-nowrap px-4 py-3 text-right text-[12.5px] text-ink">
                          {work.completion_percentage === null
                            ? "—"
                            : `${Math.round(work.completion_percentage)}%`}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <RiskPill
                            score={work.risk_score}
                            level={work.risk_level}
                            size="sm"
                            showLabel={false}
                          />
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
            </Card>

            {pageCount > 1 ? (
              <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(current - 1, 0))}
                >
                  Previous
                </Button>
                <span className={cx("tabular text-[12.5px] text-ink-muted")}>
                  Page {page + 1} of {pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page + 1 >= pageCount}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </OfficerShell>
  );
}
