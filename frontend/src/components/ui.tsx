/** Small shared presentational pieces used across the console. */

import type { ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[10px] border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** A small pill. `tone` carries the semantic colouring classes. */
export function Badge({
  children,
  tone,
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium",
        tone ?? "border-line bg-canvas text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A field name quoted as evidence. Rendered monospace so a reviewer can match
 * it against the form input that produced the signal.
 */
export function FieldChip({ children }: { children: ReactNode }) {
  return (
    <code className="inline-flex items-center rounded border border-accent-600/25 bg-accent-50 px-1.5 py-0.5 font-mono text-[11.5px] text-accent-700">
      {children}
    </code>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary:
      "bg-brand-700 text-white hover:bg-brand-600 disabled:bg-brand-700/40 disabled:cursor-not-allowed",
    secondary:
      "border border-line-strong bg-surface text-ink hover:bg-canvas disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "text-ink-muted hover:text-ink hover:bg-canvas",
  } as const;

  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cx("animate-spin", className)}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path
        d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
