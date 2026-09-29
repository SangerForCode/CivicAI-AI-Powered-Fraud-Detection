"use client";

/** Citizen view of one work: the record, its timeline, and the report form. */

import Link from "next/link";
import { use, useState } from "react";

import { HeroArt } from "@/components/HeroArt";
import { ReportEntry } from "@/components/ReportEntry";
import { ReportForm } from "@/components/ReportForm";
import { Timeline } from "@/components/Timeline";
import { ArrowRightIcon, MapPinIcon } from "@/components/icons";
import { ErrorState, LoadingState } from "@/components/states";
import { Badge, Card, CardHeader, DetailRow, Disclaimer, SectionTitle } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { fetchWork } from "@/services/api";

export default function CitizenWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reportCount, setReportCount] = useState<number | null>(null);
  const work = useAsync(() => fetchWork(id), [id]);

  if (work.state.kind === "loading") {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
        <LoadingState />
      </div>
    );
  }

  if (work.state.kind === "error") {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
        <ErrorState error={work.state.error} onRetry={work.reload} />
      </div>
    );
  }

  const detail = work.state.data;
  const { summary } = detail;
  const reports = reportCount ?? detail.reports.length;
  const completion = summary.completion_percentage;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-[12px] text-ink-muted" aria-label="Breadcrumb">
        <Link href="/explore" className="transition-colors duration-150 hover:text-brand-700">
          Explore Works
        </Link>
        <span aria-hidden="true">/</span>
        <span className="tabular font-mono text-ink">{summary.work_id}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left — the record */}
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="relative h-36 sm:h-44">
              <HeroArt className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 to-brand-900/20" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className="border-white/25 bg-white/15 text-white">
                    {summary.category_label}
                  </Badge>
                  <Badge className="border-white/25 bg-white/15 text-white">
                    {summary.stage_label}
                  </Badge>
                </div>
                <h1 className="mt-2 text-[20px] font-semibold leading-tight text-white sm:text-[24px]">
                  {summary.title}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-white/80">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {summary.block}, {summary.district} · {summary.state}
                </p>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="text-ink-muted">Reported progress</span>
                  <span className="tabular font-semibold text-ink">
                    {completion === null ? "Not reported" : `${Math.round(completion)}%`}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sunken">
                  {completion === null ? (
                    <div
                      className="h-full w-full opacity-60"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(135deg, var(--color-line-strong) 0 4px, transparent 4px 8px)",
                      }}
                    />
                  ) : (
                    <div
                      className="h-full rounded-full bg-accent-500 transition-[width] duration-500"
                      style={{ width: `${Math.max(completion, 1.5)}%` }}
                    />
                  )}
                </div>
                {detail.schedule_note ? (
                  <p className="mt-1.5 text-[11.5px] text-ink-muted">{detail.schedule_note}</p>
                ) : null}
              </div>

              <dl>
                <DetailRow label="Work ID">
                  <span className="tabular font-mono">{summary.work_id}</span>
                </DetailRow>
                <DetailRow label="Category">{summary.category_label}</DetailRow>
                <DetailRow label="Location">
                  {summary.block}, {summary.district}, {summary.state}
                </DetailRow>
                <DetailRow label="Sanctioned amount">
                  <span className="tabular">{summary.sanctioned.formatted}</span>
                </DetailRow>
                <DetailRow label="Expenditure reported">
                  <span className="tabular">{summary.spent?.formatted ?? "Not reported"}</span>
                </DetailRow>
                <DetailRow label="Sanction date">{detail.sanction_date_formatted}</DetailRow>
                <DetailRow label="Expected completion">
                  {detail.expected_completion_formatted ?? "Not recorded"}
                </DetailRow>
                <DetailRow label="Planned duration">
                  {detail.planned_duration
                    ? `${detail.planned_duration.days} days ≈ ${detail.planned_duration.human}`
                    : "Not recorded"}
                </DetailRow>
                <DetailRow label="Current status">{summary.stage_label}</DetailRow>
                <DetailRow label="Implementing agency">{detail.agency}</DetailRow>
                <DetailRow label="Recommended by">{detail.mp_name}</DetailRow>
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Progress timeline"
              subtitle={
                detail.since_last_update
                  ? `Last progress update ${detail.since_last_update.human} ago.`
                  : "No progress update recorded."
              }
            />
            <div className="p-5">
              <Timeline milestones={detail.milestones} />
            </div>
          </Card>

          {detail.documents.length > 0 ? (
            <Card>
              <CardHeader
                title="Documents on record"
                subtitle="A missing document is a gap in the record, not a finding against the work."
              />
              <ul className="divide-y divide-line">
                {detail.documents.map((document) => (
                  <li key={document.name} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{document.name}</p>
                      <p className="text-[11.5px] text-ink-subtle">
                        {document.source}
                        {document.date_formatted ? ` · ${document.date_formatted}` : ""}
                      </p>
                    </div>
                    <Badge
                      tone={
                        document.status === "on_record"
                          ? "border-risk-low-line bg-risk-low-bg text-risk-low"
                          : "border-risk-medium-line bg-risk-medium-bg text-risk-medium"
                      }
                    >
                      {document.status === "on_record" ? "On record" : "Not on record"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {detail.reports.length > 0 ? (
            <Card>
              <CardHeader
                title="Reports from the public"
                subtitle={`${reports} observation${reports === 1 ? "" : "s"} submitted about this work.`}
              />
              <ul className="divide-y divide-line">
                {detail.reports.slice(0, 4).map((report) => (
                  <li key={report.report_id} className="px-5 py-4">
                    <ReportEntry report={report} showProject={false} />
                  </li>
                ))}
              </ul>
              <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-ink-subtle">
                These are observations members of the public have submitted. They have not been
                verified, and they do not change this work&apos;s risk score.
              </p>
            </Card>
          ) : null}
        </div>

        {/* Right — action */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <ReportForm
            workId={summary.work_id}
            onSubmitted={() => setReportCount(reports + 1)}
          />

          <Card className="p-4">
            <p className="text-[12.5px] font-medium text-ink">Looking at a different work?</p>
            <Link
              href="/explore"
              className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-700 transition-colors duration-150 hover:text-brand-500"
            >
              Browse all works
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Disclaimer text={detail.assessment.disclaimer} />
        </div>
      </div>

      <SectionTitle className="sr-only" title="End of work record" />
    </div>
  );
}
