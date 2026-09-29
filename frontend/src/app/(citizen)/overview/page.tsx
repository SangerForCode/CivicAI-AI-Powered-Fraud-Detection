"use client";

/**
 * How MPLADS Sentinel works — the product story, for a presentation.
 *
 * This page explains the system; it does not operate it. Nothing here fetches
 * a risk figure or restates one, with a single exception: the demo links pick
 * a genuinely high-risk work from the dashboard so a presenter never clicks
 * through to an uninteresting record or a dead id.
 */

import Link from "next/link";
import { useState } from "react";

import {
  ArrowRightIcon,
  ChartIcon,
  FileIcon,
  GaugeIcon,
  GridIcon,
  MapPinIcon,
  MegaphoneIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
  UsersGroupIcon,
} from "@/components/icons";
import { Card, cx } from "@/components/ui";
import { useAsync } from "@/lib/useAsync";
import { fetchDashboard } from "@/services/api";
import type { ReactNode } from "react";

interface Stage {
  key: string;
  label: string;
  role: string;
  icon: ReactNode;
  summary: string;
  items: string[];
}

const STAGES: Stage[] = [
  {
    key: "citizens",
    label: "Citizens",
    role: "Observation",
    icon: <UsersGroupIcon className="h-5 w-5" />,
    summary:
      "The register is public. Anyone can look up a work near them and say what they can actually see on the ground.",
    items: [
      "Explore public works",
      "Track progress",
      "Report issues",
      "Provide supporting evidence",
    ],
  },
  {
    key: "engine",
    label: "Risk Engine",
    role: "Rule-based analysis",
    icon: <GaugeIcon className="h-5 w-5" />,
    summary:
      "Seventeen written rules read the implementation record across four weighted dimensions. Every score can be traced back to the rule and the field that produced it.",
    items: ["Financial", "Timeline", "Documentation", "Progress reporting"],
  },
  {
    key: "analysis",
    label: "AI Intelligence",
    role: "Assisted analysis",
    icon: <SparkIcon className="h-5 w-5" />,
    summary:
      "The assisted layer reads what the rules already found and what citizens already reported, and composes it into a short brief. It adds no score of its own.",
    items: [
      "Pattern analysis",
      "Evidence correlation",
      "Citizen reports",
      "Explainable recommendations",
    ],
  },
  {
    key: "officer",
    label: "Officer Portal",
    role: "Human decision",
    icon: <ShieldIcon className="h-5 w-5" />,
    summary:
      "An officer works the queue in risk order, reads the evidence behind each figure, and decides. The system recommends; it never concludes.",
    items: ["Risk prioritisation", "Evidence review", "Investigation", "Human verification"],
  },
];

/** The end-to-end sequence, as a presenter would narrate it. */
const JOURNEY: { label: string; note: string }[] = [
  { label: "A citizen sees a project", note: "A work in their own village or ward." },
  { label: "They explore its status", note: "Sanction, spend, progress, documents, timeline." },
  { label: "They report a concern", note: "An observation, attached to that specific work." },
  { label: "The report becomes evidence", note: "Recorded, dated, and left unverified." },
  { label: "The engine analyses the record", note: "Rules over four weighted dimensions." },
  { label: "The assisted layer correlates it", note: "Rule signals plus citizen observations." },
  { label: "The work receives an explainable score", note: "With the reasons attached to it." },
  { label: "An officer investigates", note: "Risk, evidence, timeline, reports, analysis." },
  { label: "A human official decides", note: "The system never closes a case by itself." },
];

/**
 * A miniature of a real screen.
 *
 * Drawn, not captured. A screenshot goes stale the first time the layout
 * changes and nobody notices; a schematic stays honest about being a pointer.
 */
