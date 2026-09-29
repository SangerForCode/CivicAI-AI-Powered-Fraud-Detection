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
        "rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]",
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
    <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4.5">
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
        tone ?? "border-line bg-surface-sunken text-ink-muted",
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
    <code className="inline-flex items-center rounded-md border border-accent-600/25 bg-accent-50 px-1.5 py-0.5 font-mono text-[11.5px] text-accent-700">
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
      "bg-brand-700 text-white shadow-[0_6px_16px_-10px_rgba(8,38,28,0.9)] hover:bg-brand-600 disabled:bg-brand-700/40 disabled:cursor-not-allowed",
    secondary:
      "border border-line-strong bg-surface text-ink hover:bg-surface-sunken disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "text-ink-muted hover:text-ink hover:bg-surface-sunken",
  } as const;

  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
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

/**
 * The soft outer container the console's main column sits in — the large
 * curvature that defines the layout.
 */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius-panel)] border border-line bg-surface shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A headline figure with an icon tile, as used in the summary strip. */
export function StatCard({
  label,
  value,
  caption,
  icon,
  iconTone,
  children,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  icon: ReactNode;
  /** Border + tint + text classes for the icon tile. */
  iconTone?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            {label}
          </p>
          <div className="mt-1.5">{value}</div>
        </div>
        <span
          className={cx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
            iconTone ?? "border-brand-100 bg-brand-50 text-brand-700",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      {caption ? <div className="mt-2 text-[11.5px] text-ink-subtle">{caption}</div> : null}
      {children}
    </div>
  );
}
