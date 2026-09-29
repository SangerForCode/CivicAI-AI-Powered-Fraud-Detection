"use client";

/**
 * The console's left rail.
 *
 * It lists only what this prototype actually does: run an assessment, read the
 * rule catalogue, and open the engine's own API docs. Nothing here is a
 * placeholder for a screen that does not exist.
 */

import type { ReactNode } from "react";

import { Emblem } from "@/components/Emblem";
import { BookIcon, ExternalIcon, GaugeIcon } from "@/components/icons";
import { cx } from "@/components/ui";
import { apiBaseUrl } from "@/services/api";

export type View = "assess" | "rules";

const NAV: { view: View; label: string; hint: string; icon: ReactNode }[] = [
  {
    view: "assess",
    label: "Risk Assessment",
    hint: "Submit a project and read its score",
    icon: <GaugeIcon className="h-[18px] w-[18px]" />,
  },
  {
    view: "rules",
    label: "Rule Catalogue",
    hint: "What the engine checks",
    icon: <BookIcon className="h-[18px] w-[18px]" />,
  },
];

export function Sidebar({
  view,
  onViewChange,
  className,
}: {
  view: View;
  onViewChange: (next: View) => void;
  className?: string;
}) {
  return (
    <aside
      className={cx(
        "flex flex-col rounded-[var(--radius-panel)] bg-brand-800 text-white shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-accent-100"
          style={{ ["--emblem-void" as string]: "#0d3527" }}
        >
          <Emblem className="h-8 w-8" title="State Emblem of India" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight">MPLADS Sentinel</p>
          <p className="truncate text-[11.5px] text-white/55">Government of India</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Console sections">
        {NAV.map((item) => {
          const active = item.view === view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onViewChange(item.view)}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600",
                active
                  ? "bg-white text-brand-800 shadow-[0_8px_20px_-14px_rgba(0,0,0,0.9)]"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <span className={cx(active ? "text-brand-700" : "text-white/60")}>{item.icon}</span>
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium">{item.label}</span>
                <span
                  className={cx(
                    "block truncate text-[11px]",
                    active ? "text-ink-muted" : "text-white/45",
                  )}
                >
                  {item.hint}
                </span>
              </span>
            </button>
          );
        })}

        <a
          href={`${apiBaseUrl}/docs`}
          target="_blank"
          rel="noreferrer"
          className={cx(
            "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-white/70 transition-colors",
            "hover:bg-white/10 hover:text-white",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600",
          )}
        >
          <span className="text-white/60">
            <ExternalIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium">Engine API Docs</span>
            <span className="block truncate text-[11px] text-white/45">OpenAPI, served by the engine</span>
          </span>
        </a>
      </nav>

      <div className="px-5 pb-6 pt-5">
        <div className="rounded-2xl bg-white/[0.07] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-100/80">
            Prototype
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-white/60">
            Decision-support scoring for authorised human review. Not a finding of fraud.
          </p>
        </div>
      </div>
    </aside>
  );
}
