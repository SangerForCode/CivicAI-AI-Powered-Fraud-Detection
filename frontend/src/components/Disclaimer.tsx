"use client";

/**
 * The engine's disclaimer, shown verbatim as returned by the backend.
 *
 * Visible but unobtrusive: it sits below the results and in the page footer,
 * and is never paraphrased.
 */

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-line bg-canvas px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
      <span className="font-medium text-ink-muted">Note. </span>
      {text}
    </p>
  );
}
