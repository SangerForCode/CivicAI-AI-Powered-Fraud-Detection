"use client";

/** Citizen works explorer: filter the register and open any work. */

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EMPTY_FILTERS, FilterBar, type FilterValues } from "@/components/Filters";
import { MegaphoneIcon } from "@/components/icons";
import { ToolbarSearch } from "@/components/OfficerShell";
import { WorkCard } from "@/components/WorkCard";
import { WorkPreviewOnHover } from "@/components/WorkPreview";
import { EmptyState, ErrorState } from "@/components/states";
import { Button, Card, SectionTitle, Skeleton } from "@/components/ui";
import { formatCount } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { fetchFilterOptions, fetchWorks } from "@/services/api";
import type { Category, ProjectStage, RiskLevel } from "@/types/assessment";

const PAGE_SIZE = 12;

function ExploreInner() {
  const params = useSearchParams();
  const initialSearch = params.get("search") ?? "";
  // Arriving from "Report an Issue" in the nav: a report is always about a
  // specific work, so the honest answer is "find the work first".
  const reporting = params.get("report") === "1";

  const [filters, setFilters] = useState<FilterValues>({
    ...EMPTY_FILTERS,
    search: initialSearch,
  });
  const [page, setPage] = useState(0);

  const options = useAsync(() => fetchFilterOptions(), []);
  const optionData = options.state.kind === "ready" ? options.state.data : null;

  // Refetch whenever a filter or the page changes.
  const key = useMemo(() => JSON.stringify({ filters, page }), [filters, page]);
  const works = useAsync(
    () =>
      fetchWorks({
        search: filters.search || undefined,
        state: filters.state || undefined,
        district: filters.district || undefined,
        category: (filters.category || undefined) as Category | undefined,
        stage: (filters.stage || undefined) as ProjectStage | undefined,
        risk_level: (filters.risk_level || undefined) as RiskLevel | undefined,
        sort: "id",
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    [key],
  );

  const applyFilters = (next: FilterValues) => {
    setFilters(next);
    setPage(0);
  };

  const total = works.state.kind === "ready" ? works.state.data.total : null;
  const pageCount = total === null ? 0 : Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      {reporting ? (
        <div className="animate-fade mb-5 flex gap-3 rounded-[var(--radius-card)] border border-brand-100 bg-brand-50 px-4 py-3.5">
          <MegaphoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
          <div>
            <p className="text-[13px] font-semibold text-ink">Find the work you want to report</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">
              Reports are attached to a specific work, so search for it below — by work ID, village
              or district — and use the report form on its page.
            </p>
          </div>
        </div>
      ) : null}

      <SectionTitle
        title="Explore works"
        subtitle={
          total === null
            ? "Search and filter the works register."
            : `${formatCount(total)} work${total === 1 ? "" : "s"} match your filters.`
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ToolbarSearch
          value={filters.search}
          onChange={(search) => applyFilters({ ...filters, search })}
          placeholder="Search by work ID, title, village or district…"
        />
      </div>

      <FilterBar
        values={filters}
        onChange={applyFilters}
        options={optionData}
        showRisk={false}
        className="mb-5"
      />

      {works.state.kind === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index} className="p-4">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-2.5 w-2/3" />
              <Skeleton className="mt-5 h-1.5 w-full" />
            </Card>
          ))}
        </div>
      ) : works.state.kind === "error" ? (
        <ErrorState error={works.state.error} onRetry={works.reload} />
      ) : works.state.data.works.length === 0 ? (
        <EmptyState
          title="No works match these filters"
          message="Try widening the search, or clear the filters to see the whole register."
          action={
            <Button variant="secondary" onClick={() => applyFilters(EMPTY_FILTERS)}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="animate-rise grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.state.data.works.map((work) => (
              <WorkPreviewOnHover
                key={work.work_id}
                work={work}
                href={`/works/${work.work_id}`}
                className="h-full"
              >
                <WorkCard work={work} showRisk={false} />
              </WorkPreviewOnHover>
            ))}
          </div>

          {pageCount > 1 ? (
            <nav
              className="mt-6 flex items-center justify-between gap-3"
              aria-label="Pagination"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
              >
                Previous
              </Button>
              <span className="tabular text-[12.5px] text-ink-muted">
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
  );
}

export default function ExplorePage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
          <Skeleton className="h-6 w-40" />
        </div>
      }
    >
      <ExploreInner />
    </Suspense>
  );
}
