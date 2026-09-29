"use client";

/**
 * The project preview window.
 *
 * One component serves both places a work is previewed without opening it: the
 * hover popover on a listing, and the card beside a selected map marker. They
 * were drifting apart as two near-identical panels, and a reviewer who learns
 * the layout on the map should read the same thing on the works list.
 *
 * Nothing here computes a risk figure. Score, band, flags and the formatted
 * amount all arrive from the backend on the `WorkSummary`.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { RiskPill } from "@/components/RiskPill";
import { MapPinIcon } from "@/components/icons";
import { Badge, Button, cx } from "@/components/ui";
import { RISK_LEVEL_LABELS } from "@/lib/format";
import type { WorkSummary } from "@/types/portal";

const PREVIEW_WIDTH = 288;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <div className="mt-0.5 text-[13px] font-semibold text-ink">{children}</div>
    </div>
  );
}

export function WorkPreviewCard({
  work,
  href,
  onClose,
  className,
}: {
  work: WorkSummary;
  href: string;
  /** Rendered only where the preview is pinned open, e.g. the map panel. */
  onClose?: () => void;
  className?: string;
}) {
  const completion = work.completion_percentage;

  return (
    <div className={cx("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="tabular font-mono text-[11.5px] text-ink-subtle">{work.work_id}</span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="-mr-1 -mt-1 rounded p-1 text-ink-subtle transition-colors duration-150 hover:text-ink"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <h3 className="mt-1 text-[14px] font-semibold leading-snug text-ink">{work.title}</h3>
      <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-muted">
        <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
        <span className="truncate">
          {work.district}, {work.state}
        </span>
      </p>

      <div className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-line pt-3.5">
        <Field label="Risk score">
          <RiskPill score={work.risk_score} level={work.risk_level} size="sm" showLabel={false} />
        </Field>
        <Field label="Risk level">
          <span className="text-[12.5px]">
            {work.risk_level ? RISK_LEVEL_LABELS[work.risk_level] : "Not assessable"}
          </span>
        </Field>
        <Field label="Completion">
          <span className="tabular">
            {completion === null ? "Not reported" : `${Math.round(completion)}%`}
          </span>
        </Field>
        <Field label="Status">
          <span className="text-[12.5px]">{work.stage_label}</span>
        </Field>
      </div>

      {work.key_flags.length > 0 ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-[10.5px] font-medium uppercase tracking-wide text-ink-muted">
            Key flag
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {work.key_flags.slice(0, 2).map((flag) => (
              <Badge key={flag} tone="border-risk-high-line bg-risk-high-bg text-risk-high">
                {flag}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <Link href={href} className="mt-4 block">
        <Button className="w-full" size="sm">
          View Project
        </Button>
      </Link>
    </div>
  );
}

/**
 * Wraps a listing row or card and floats the preview beside it on hover.
 *
 * Only on devices that actually hover: on touch the trigger stays a plain link
 * and tapping opens the work, because a popover you cannot dismiss without
 * navigating is worse than no popover.
 */
export function WorkPreviewOnHover({
  work,
  href,
  children,
  className,
}: {
  work: WorkSummary;
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spot, setSpot] = useState<{ top: number; left: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  const open = useCallback(() => {
    clear();
    timerRef.current = setTimeout(() => {
      const node = anchorRef.current;
      if (!node) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

      const rect = node.getBoundingClientRect();
      const gap = 10;
      // Right of the trigger where it fits, otherwise left. The estimate is
      // generous so a tall preview is never pinned to the bottom edge.
      const left =
        rect.right + gap + PREVIEW_WIDTH <= window.innerWidth - 8
          ? rect.right + gap
          : Math.max(8, rect.left - gap - PREVIEW_WIDTH);
      const top = Math.min(Math.max(8, rect.top), Math.max(8, window.innerHeight - 340));
      setSpot({ top, left });
    }, 180);
  }, [clear]);

  const close = useCallback(() => {
    clear();
    setSpot(null);
  }, [clear]);

  return (
    <div
      ref={anchorRef}
      className={cx("relative", className)}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocusCapture={open}
      onBlurCapture={close}
    >
      {children}
      {spot
        ? createPortal(
            <div
              // Presentational: the same facts are already in the trigger, and
              // the pointer cannot reach the panel without leaving the anchor.
              aria-hidden="true"
              className="animate-rise pointer-events-none fixed z-50 rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-raised)]"
              style={{ top: spot.top, left: spot.left, width: PREVIEW_WIDTH }}
            >
              <WorkPreviewCard work={work} href={href} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
