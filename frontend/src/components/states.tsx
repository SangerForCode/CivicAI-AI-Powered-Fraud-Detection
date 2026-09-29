"use client";

/** Empty, loading and error presentations shared across the app. */

import type { ReactNode } from "react";

import { AlertIcon, SearchIcon } from "@/components/icons";
import { Button, Card, FieldChip, Skeleton, cx } from "@/components/ui";
import { ApiError, apiBaseUrl } from "@/services/api";
import { humaniseField } from "@/lib/format";

export function EmptyState({
  title = "No assessment yet",
  message = "Submit a project to see the engine's score, its four dimensions and the evidence behind each signal.",
  icon,
  action,
}: {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-sunken text-ink-subtle">
        {icon ?? <SearchIcon className="h-5 w-5" />}
      </span>
      <p className="mt-3 text-[14px] font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-ink-muted">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="mt-3 h-7 w-16" />
            </div>
          ))}
        </div>
      </Card>
      {Array.from({ length: rows }, (_, index) => (
        <Card key={index} className="p-5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-2.5 h-2.5 w-full max-w-md" />
          <Skeleton className="mt-2 h-2.5 w-full max-w-sm" />
        </Card>
      ))}
    </div>
  );
}

/** Skeleton shaped like a table, for list views. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="border-b border-line bg-sunken px-5 py-3">
        <Skeleton className="h-2.5 w-32" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-2.5 flex-1" />
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </Card>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: ApiError;
  onRetry?: () => void;
  className?: string;
}) {
  const heading =
    error.kind === "network"
      ? "Cannot reach the risk engine"
      : error.kind === "validation"
        ? "The engine rejected this input"
        : "Something went wrong";

  return (
    <Card className={cx("px-5 py-6", className)}>
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-risk-critical-line bg-risk-critical-bg text-risk-critical">
          <AlertIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-ink">{heading}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{error.message}</p>

          {error.fieldErrors.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {error.fieldErrors.map((fieldError) => (
                <li key={fieldError.field} className="flex flex-wrap items-center gap-2 text-[12px]">
                  <FieldChip>{humaniseField(fieldError.field)}</FieldChip>
                  <span className="text-ink-muted">{fieldError.message}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {error.kind === "network" ? (
            <p className="mt-3 rounded-[var(--radius-field)] border border-line bg-sunken px-3 py-2 font-mono text-[11.5px] text-ink-muted">
              Expected at {apiBaseUrl} — start it with:{" "}
              <br />
              cd backend && .venv/bin/uvicorn app.main:app --port 8000
            </p>
          ) : null}

          {onRetry ? (
            <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
