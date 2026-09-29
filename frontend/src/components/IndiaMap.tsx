"use client";

/**
 * India map with work markers.
 *
 * The state outlines in `india-map.json` are stored already projected, and
 * `project()` below applies the identical transform to a marker's latitude and
 * longitude. Because the outlines and the markers go through the same
 * function, a pin cannot drift from the coastline it belongs to.
 *
 * The projection is equirectangular with a standard parallel at 23°N, which is
 * why longitude is scaled by `kx`: without it India looks noticeably wide.
 */

import { useMemo, useState } from "react";

import mapData from "@/lib/india-map.json";
import { RISK_DOT, UNKNOWN_DOT } from "@/lib/format";
import { cx } from "@/components/ui";
import type { WorkSummary } from "@/types/portal";

const { meta, states } = mapData as {
  meta: { kx: number; viewBox: [number, number, number, number] };
  states: { state: string; d: string }[];
};

const [VIEW_X, VIEW_Y, VIEW_W, VIEW_H] = meta.viewBox;

/** Longitude/latitude to the same space the outlines were baked in. */
export function project(lat: number, lon: number): { x: number; y: number } {
  return { x: lon * meta.kx, y: -lat };
}

export interface MapMarker {
  work: WorkSummary;
}

export function IndiaMap({
  works,
  selectedId,
  onSelect,
  highlightStates,
  className,
  markerScale = 1,
}: {
  works: WorkSummary[];
  selectedId?: string | null;
  onSelect?: (work: WorkSummary) => void;
  /** State name -> fill colour, for the officer's risk choropleth. */
  highlightStates?: Record<string, string>;
  className?: string;
  markerScale?: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Draw the worst last so a critical pin is never hidden under a low one.
  const ordered = useMemo(
    () => [...works].sort((a, b) => (a.risk_score ?? -1) - (b.risk_score ?? -1)),
    [works],
  );

  const radius = 0.2 * markerScale;

  return (
    <div className={cx("relative w-full", className)}>
      <svg
        viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full"
        role="img"
        aria-label={`Map of India showing ${works.length} works`}
      >
        <g>
          {states.map((entry) => {
            const fill = highlightStates?.[entry.state];
            return (
              <path
                key={entry.state}
                d={entry.d}
                fill={fill ?? "var(--color-brand-50)"}
                stroke={fill ?? "var(--color-brand-50)"}
                strokeWidth={0.03}
                strokeLinejoin="round"
                className="transition-[fill] duration-300"
              />
            );
          })}
        </g>

        <g>
          {ordered.map((work) => {
            const { x, y } = project(work.lat, work.lon);
            const colour = work.risk_level ? RISK_DOT[work.risk_level] : UNKNOWN_DOT;
            const active = selectedId === work.work_id || hovered === work.work_id;
            return (
              <circle
                key={work.work_id}
                cx={x}
                cy={y}
                r={active ? radius * 1.9 : radius}
                fill={colour}
                stroke="#ffffff"
                strokeWidth={active ? 0.1 : 0.06}
                className="cursor-pointer transition-[r] duration-150"
                onMouseEnter={() => setHovered(work.work_id)}
                onMouseLeave={() => setHovered((current) => (current === work.work_id ? null : current))}
                onClick={() => onSelect?.(work)}
              >
                <title>{`${work.work_id} — ${work.title} (${work.district})`}</title>
              </circle>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/** Shared legend for both map views. */
export function MapLegend({ className }: { className?: string }) {
  const entries = [
    { label: "Critical", colour: RISK_DOT.critical },
    { label: "High", colour: RISK_DOT.high },
    { label: "Medium", colour: RISK_DOT.medium },
    { label: "Low", colour: RISK_DOT.low },
    { label: "Not assessable", colour: UNKNOWN_DOT },
  ];
  return (
    <ul className={cx("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {entries.map((entry) => (
        <li key={entry.label} className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: entry.colour }}
            aria-hidden="true"
          />
          {entry.label}
        </li>
      ))}
    </ul>
  );
}