function ScreenMini({ variant }: { variant: "citizen" | "officer" | "detail" | "map" }) {
  return (
    <svg viewBox="0 0 120 72" className="h-full w-full" aria-hidden="true">
      <rect width="120" height="72" rx="4" fill="var(--color-surface)" />
      {variant === "officer" || variant === "detail" ? (
        <rect width="22" height="72" rx="4" fill="var(--color-brand-800)" />
      ) : (
        <rect width="120" height="11" fill="var(--color-sunken)" />
      )}
      {variant === "citizen" ? (
        <>
          <rect x="8" y="18" width="52" height="7" rx="2" fill="var(--color-brand-100)" />
          <rect x="8" y="29" width="38" height="4" rx="2" fill="var(--color-line)" />
          <rect x="8" y="40" width="46" height="9" rx="4" fill="var(--color-brand-600)" />
          {[68, 90].map((x) => (
            <rect key={x} x={x} y="18" width="20" height="34" rx="3" fill="var(--color-sunken)" />
          ))}
        </>
      ) : null}
      {variant === "officer" ? (
        <>
          {[26, 49, 72, 95].map((x) => (
            <rect key={x} x={x} y="7" width="19" height="14" rx="3" fill="var(--color-sunken)" />
          ))}
          <rect x="26" y="26" width="52" height="38" rx="3" fill="var(--color-brand-50)" />
          <circle cx="98" cy="45" r="14" fill="none" stroke="var(--color-accent-500)" strokeWidth="5" />
        </>
      ) : null}
      {variant === "detail" ? (
        <>
          <rect x="26" y="8" width="42" height="7" rx="2" fill="var(--color-line)" />
          <rect x="88" y="6" width="26" height="11" rx="5" fill="var(--color-risk-high-bg)" />
          {[22, 31, 40].map((y, index) => (
            <g key={y}>
              <rect x="26" y={y} width="60" height="4" rx="2" fill="var(--color-sunken)" />
              <rect
                x="26"
                y={y}
                width={[44, 28, 16][index]}
                height="4"
                rx="2"
                fill="var(--color-risk-high)"
              />
            </g>
          ))}
          <rect x="26" y="50" width="88" height="14" rx="3" fill="var(--color-brand-50)" />
        </>
      ) : null}
      {variant === "map" ? (
        <>
          <path
            d="M46 14 L70 18 L76 34 L64 58 L48 52 L40 32 Z"
            fill="var(--color-brand-50)"
            stroke="var(--color-brand-100)"
          />
          <circle cx="56" cy="28" r="3" fill="var(--color-risk-critical)" />
          <circle cx="64" cy="40" r="2.5" fill="var(--color-risk-high)" />
          <circle cx="50" cy="44" r="2.5" fill="var(--color-risk-low)" />
          <rect x="86" y="18" width="28" height="36" rx="3" fill="var(--color-sunken)" />
        </>
      ) : null}
    </svg>
  );
}

function ScreenCard({
  href,
  title,
  note,
  variant,
}: {
  href: string;
  title: string;
  note: string;
  variant: "citizen" | "officer" | "detail" | "map";
}) {
  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <Card
        interactive
        className="h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-brand-600"
      >
        <div className="border-b border-line bg-sunken/60 p-3">
          <div className="mx-auto aspect-[120/72] w-full max-w-[220px] overflow-hidden rounded-[var(--radius-sm)] border border-line">
            <ScreenMini variant={variant} />
          </div>
        </div>
        <div className="p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink transition-colors duration-150 group-hover:text-brand-700">
            {title}
            <ArrowRightIcon className="h-3.5 w-3.5 text-brand-700 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{note}</p>
        </div>
      </Card>
    </Link>
  );
}

