"use client";

/**
 * The raw risk-engine console.
 *
 * Kept from the original prototype and preserved deliberately: it is the one
 * screen that lets a reviewer put a hypothetical record into the engine and
 * see exactly what comes back, which is how you check that the portal above it
 * is not editorialising. Every number here comes from `POST /risk/assess`.
 */

import { useCallback, useState } from "react";

import { DataQuality } from "@/components/DataQuality";
import { DimensionBreakdown } from "@/components/DimensionBreakdown";
import { OfficerShell } from "@/components/OfficerShell";
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
import { Button, Disclaimer } from "@/components/ui";
import { ApiError, assessProject } from "@/services/api";
import type { RiskAssessment } from "@/types/assessment";

type ResultState =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "success"; assessment: RiskAssessment }
  | { kind: "error"; error: ApiError };

const FALLBACK_DISCLAIMER =
  "Prototype decision-support scoring. Thresholds are illustrative assumptions and are not official MPLADS policy. Risk signals are not findings of fraud.";

export default function EngineConsolePage() {
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

  const disclaimer =
    result.kind === "success" ? result.assessment.disclaimer : FALLBACK_DISCLAIMER;

  return (
    <OfficerShell
      title="Engine Console"
      subtitle="Submit a record directly to the scoring engine and read the raw assessment."
    >
      <p className="mb-4 max-w-3xl text-[12.5px] leading-relaxed text-ink-muted">
        This screen talks to <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[11.5px]">POST /risk/assess</code>{" "}
        directly. Use it to test how the engine responds to a record — including a deliberately
        incomplete one, to confirm that missing fields are reported as unknown rather than scored
        as zero.
      </p>

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
            <div className="animate-rise space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] text-ink-muted">
                  Assessment for{" "}
                  <span className="font-medium text-ink">{result.assessment.project_id}</span>
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setResult({ kind: "empty" })}
                >
                  New assessment
                </Button>
              </div>
              <RiskSummary assessment={result.assessment} />
              <DimensionBreakdown dimensions={result.assessment.dimensions} />
              <RiskSignals signals={result.assessment.signals} />
              <DataQuality assessment={result.assessment} />
            </div>
          ) : null}

          <Disclaimer text={disclaimer} />
        </div>
      </div>
    </OfficerShell>
  );
}
