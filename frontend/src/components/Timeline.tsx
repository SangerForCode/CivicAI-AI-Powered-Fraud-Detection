/** The sanction-to-completion progress timeline on a work's page. */

import { MILESTONE_CLASSES } from "@/lib/format";
import { cx } from "@/components/ui";
import type { Milestone } from "@/types/portal";

export function Timeline({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) return null;

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:gap-0">
      {milestones.map((milestone, index) => {
        const tone = MILESTONE_CLASSES[milestone.status];
        const isLast = index === milestones.length - 1;
        const nextDone = milestones[index + 1]?.status !== "upcoming";

        return (
          <li key={milestone.label} className="relative flex flex-1 gap-3 sm:block">
            {/* Connector: vertical on narrow screens, horizontal from sm up. */}
            {!isLast ? (
              <span
                className={cx(
                  "absolute left-[5px] top-4 h-[calc(100%-0.5rem)] w-0.5 sm:left-auto sm:top-[5px] sm:h-0.5 sm:w-full sm:translate-x-3",
                  nextDone ? "bg-accent-500" : "bg-line",
                )}
                aria-hidden="true"
              />
            ) : null}

            <span
              className={cx(
                "relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 sm:mt-0",
                tone.dot,
              )}
              aria-hidden="true"
            />

            <div className="pb-5 sm:pb-0 sm:pr-4 sm:pt-3">
              <p className={cx("text-[12.5px] font-medium", tone.text)}>{milestone.label}</p>
              <p className="text-[11.5px] text-ink-subtle">
                {milestone.date_formatted ?? "Not recorded"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
