"use client";

/**
 * "Report an issue" form.
 *
 * Deliberately calm. A citizen reporting what they saw is not making an
 * accusation, and the copy here should not push them into making one: the
 * issue types describe observations, and the confirmation says where the
 * report goes rather than promising an outcome.
 */

import { useState } from "react";

import { CameraIcon, CheckIcon, MegaphoneIcon } from "@/components/icons";
import { Button, Card, CardHeader, cx } from "@/components/ui";
import { ISSUE_TYPE_LABELS } from "@/lib/format";
import { ApiError, submitReport } from "@/services/api";
import type { CitizenReport, IssueType } from "@/types/portal";

const ISSUE_ORDER: IssueType[] = [
  "work_not_started",
  "work_stalled",
  "incomplete_work",
  "quality_concern",
  "not_as_described",
  "other",
];

const MIN_DESCRIPTION = 10;

export function ReportForm({
  workId,
  onSubmitted,
}: {
  workId: string;
  onSubmitted?: (report: CitizenReport) => void;
}) {
  const [issueType, setIssueType] = useState<IssueType>("work_stalled");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<CitizenReport | null>(null);

  const tooShort = description.trim().length < MIN_DESCRIPTION;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (tooShort) {
      setError(`Please describe what you saw in at least ${MIN_DESCRIPTION} characters.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const report = await submitReport(workId, {
        issue_type: issueType,
        description: description.trim(),
        reporter_area: area.trim() || undefined,
        has_photo: hasPhoto,
      });
      setSubmitted(report);
      setDescription("");
      setArea("");
      setHasPhoto(false);
      onSubmitted?.(report);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "The report could not be submitted. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-accent-100 bg-accent-50/50">
        <div className="p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 text-white">
            <CheckIcon className="h-5 w-5" />
          </span>
          <h3 className="mt-3 text-[15px] font-semibold text-ink">Report received</h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
            Your report has been attached to work{" "}
            <span className="font-medium text-ink">{workId}</span> with reference{" "}
            <span className="tabular font-mono text-ink">{submitted.report_id}</span>. It will be
            reviewed by the concerned authorities alongside the official record.
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-subtle">
            Submitting a report does not change the work&apos;s risk score. It is shown to the
            reviewing officer as an independent observation.
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => setSubmitted(null)}>
            Submit another report
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <MegaphoneIcon className="h-4 w-4 text-brand-700" />
            Report an issue
          </span>
        }
        subtitle="Tell the authorities what you see at this site."
      />

      <form onSubmit={submit} className="space-y-4 p-5">
        <div>
          <label htmlFor="report-work" className="mb-1 block text-[12px] font-medium text-ink">
            Work ID
          </label>
          <input
            id="report-work"
            value={workId}
            readOnly
            className="tabular w-full rounded-[var(--radius-field)] border border-line bg-sunken px-3 py-2 font-mono text-[12.5px] text-ink-muted"
          />
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[12px] font-medium text-ink">What did you observe?</legend>
          <div className="space-y-1.5">
            {ISSUE_ORDER.map((type) => (
              <label
                key={type}
                className={cx(
                  "flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-field)] border px-3 py-2 transition-colors duration-150",
                  issueType === type
                    ? "border-brand-400 bg-brand-50"
                    : "border-line hover:bg-sunken",
                )}
              >
                <input
                  type="radio"
                  name="issue-type"
                  value={type}
                  checked={issueType === type}
                  onChange={() => setIssueType(type)}
                  className="mt-0.5 h-3.5 w-3.5 accent-[color:var(--color-brand-700)]"
                />
                <span className="text-[12.5px] leading-snug text-ink">
                  {ISSUE_TYPE_LABELS[type]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="report-description" className="mb-1 block text-[12px] font-medium text-ink">
            Description
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Describe what you saw at the site, and when you saw it."
            aria-describedby="report-description-hint"
            className="w-full resize-y rounded-[var(--radius-field)] border border-line bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <p id="report-description-hint" className="mt-1 text-[11px] text-ink-subtle">
            Please describe only what you observed. Avoid naming individuals.
          </p>
        </div>

        <div>
          <label htmlFor="report-area" className="mb-1 block text-[12px] font-medium text-ink">
            Your area <span className="font-normal text-ink-subtle">(optional)</span>
          </label>
          <input
            id="report-area"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            placeholder="e.g. Resident, ward 3"
            className="w-full rounded-[var(--radius-field)] border border-line bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <label
          className={cx(
            "flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-field)] border border-dashed px-3 py-2.5 transition-colors duration-150",
            hasPhoto ? "border-brand-400 bg-brand-50" : "border-line-strong hover:bg-sunken",
          )}
        >
          <input
            type="checkbox"
            checked={hasPhoto}
            onChange={(event) => setHasPhoto(event.target.checked)}
            className="h-3.5 w-3.5 accent-[color:var(--color-brand-700)]"
          />
          <CameraIcon className="h-4 w-4 text-ink-subtle" />
          <span className="text-[12.5px] text-ink">
            I have a photograph of the site
            <span className="block text-[11px] text-ink-subtle">
              Upload is not enabled in this prototype; the officer will request it.
            </span>
          </span>
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-[var(--radius-field)] border border-risk-critical-line bg-risk-critical-bg px-3 py-2 text-[12px] text-risk-critical"
          >
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Submitting…" : "Submit Report"}
        </Button>

        <p className="text-[11px] leading-relaxed text-ink-subtle">
          Your report will be reviewed by the concerned authorities. It is recorded as an
          observation for human review and does not by itself change any assessment of this work.
        </p>
      </form>
    </Card>
  );
}
