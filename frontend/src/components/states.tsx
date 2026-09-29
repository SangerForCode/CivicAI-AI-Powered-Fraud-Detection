"use client";

/** Empty, loading and error presentations for the results column. */

import { Button, Card } from "@/components/ui";
import { ApiError } from "@/services/api";

export function EmptyState() {
  return (
    <Card className="flex min-h-[340px] flex-col items-center justify-center px-8 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-canvas">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 2.5l6.5 2.8v4.2c0 3.9-2.6 7.2-6.5 8-3.9-.8-6.5-4.1-6.5-8V5.3L10 2.5z"
            stroke="#64748b"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M7.6 10l1.7 1.7 3.2-3.4" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-ink">No assessment yet</h2>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">
        Fill in the project form, or load one of the example projects, then select{" "}
        <span className="font-medium text-ink">Assess Risk</span>. The scoring engine returns the
        result; nothing is computed in this page.
      </p>
    </Card>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Assessing project…</span>
      <Card className="px-5 py-5">
        <div className="grid gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="h-2.5 w-20 animate-pulse rounded bg-line" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded bg-line" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-4 px-5 py-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-line" />
              <div className="h-2.5 w-64 animate-pulse rounded bg-line" />
            </div>
            <div className="h-7 w-10 animate-pulse rounded bg-line" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const heading =
    error.kind === "network"
      ? "Cannot reach the risk engine"
      : error.kind === "validation"
        ? "The engine rejected this input"
        : "The risk engine returned an error";

  return (
    <Card className="border-risk-critical-line">
      <div className="px-5 py-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-risk-critical-bg text-[12px] font-bold text-risk-critical">
            !
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-ink">{heading}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{error.message}</p>

            {error.fieldErrors.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {error.fieldErrors.map((fieldError) => (
                  <li key={`${fieldError.field}-${fieldError.message}`} className="text-[12.5px]">
                    <code className="font-mono text-[11.5px] text-risk-critical">
                      {fieldError.field}
                    </code>
                    <span className="text-ink-muted"> — {fieldError.message}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {error.kind === "network" ? (
              <p className="mt-3 rounded-md border border-line bg-canvas px-3 py-2 font-mono text-[11.5px] text-ink-muted">
                cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000
              </p>
            ) : null}

            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={onRetry}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
