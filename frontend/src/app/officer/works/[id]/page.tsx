"use client";

/**
 * Project investigation workspace.
 *
 * Reading order is deliberate: score, then why, then the evidence, then what
 * to check. The assisted summary sits below the breakdown it summarises.
 */

import Link from "next/link";
import { use } from "react";

import { AnalysisPanel } from "@/components/AnalysisPanel";
import { DataQuality } from "@/components/DataQuality";
import { IndiaMap } from "@/components/IndiaMap";
import { OfficerShell } from "@/components/OfficerShell";
import { RiskBar, RiskPill } from "@/components/RiskPill";
import { RiskSignals } from "@/components/RiskSignals";
import { Timeline } from "@/components/Timeline";
import { CameraIcon, MapPinIcon, MegaphoneIcon } from "@/components/icons";
import { ErrorState, LoadingState } from "@/components/states";
import { Badge, Button, Card, CardHeader, DetailRow, Disclaimer } from "@/components/ui";
import { DIMENSION_DESCRIPTIONS, REVIEW_STATUS_CLASSES, formatWeight } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { fetchAnalysis, fetchWork } from "@/services/api";
import type { RiskLevel } from "@/types/assessment";

/** A dimension score sits in its own band, not the headline's. */
function bandFor(score: number | null): RiskLevel | null {
  if (score === null) return null;
  if (score < 25) return "low";
  if (score < 50) return "medium";
  if (score < 75) return "high";
  return "critical";
}

