/** Card for a work in a citizen-facing list or grid. */

import Link from "next/link";

import { RiskPill } from "@/components/RiskPill";
import { MapPinIcon, MegaphoneIcon } from "@/components/icons";
import { Badge, Card, cx } from "@/components/ui";
import { REVIEW_STATUS_CLASSES } from "@/lib/format";
import type { WorkSummary } from "@/types/portal";

/** Small category-tinted strip so a grid of cards is scannable by type. */
const CATEGORY_TINT: Record<string, string> = {
  road: "bg-brand-400",
  drinking_water: "bg-accent-500",
  sanitation: "bg-brand-500",
  education: "bg-brand-600",
  health: "bg-accent-600",
  community_asset: "bg-brand-400",
  public_lighting: "bg-accent-500",
  sports: "bg-brand-500",
  other: "bg-brand-400",
};

export function WorkCard({
  work,
  href,
  showRisk = true,
}: {
  work: WorkSummary;
  href?: string;
  /** The citizen grid leads with progress; the officer's leads with risk. */
  showRisk?: boolean;
}) {
  const completion = work.completion_percentage;

  return (
    <Card interactive className="group flex h-full flex-col overflow-hidden">
      <Link
        href={href ?? `/works/${work.work_id}`}
        className="flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <span className={cx("h-1 w-full", CATEGORY_TINT[work.category] ?? "bg-brand-400")} />

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="tabular font-mono text-[11.5px] text-ink-subtle">{work.work_id}</span>
            {showRisk ? (
              <RiskPill score={work.risk_score} level={work.risk_level} size="sm" showLabel={false} />
            ) : null}
          </div>

          <h3 className="mt-1.5 text-[14px] font-semibold leading-snug text-ink transition-colors duration-150 group-hover:text-brand-700">
            {work.title}
          </h3>

          <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-muted">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
            <span className="truncate">
              {work.block}, {work.district} · {work.state}
            </span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge>{work.category_label}</Badge>
            <Badge tone={REVIEW_STATUS_CLASSES[work.review_status]}>{work.stage_label}</Badge>
            {work.citizen_report_count > 0 ? (
              <Badge tone="border-brand-100 bg-brand-50 text-brand-700">
                <MegaphoneIcon className="h-3 w-3" />
                {work.citizen_report_count}
              </Badge>
            ) : null}
          </div>

          <div className="mt-auto pt-4">
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-ink-muted">Sanctioned</span>
              <span className="tabular font-medium text-ink">{work.sanctioned.formatted}</span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between text-[11.5px]">
                <span className="text-ink-muted">Progress</span>
                <span className="tabular font-medium text-ink">
                  {completion === null ? "Not reported" : `${Math.round(completion)}%`}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                {completion === null ? (
                  <div
                    className="h-full w-full opacity-60"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, var(--color-line-strong) 0 4px, transparent 4px 8px)",
                    }}
                  />
                ) : (
                  <div
                    className="h-full rounded-full bg-accent-500 transition-[width] duration-500"
                    style={{ width: `${Math.max(completion, 1.5)}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
