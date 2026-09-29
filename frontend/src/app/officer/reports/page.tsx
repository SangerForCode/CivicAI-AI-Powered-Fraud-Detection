"use client";

/**
 * Inbox of citizen observations, newest first.
 *
 * Presented as a running log rather than a queue of accusations: each entry is
 * dated on a rail so the reader sees when things came in, and the wording
 * stays at "reported" and "pending" throughout.
 */

import { OfficerShell } from "@/components/OfficerShell";
import { ReportEntry } from "@/components/ReportEntry";
import { MegaphoneIcon } from "@/components/icons";
import { EmptyState, ErrorState } from "@/components/states";
import { Card, CardHeader, Skeleton } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { fetchRecentReports } from "@/services/api";

export default function OfficerReportsPage() {
  const reports = useAsync(() => fetchRecentReports(30), []);
  const items = reports.state.kind === "ready" ? reports.state.data : [];

  return (
    <OfficerShell
      title="Citizen Reports"
      subtitle="Observations submitted from the public portal, newest first."
    >
      {reports.state.kind === "loading" ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index} className="p-5">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="mt-3 h-2.5 w-full" />
              <Skeleton className="mt-2 h-2.5 w-2/3" />
            </Card>
          ))}
        </div>
      ) : reports.state.kind === "error" ? (
        <ErrorState error={reports.state.error} onRetry={reports.reload} />
      ) : reports.state.data.length === 0 ? (
        <EmptyState
          title="No reports yet"
          message="When a citizen submits an observation from the public portal it will appear here."
          icon={<MegaphoneIcon className="h-5 w-5" />}
        />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader
            title={`${items.length} reports received`}
            subtitle="Unverified observations awaiting review. They do not affect any risk score."
          />
          <ol className="px-5 py-2">
            {items.map((report, index) => (
              <li key={report.report_id} className="relative flex gap-4 py-4">
                {/* Timeline rail. The connector stops at the last entry so the
                    list does not imply there is more below it. */}
                <span className="relative flex w-3 shrink-0 justify-center" aria-hidden="true">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand-400 bg-surface" />
                  {index < items.length - 1 ? (
                    <span className="absolute top-5 bottom-[-1rem] w-px bg-line" />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <ReportEntry report={report} href={`/officer/works/${report.work_id}`} />
                </div>
              </li>
            ))}
          </ol>
          <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-ink-subtle">
            Reports are what somebody says they saw. Nothing here has been verified, and none of it
            has changed a risk score. Verification is a human step.
          </p>
        </Card>
      )}
    </OfficerShell>
  );
}