export default function OverviewPage() {
  const [active, setActive] = useState(STAGES[0].key);
  const dashboard = useAsync(() => fetchDashboard(), []);

  // A real flagged work, so the investigation link lands somewhere worth
  // showing. Falls back to the works list rather than guessing an id.
  const worstId =
    dashboard.state.kind === "ready" ? dashboard.state.data.high_risk_works[0]?.work_id : undefined;
  const investigationHref = worstId ? `/officer/works/${worstId}` : "/officer/works";

  const selected = STAGES.find((stage) => stage.key === active) ?? STAGES[0];

  const runOrder: { label: string; href: string }[] = [
    { label: "Overview", href: "/overview" },
    { label: "Citizen portal", href: "/" },
    { label: "A project", href: worstId ? `/works/${worstId}` : "/explore" },
    { label: "Submit a report", href: "/explore?report=1" },
    { label: "Officer dashboard", href: "/officer" },
    { label: "Risk map", href: "/officer/map" },
    { label: "A high-risk project", href: investigationHref },
    { label: "Assisted analysis and evidence", href: investigationHref },
    { label: "Human review", href: "/officer/reports" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 lg:px-8 lg:py-14">
      {/* Title */}
      <header className="animate-rise max-w-2xl">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-brand-700">
          How it works
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[40px]">
          From Visibility to Vigilance
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">
          MPLADS Sentinel connects public observations, implementation data and AI-assisted risk
          intelligence to help authorised officials prioritise human review.
        </p>
      </header>

      {/* The four stages, with connectors */}
      <section className="mt-10" aria-labelledby="flow-heading">
        <h2 id="flow-heading" className="sr-only">
          System flow
        </h2>

        <div className="relative">
          {/* Connector line, desktop only: the cards sit on a single rail. */}
          <svg
            className="pointer-events-none absolute inset-x-0 top-[46px] hidden h-px w-full lg:block"
            viewBox="0 0 100 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              x1="6"
              y1="0.5"
              x2="94"
              y2="0.5"
              stroke="var(--color-brand-200)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              className="animate-flow"
            />
          </svg>

          <ol className="relative grid gap-4 lg:grid-cols-4">
            {STAGES.map((stage, index) => {
              const isActive = stage.key === selected.key;
              return (
                <li key={stage.key} className="relative">
                  {/* Vertical connector between stacked cards on small screens. */}
                  {index < STAGES.length - 1 ? (
                    <span
                      className="absolute left-1/2 top-full h-4 w-px -translate-x-1/2 bg-brand-200 lg:hidden"
                      aria-hidden="true"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setActive(stage.key)}
                    onMouseEnter={() => setActive(stage.key)}
                    aria-pressed={isActive}
                    className={cx(
                      "flex h-full w-full flex-col items-start rounded-[var(--radius-card)] border bg-surface p-4 text-left",
                      "transition-[transform,border-color,box-shadow] duration-200",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                      isActive
                        ? "-translate-y-0.5 border-brand-400 shadow-[var(--shadow-raised)]"
                        : "border-line shadow-[var(--shadow-card)] hover:border-line-strong",
                    )}
                  >
                    <span
                      className={cx(
                        "flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-200",
                        isActive
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-line bg-brand-50 text-brand-700",
                      )}
                      aria-hidden="true"
                    >
                      {stage.icon}
                    </span>
                    <span className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
                      {stage.role}
                    </span>
                    <span className="text-[15px] font-semibold tracking-tight text-ink">
                      {stage.label}
                    </span>
                    <ul className="mt-2.5 space-y-1">
                      {stage.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-1.5 text-[12px] leading-snug text-ink-muted"
                        >
                          <span
                            className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-brand-400"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <Card className="animate-fade mt-4 p-5" key={selected.key}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
            {selected.label}
          </p>
          <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-ink">
            {selected.summary}
          </p>
        </Card>
      </section>

      {/* The journey, end to end */}
      <section className="mt-12" aria-labelledby="journey-heading">
        <h2
          id="journey-heading"
          className="text-[20px] font-semibold tracking-tight text-ink"
        >
          One work, end to end
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          The same record, as it moves from a person noticing something to an official deciding
          what to do about it.
        </p>

        <ol className="mt-5 space-y-0">
          {JOURNEY.map((step, index) => (
            <li key={step.label} className="relative flex gap-4 pb-5 last:pb-0">
              <span className="relative flex w-6 shrink-0 justify-center" aria-hidden="true">
                <span className="z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-[10.5px] font-semibold text-brand-700">
                  {index + 1}
                </span>
                {index < JOURNEY.length - 1 ? (
                  <svg
                    className="absolute left-1/2 top-7 h-[calc(100%-1rem)] w-px -translate-x-1/2"
                    preserveAspectRatio="none"
                    viewBox="0 0 1 10"
                    aria-hidden="true"
                  >
                    <line
                      x1="0.5"
                      y1="0"
                      x2="0.5"
                      y2="10"
                      stroke="var(--color-brand-200)"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      className="animate-flow"
                    />
                  </svg>
                ) : null}
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block text-[13.5px] font-medium text-ink">{step.label}</span>
                <span className="block text-[12px] text-ink-muted">{step.note}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* The real screens */}
      <section className="mt-12" aria-labelledby="screens-heading">
        <h2 id="screens-heading" className="text-[20px] font-semibold tracking-tight text-ink">
          The screens this happens on
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Each card opens the actual page, not a mock-up of it.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScreenCard
            href="/"
            variant="citizen"
            title="Citizen portal"
            note="The public register: search, explore, and see where the money went."
          />
          <ScreenCard
            href="/officer"
            variant="officer"
            title="Officer dashboard"
            note="Volume, risk distribution and the works that need attention first."
          />
          <ScreenCard
            href="/officer/map"
            variant="map"
            title="Risk map"
            note="Where flagged works cluster, and which ones they are."
          />
          <ScreenCard
            href={investigationHref}
            variant="detail"
            title="Project investigation"
            note="Score, the reasons behind it, the evidence, and what to check."
          />
        </div>
      </section>

      {/* Presenter running order */}
      <section className="mt-12" aria-labelledby="demo-heading">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 id="demo-heading" className="text-[15px] font-semibold tracking-tight text-ink">
              Demonstration running order
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              Nine steps, in order. Every link goes to a live screen with data already in it.
            </p>
          </div>
          <ol className="grid gap-px bg-line sm:grid-cols-3">
            {runOrder.map((step, index) => (
              <li key={step.label} className="bg-surface">
                <Link
                  href={step.href}
                  className="flex h-full items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-sunken focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
                >
                  <span className="tabular text-[11px] font-semibold text-ink-subtle">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                    {step.label}
                  </span>
                  <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* Closing */}
      <section className="mt-12">
        <div className="rounded-[var(--radius-card)] border border-brand-100 bg-brand-50/60 px-6 py-7 text-center">
          <p className="text-[17px] font-semibold tracking-tight text-brand-700 sm:text-[19px]">
            AI-assisted intelligence. Explainable evidence. Human-supervised action.
          </p>
          <p className="mx-auto mt-2.5 max-w-xl text-[12.5px] leading-relaxed text-ink-muted">
            A risk score is a prompt to look, never a finding. Nothing in this system concludes that
            anything went wrong, and no record here describes a real MPLADS work or a real person —
            the entire register is synthetic demonstration data.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-field)] bg-brand-700 px-4 py-2 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-brand-500"
            >
              <SearchIcon className="h-4 w-4" />
              Explore the register
            </Link>
            <Link
              href="/officer"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-field)] border border-line-strong bg-surface px-4 py-2 text-[13px] font-medium text-ink transition-colors duration-150 hover:bg-sunken"
            >
              <GridIcon className="h-4 w-4" />
              Open the officer portal
            </Link>
          </div>
        </div>
      </section>

      {/* Quiet key to the icons used above, so nothing is unexplained. */}
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-ink-subtle">
        {[
          { icon: <MegaphoneIcon className="h-3.5 w-3.5" />, label: "Citizen reports" },
          { icon: <ChartIcon className="h-3.5 w-3.5" />, label: "Rule-based scoring" },
          { icon: <FileIcon className="h-3.5 w-3.5" />, label: "Document evidence" },
          { icon: <MapPinIcon className="h-3.5 w-3.5" />, label: "Geographic view" },
        ].map((entry) => (
          <li key={entry.label} className="flex items-center gap-1.5">
            {entry.icon}
            {entry.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
