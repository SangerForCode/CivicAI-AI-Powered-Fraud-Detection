"use client";

/** Inbox of citizen observations, newest first. */

import Link from "next/link";

import { OfficerShell } from "@/components/OfficerShell";
import { CameraIcon, MegaphoneIcon } from "@/components/icons";
import { EmptyState, ErrorState } from "@/components/states";
import { Badge, Button, Card, CardHeader, Skeleton } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { fetchRecentReports } from "@/services/api";

export default function OfficerReportsPage() {
  const reports = useAsync(() => fetchRecentReports(30), []);

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
            title={`${reports.state.data.length} reports`}
            subtitle="Unverified observations. They do not affect any risk score."
          />
          <ul className="divide-y divide-line">
            {reports.state.data.map((report) => (
              <li key={report.report_id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular font-mono text-[11.5px] text-ink-subtle">
                    {report.report_id}
                  </span>
                  <Badge tone="border-brand-100 bg-brand-50 text-brand-700">
                    {report.issue_label}
                  </Badge>
                  {report.has_photo ? (
                    <Badge>
                      <CameraIcon className="h-3 w-3" />
                      Photo offered
                    </Badge>
                  ) : null}
                  <Badge
                    tone={
                      report.status === "acknowledged"
                        ? "border-risk-low-line bg-risk-low-bg text-risk-low"
                        : undefined
                    }
                  >
                    {report.status === "acknowledged" ? "Acknowledged" : "Received"}
                  </Badge>
                  <span className="ml-auto text-[11.5px] text-ink-subtle">
                    {report.submitted_on_formatted}
                  </span>
                </div>

                <p className="mt-2 text-[12.5px] leading-relaxed text-ink">{report.description}</p>

                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  {report.reporter_area ? (
                    <span className="text-[11px] text-ink-subtle">
                      Reported by: {report.reporter_area}
                    </span>
                  ) : null}
                  <Link href={`/officer/works/${report.work_id}`} className="ml-auto">
                    <Button variant="secondary" size="sm">
                      Open {report.work_id}
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </OfficerShell>
  );
}
