"use client";

/**
 * Document register across flagged works.
 *
 * Framed as compliance and data quality throughout: a missing certificate is a
 * record that has not been filed, which is a thing to chase, not a finding.
 */

import Link from "next/link";
import { useMemo, useState } from "react";

import { OfficerShell, ToolbarSearch } from "@/components/OfficerShell";
import { FileIcon } from "@/components/icons";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/states";
import { Badge, Button, Card, CardHeader, Stat, cx } from "@/components/ui";
import { formatCount } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { fetchWork, fetchWorks } from "@/services/api";
import type { WorkDocument } from "@/types/portal";

interface Row {
  workId: string;
  workTitle: string;
  district: string;
  document: WorkDocument;
}

const SAMPLE_SIZE = 24;

/** Stable empty reference, so memo dependencies do not change every render. */
const NO_ROWS: Row[] = [];

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(true);

  // Pull the top-risk works and expand their document registers. The engine has
  // no bulk document endpoint, so this is a bounded sample rather than the
  // whole register — stated in the caption so nobody reads it as exhaustive.
  const data = useAsync(async () => {
    const page = await fetchWorks({ sort: "risk", limit: SAMPLE_SIZE });
    const details = await Promise.all(page.works.map((work) => fetchWork(work.work_id)));
    const rows: Row[] = [];
    for (const detail of details) {
      for (const document of detail.documents) {
        rows.push({
          workId: detail.summary.work_id,
          workTitle: detail.summary.title,
          district: detail.summary.district,
          document,
        });
      }
    }
    return rows;
  }, []);

  const rows = data.state.kind === "ready" ? data.state.data : NO_ROWS;

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (onlyMissing && row.document.status !== "missing") return false;
      if (!needle) return true;
      return (
        row.workId.toLowerCase().includes(needle) ||
        row.workTitle.toLowerCase().includes(needle) ||
        row.document.name.toLowerCase().includes(needle) ||
        row.district.toLowerCase().includes(needle)
      );
    });
  }, [rows, search, onlyMissing]);

  const missingCount = rows.filter((row) => row.document.status === "missing").length;
  const onRecordCount = rows.length - missingCount;

  return (
    <OfficerShell
      title="Documents"
      subtitle={`Document register for the ${SAMPLE_SIZE} highest-risk works.`}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Records expected"
            icon={<FileIcon className="h-[18px] w-[18px]" />}
            value={
              <p className="tabular text-[26px] font-semibold leading-none text-ink">
                {formatCount(rows.length)}
              </p>
            }
            caption={`Across ${SAMPLE_SIZE} works`}
          />
          <Stat
            label="On record"
            icon={<FileIcon className="h-[18px] w-[18px]" />}
            iconTone="border-risk-low-line bg-risk-low-bg text-risk-low"
            value={
              <p className="tabular text-[26px] font-semibold leading-none text-ink">
                {formatCount(onRecordCount)}
              </p>
            }
          />
          <Stat
            label="Not on record"
            icon={<FileIcon className="h-[18px] w-[18px]" />}
            iconTone="border-risk-medium-line bg-risk-medium-bg text-risk-medium"
            value={
              <p className="tabular text-[26px] font-semibold leading-none text-ink">
                {formatCount(missingCount)}
              </p>
            }
            caption="A gap to chase, not a finding"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolbarSearch
            value={search}
            onChange={setSearch}
            placeholder="Search by work, document or district…"
          />
          <button
            type="button"
            onClick={() => setOnlyMissing((value) => !value)}
            aria-pressed={onlyMissing}
            className={cx(
              "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150",
              onlyMissing
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-line text-ink-muted hover:bg-sunken",
            )}
          >
            Missing only
          </button>
        </div>

        {data.state.kind === "loading" ? (
          <TableSkeleton />
        ) : data.state.kind === "error" ? (
          <ErrorState error={data.state.error} onRetry={data.reload} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nothing to show"
            message="No document rows match the current search and filter."
            icon={<FileIcon className="h-5 w-5" />}
          />
        ) : (
          <Card className="overflow-hidden">
            <CardHeader
              title={`${formatCount(filtered.length)} document rows`}
              subtitle="Certificates are only expected once a work is recorded complete."
            />
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-sunken text-[11px] uppercase tracking-wide text-ink-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium">Document</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Date</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Source</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Related work</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={`${row.workId}-${row.document.name}`}
                      className="border-b border-line transition-colors duration-150 last:border-b-0 hover:bg-sunken/60"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[12.5px] font-medium text-ink">
                        {row.document.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          tone={
                            row.document.status === "on_record"
                              ? "border-risk-low-line bg-risk-low-bg text-risk-low"
                              : "border-risk-medium-line bg-risk-medium-bg text-risk-medium"
                          }
                        >
                          {row.document.status === "on_record" ? "On record" : "Not on record"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-ink-muted">
                        {row.document.date_formatted ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-ink-muted">
                        {row.document.source}
                      </td>
                      <td className="max-w-[18rem] px-4 py-3">
                        <span className="block truncate text-[12.5px] text-ink">
                          {row.workTitle}
                        </span>
                        <span className="tabular block truncate font-mono text-[11px] text-ink-subtle">
                          {row.workId} · {row.district}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link href={`/officer/works/${row.workId}`}>
                          <Button variant="secondary" size="sm">View work</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </OfficerShell>
  );
}
