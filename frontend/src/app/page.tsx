"use client";

/**
 * The risk-engine testing console.
 *
 * This page owns the interaction state and the shell layout, and nothing else.
 * Every number it shows comes from `POST /risk/assess`; no scoring,
 * thresholding or risk judgement happens here.
 */

import { useCallback, useState } from "react";

import { ApiStatus } from "@/components/ApiStatus";
import { DataQuality } from "@/components/DataQuality";
import { DimensionBreakdown } from "@/components/DimensionBreakdown";
import { Disclaimer } from "@/components/Disclaimer";
import { Emblem } from "@/components/Emblem";
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
import { RuleCatalogue } from "@/components/RuleCatalogue";
import { Sidebar, type View } from "@/components/Sidebar";
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
  const [view, setView] = useState<View>("assess");
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
    <div className="min-h-screen p-3 lg:p-5">
      <div className="mx-auto flex max-w-[1560px] gap-5">
        <Sidebar
          view={view}
          onViewChange={setView}
          className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-[272px] shrink-0 lg:flex"
        />

        <div className="min-w-0 flex-1 space-y-5">
          <header className="rounded-[var(--radius-panel)] border border-line bg-surface px-5 py-4 shadow-[var(--shadow-card)] lg:px-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 lg:hidden">
                  <Emblem className="h-7 w-7" title="State Emblem of India" />
                </span>
                <div>
                  <h1 className="text-[17px] font-semibold tracking-tight text-ink">
                    {view === "assess" ? "Risk Assessment" : "Rule Catalogue"}
                  </h1>
                  <p className="text-[12.5px] text-ink-muted">
                    {view === "assess"
                      ? "Risk, Anomaly & Compliance Intelligence for MPLADS works"
                      : "The checks the engine evaluates, and the inputs each one needs"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-line bg-surface-sunken px-3.5 py-1.5">
                  <ApiStatus />
                </div>
              </div>
            </div>

            {/* The sidebar is hidden below lg; these keep both views reachable. */}
            <div className="mt-4 flex gap-2 lg:hidden">
              {(["assess", "rules"] as View[]).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setView(candidate)}
                  aria-current={view === candidate ? "page" : undefined}
                  className={
                    view === candidate
                      ? "rounded-full bg-brand-700 px-3.5 py-1.5 text-[12.5px] font-medium text-white"
                      : "rounded-full border border-line px-3.5 py-1.5 text-[12.5px] font-medium text-ink-muted"
                  }
                >
                  {candidate === "assess" ? "Risk Assessment" : "Rule Catalogue"}
                </button>
              ))}
            </div>
          </header>

          <main>
            {view === "rules" ? (
              <RuleCatalogue />
            ) : (
              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
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
                          <span className="font-medium text-ink">
                            {result.assessment.project_id}
                          </span>
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
            )}
          </main>

          <footer className="rounded-[var(--radius-panel)] border border-line bg-surface px-5 py-5 shadow-[var(--shadow-card)] lg:px-7">
            <Disclaimer text={disclaimer} />
            <p className="mt-3 text-[11.5px] text-ink-subtle">
              Outputs are risk signals routed for authorised human review. They are not findings,
              and no automated determination is made about any work, person or organisation.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
