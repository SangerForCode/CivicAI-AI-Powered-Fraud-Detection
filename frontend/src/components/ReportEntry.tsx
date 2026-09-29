/**
 * One citizen report, rendered the same way wherever it appears.
 *
 * The wording is deliberately flat. A report is an observation somebody made
 * and nobody has checked yet, so it is quoted rather than asserted, and its
 * status says what the office has done with it — never what turned out to be
 * true. The quote mark and the neutral status chip do the work that a red
 * "flagged" treatment would otherwise do far too loudly.
 */

import Link from "next/link";

import { CameraIcon } from "@/components/icons";
import { Badge, Button, cx } from "@/components/ui";
import { reportStatusLabel, reportStatusTone } from "@/lib/format";
import type { CitizenReport } from "@/types/portal";

export function ReportEntry({
  report,
  href,
  showProject = true,
  className,
}: {
  report: CitizenReport;
  /** Where "View Evidence" goes. Omitted where the reader is already there. */
  href?: string;
  showProject?: boolean;
  className?: string;
}) {
  return (
    <article className={cx("relative", className)}>
      <div className="flex items-center gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-brand-700">
          Citizen Report
        </span>
        <span className="tabular font-mono text-[11.5px] text-ink-subtle">{report.report_id}</span>
        <Badge tone={reportStatusTone(report.status)} className="ml-auto">
          {reportStatusLabel(report.status)}
        </Badge>
      </div>

      <blockquote className="mt-2.5 border-l-2 border-line-strong pl-3 text-[12.5px] leading-relaxed text-ink">
        {report.description}
      </blockquote>

      <dl className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-[11.5px]">
        {showProject ? (
          <div className="flex items-baseline gap-1.5">
            <dt className="text-ink-subtle">Project</dt>
            <dd className="tabular font-mono font-medium text-ink">{report.work_id}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline gap-1.5">
          <dt className="text-ink-subtle">Reported issue</dt>
          <dd className="font-medium text-ink">{report.issue_label}</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-ink-subtle">Submitted</dt>
          <dd className="font-medium text-ink">{report.submitted_on_formatted}</dd>
        </div>
        {report.reporter_area ? (
          <div className="flex items-baseline gap-1.5">
            <dt className="text-ink-subtle">Area</dt>
            <dd className="font-medium text-ink">{report.reporter_area}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {report.has_photo ? (
          <Badge>
            <CameraIcon className="h-3 w-3" />
            Photograph offered
          </Badge>
        ) : null}
        {href ? (
          <Link href={href} className="ml-auto">
            <Button variant="secondary" size="sm">
              View Evidence
            </Button>
          </Link>
        ) : null}
      </div>
    </article>
  );
}
