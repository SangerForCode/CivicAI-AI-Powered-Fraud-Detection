/** The wordmark: emblem, name and the line that goes under it. */

import Link from "next/link";

import { Emblem } from "@/components/Emblem";
import { cx } from "@/components/ui";

export function Wordmark({
  href = "/",
  tone = "dark",
  className,
}: {
  href?: string;
  /** `dark` for light backgrounds, `light` for the green sidebar. */
  tone?: "dark" | "light";
  className?: string;
}) {
  const content = (
    <span className={cx("flex items-center gap-2.5", className)}>
      <span
        className={cx(
          "flex h-10 w-8 shrink-0 items-center justify-center rounded-[var(--radius-field)] px-0.5",
          tone === "dark" ? "bg-brand-50" : "bg-white/10",
        )}
      >
        <Emblem className="h-8" tone={tone} />
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={cx(
            "block truncate text-[15px] font-semibold tracking-tight",
            tone === "dark" ? "text-ink" : "text-white",
          )}
        >
          MPLADS Sentinel
        </span>
        <span
          className={cx(
            "block truncate text-[11px]",
            tone === "dark" ? "text-ink-muted" : "text-white/60",
          )}
        >
          People. Projects. Progress.
        </span>
      </span>
    </span>
  );

  return href ? (
    <Link href={href} className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
      {content}
    </Link>
  ) : (
    content
  );
}
