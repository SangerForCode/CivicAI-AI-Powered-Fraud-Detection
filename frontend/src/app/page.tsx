"use client";

/**
 * The risk-engine testing console.
 *
 * This page owns the interaction state and nothing else. Every number it shows
 * comes from `POST /risk/assess`; no scoring, thresholding or risk judgement
 * happens here.
 */

import { useCallback, useState } from "react";

import { ApiStatus } from "@/components/ApiStatus";
import { DataQuality } from "@/components/DataQuality";
import { DimensionBreakdown } from "@/components/DimensionBreakdown";
import { Disclaimer } from "@/components/Disclaimer";
import {
  EMPTY_FORM,
  ProjectForm,
  type FieldErrors,
  type FormState,
  toProjectInput,
  validate,
} from "@/components/ProjectForm";
import { RiskSignals } from "@/components/RiskSignals";
import { RiskSummary } from "@/components/RiskSummary";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui";
import { ApiError, assessProject } from "@/services/api";
import type { RiskAssessment } from "@/types/assessment";

type ResultState =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "success"; assessment: RiskAssessment }
  | { kind: "error"; error: ApiError };

const FALLBACK_DISCLAIMER =
  "Prototype decision-support scoring. Thresholds are illustrative assumptions and are not official MPLADS policy. Risk signals are not findings of fraud.";

export default function Home() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<ResultState>({ kind: "empty" });

  const submit = useCallback(async () => {
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      // Nothing is sent until the shape is valid; the engine still re-validates.
      return;
    }

    setResult({ kind: "loading" });
    try {
      const assessment = await assessProject(toProjectInput(form));
      setResult({ kind: "success", assessment });
    } catch (caught) {
      const error =
        caught instanceof ApiError
          ? caught
          : new ApiError("unexpected", "An unexpected error occurred while contacting the engine.");

      // Surface backend field rejections next to the inputs that caused them.
      if (error.kind === "validation" && error.fieldErrors.length > 0) {
        setErrors(
          Object.fromEntries(
            error.fieldErrors.map((fieldError) => [fieldError.field, fieldError.message]),
          ) as FieldErrors,
        );
      }
      setResult({ kind: "error", error });
    }
  }, [form]);

  const resetAll = useCallback(() => {
    setForm(EMPTY_FORM);
    setErrors({});
    setResult({ kind: "empty" });
  }, []);

  const newAssessment = useCallback(() => {
    setResult({ kind: "empty" });
    setErrors({});
  }, []);

  const disclaimer =
    result.kind === "success" ? result.assessment.disclaimer : FALLBACK_DISCLAIMER;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-3.5 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-700">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 2.5l6.5 2.8v4.2c0 3.9-2.6 7.2-6.5 8-3.9-.8-6.5-4.1-6.5-8V5.3L10 2.5z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-semibold tracking-tight text-ink">
                  MPLADS Sentinel
                </h1>
                <span className="rounded border border-line bg-canvas px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
                  Risk engine console
                </span>
              </div>
              <p className="text-[12px] text-ink-muted">
                Risk, Anomaly &amp; Compliance Intelligence
              </p>
            </div>
          </div>
          <ApiStatus />
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-6 lg:px-8">
        <p className="mb-5 max-w-3xl text-[13px] leading-relaxed text-ink-muted">
          A testing console for the risk-scoring engine. Submit a synthetic project to see the
          score, the four scoring dimensions, and the evidence behind each triggered signal. All
          scoring happens in the backend engine — this page only renders what it returns.
        </p>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <ProjectForm
            form={form}
            onFormChange={setForm}
            errors={errors}
            onSubmit={() => void submit()}
            onReset={resetAll}
            submitting={result.kind === "loading"}
          />

          <div className="space-y-4">
            {result.kind === "empty" ? <EmptyState /> : null}
            {result.kind === "loading" ? <LoadingState /> : null}
            {result.kind === "error" ? (
              <ErrorState error={result.error} onRetry={() => void submit()} />
            ) : null}

            {result.kind === "success" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] text-ink-muted">
                    Assessment for{" "}
                    <span className="font-medium text-ink">{result.assessment.project_id}</span>
                  </p>
                  <Button type="button" variant="secondary" onClick={newAssessment}>
                    New assessment
                  </Button>
                </div>
                <RiskSummary assessment={result.assessment} />
                <DimensionBreakdown dimensions={result.assessment.dimensions} />
                <RiskSignals signals={result.assessment.signals} />
                <DataQuality assessment={result.assessment} />
                <Disclaimer text={result.assessment.disclaimer} />
              </>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-[1440px] px-5 pb-8 lg:px-8">
        <div className="border-t border-line pt-4">
          <Disclaimer text={disclaimer} />
          <p className="mt-3 text-[11.5px] text-ink-subtle">
            Outputs are risk signals routed for authorised human review. They are not findings, and
            no automated determination is made about any work, person or organisation.
          </p>
        </div>
      </footer>
    </div>
  );
}
