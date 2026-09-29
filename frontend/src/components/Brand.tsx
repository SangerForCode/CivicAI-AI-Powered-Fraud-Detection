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
      {/* No plate behind the emblem. A tinted square around the State Emblem
          reads as a logo lockup it is not entitled to; the glyph sits on the
          surface, inverted to white only where the surface is dark green. */}
      <Emblem className="h-9 shrink-0" tone={tone} />
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
    <Link
      href={href}
      className="inline-flex min-w-0 rounded-[var(--radius-field)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