export default function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const work = useAsync(() => fetchWork(id), [id]);
  const analysis = useAsync(() => fetchAnalysis(id), [id]);

  if (work.state.kind === "loading") {
    return (
      <OfficerShell title="Loading work" subtitle={id}>
        <LoadingState />
      </OfficerShell>
    );
  }

  if (work.state.kind === "error") {
    return (
      <OfficerShell title="Work not available" subtitle={id}>
        <ErrorState error={work.state.error} onRetry={work.reload} />
      </OfficerShell>
    );
  }

  const detail = work.state.data;
  const { summary, assessment } = detail;

  return (
    <OfficerShell
      title={summary.work_id}
      subtitle={`${summary.title} · ${summary.district}, ${summary.state}`}
      actions={
        <Link href={`/works/${summary.work_id}`} className="hidden sm:block">
          <Button variant="secondary" size="sm">Public view</Button>
        </Link>
      }
    >
      <div className="space-y-5">
        {/* Header: score and standing */}
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={REVIEW_STATUS_CLASSES[summary.review_status]}>
                  {summary.review_status_label}
                </Badge>
                <Badge>{summary.category_label}</Badge>
                <Badge>{summary.stage_label}</Badge>
                {summary.citizen_report_count > 0 ? (
                  <Badge tone="border-brand-100 bg-brand-50 text-brand-700">
                    <MegaphoneIcon className="h-3 w-3" />
                    {summary.citizen_report_count} citizen report
                    {summary.citizen_report_count === 1 ? "" : "s"}
                  </Badge>
                ) : null}
              </div>
              <h2 className="mt-2 text-[18px] font-semibold leading-tight text-ink">
                {summary.title}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                <MapPinIcon className="h-3.5 w-3.5 text-ink-subtle" />
                {summary.block}, {summary.district} · {summary.state}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                Risk score
              </p>
              <p className="tabular mt-1 text-[38px] font-semibold leading-none tracking-tight text-ink">
                {assessment.risk_score === null ? "—" : Math.round(assessment.risk_score)}
                {assessment.risk_score !== null ? (
                  <span className="ml-1 text-[14px] font-normal text-ink-subtle">/ 100</span>
                ) : null}
              </p>
              <div className="mt-2 flex justify-end">
                <RiskPill score={assessment.risk_score} level={assessment.risk_level} size="lg" showLabel />
              </div>
            </div>
          </div>

          {assessment.assessment_status === "incomplete" ? (
            <p className="mt-4 rounded-[var(--radius-field)] border border-risk-medium-line bg-risk-medium-bg px-3.5 py-2.5 text-[12px] leading-relaxed text-risk-medium">
              <span className="font-semibold">Incomplete assessment.</span>{" "}
              {Math.round(assessment.assessment_completeness * 100)}% of the scoring weight could be
              evaluated from this record. The unassessed dimensions are unknown, not clear.
            </p>
          ) : null}
        </Card>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Left column — the case */}
          <div className="space-y-5">
            <Card>
              <CardHeader
                title="Risk breakdown"
                subtitle="Each dimension scored in its own right, then weighted into the headline."
              />
              <div className="space-y-4 p-5">
                {assessment.dimensions.map((dimension) => (
                  <RiskBar
                    key={dimension.key}
                    score={dimension.score}
                    level={bandFor(dimension.score)}
                    label={`${dimension.label} · ${formatWeight(dimension.weight)} weight`}
                    caption={
                      dimension.available
                        ? dimension.triggered_rules.length > 0
                          ? `${dimension.triggered_rules.join(", ")} — ${DIMENSION_DESCRIPTIONS[dimension.key]}`
                          : `No rule triggered. ${DIMENSION_DESCRIPTIONS[dimension.key]}`
                        : `Not assessable — missing ${dimension.missing_fields.join(", ")}`
                    }
                  />
                ))}
              </div>
            </Card>

            <RiskSignals signals={assessment.signals} />

            <AnalysisPanel
              analysis={analysis.state.kind === "ready" ? analysis.state.data : null}
              loading={analysis.state.kind === "loading"}
            />

            {detail.reports.length > 0 ? (
              <Card>
                <CardHeader
                  title="Citizen reports"
                  subtitle="Independent observations submitted from the public portal."
                />
                <ul className="divide-y divide-line">
                  {detail.reports.map((report) => (
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
                        <span className="ml-auto text-[11.5px] text-ink-subtle">
                          {report.submitted_on_formatted}
                        </span>
                      </div>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-ink">
                        {report.description}
                      </p>
                      {report.reporter_area ? (
                        <p className="mt-1.5 text-[11px] text-ink-subtle">
                          Reported by: {report.reporter_area}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-ink-subtle">
                  Citizen reports are unverified observations. They do not contribute to the risk
                  score and are shown here for the reviewer&apos;s judgement.
                </p>
              </Card>
            ) : null}

            <DataQuality assessment={assessment} />
          </div>

          {/* Right column — the record */}
          <div className="space-y-5">
            <Card>
              <CardHeader title="Project information" />
              <div className="px-5 py-2">
                <dl>
                  <DetailRow label="Work ID">
                    <span className="tabular font-mono">{summary.work_id}</span>
                  </DetailRow>
                  <DetailRow label="Sanctioned">
                    <span className="tabular">{summary.sanctioned.formatted}</span>
                  </DetailRow>
                  <DetailRow label="Spent">
                    <span className="tabular">{summary.spent?.formatted ?? "Not reported"}</span>
                  </DetailRow>
                  <DetailRow label="Completion">
                    <span className="tabular">
                      {summary.completion_percentage === null
                        ? "Not reported"
                        : `${Math.round(summary.completion_percentage)}%`}
                    </span>
                  </DetailRow>
                  <DetailRow label="Sanction date">{detail.sanction_date_formatted}</DetailRow>
                  <DetailRow label="Work started">
                    {detail.work_start_date_formatted ?? "Not recorded"}
                  </DetailRow>
                  <DetailRow label="Planned duration">
                    {detail.planned_duration
                      ? `${detail.planned_duration.days} days ≈ ${detail.planned_duration.human}`
                      : "Not recorded"}
                  </DetailRow>
                  <DetailRow label="Elapsed">
                    {detail.elapsed
                      ? `${detail.elapsed.days} days ≈ ${detail.elapsed.human}`
                      : "Not recorded"}
                  </DetailRow>
                  <DetailRow label="Schedule">{detail.schedule_note ?? "Not recorded"}</DetailRow>
                  <DetailRow label="Last update">
                    {detail.last_progress_update_formatted ?? "Never"}
                    {detail.since_last_update
                      ? ` · ${detail.since_last_update.human} ago`
                      : ""}
                  </DetailRow>
                  <DetailRow label="Agency">{detail.agency}</DetailRow>
                  <DetailRow label="Recommended by">{detail.mp_name}</DetailRow>
                </dl>
              </div>
            </Card>

            <Card>
              <CardHeader title="Timeline" />
              <div className="p-5">
                <Timeline milestones={detail.milestones} />
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Evidence / documents"
                subtitle="A gap here is a data-quality signal, not a finding."
              />
              {detail.documents.length === 0 ? (
                <p className="px-5 py-4 text-[12.5px] text-ink-muted">
                  The document set for this work is unknown — no register was supplied, which is
                  itself worth chasing.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {detail.documents.map((document) => (
                    <li
                      key={document.name}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-ink">{document.name}</p>
                        <p className="text-[11px] text-ink-subtle">
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
                        {document.status === "on_record" ? "On record" : "Missing"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Map location" subtitle={`${summary.district}, ${summary.state}`} />
              <div className="bg-sunken/40 p-4">
                <IndiaMap works={[summary]} selectedId={summary.work_id} className="mx-auto max-w-[260px]" markerScale={1.6} />
              </div>
              <p className="border-t border-line px-5 py-2.5 text-[11px] text-ink-subtle">
                Approximate location within the district. Not the surveyed work site.
              </p>
            </Card>

            <Disclaimer text={assessment.disclaimer} />
          </div>
        </div>
      </div>
    </OfficerShell>
  );
}
