/** Shared presentational primitives. Information containers, not decoration. */

import type { ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  /** Adds the hover lift used by cards that navigate somewhere. */
  interactive?: boolean;
}) {
  return (
    <section
      className={cx(
        "rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]",
        interactive &&
          "transition-shadow duration-200 hover:border-line-strong hover:shadow-[var(--shadow-raised)]",
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
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[14.5px] font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Section heading used where a full card would be too much furniture. */
export function SectionTitle({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-3 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium",
        tone ?? "border-line bg-sunken text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A field name quoted as evidence, rendered monospace so a reviewer can match
 * it against the record that produced the signal.
 */
export function FieldChip({ children }: { children: ReactNode }) {
  return (
    <code className="inline-flex items-center rounded-[var(--radius-field)] border border-brand-100 bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] text-brand-700">
      {children}
    </code>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-brand-700 text-white hover:bg-brand-500 disabled:bg-brand-700/40",
    secondary: "border border-line-strong bg-surface text-ink hover:bg-sunken",
    ghost: "text-ink-muted hover:bg-sunken hover:text-ink",
    danger: "border border-risk-critical-line bg-risk-critical-bg text-risk-critical hover:bg-risk-critical-bg/70",
  } as const;
  const sizes = {
    sm: "px-2.5 py-1.5 text-[12px]",
    md: "px-3.5 py-2 text-[13px]",
  } as const;

  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-field)] font-medium transition-colors duration-150 disabled:cursor-not-allowed",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        variants[variant],
        sizes[size],
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

/** A labelled figure. Used across both dashboards. */
export function Stat({
  label,
  value,
  caption,
  icon,
  iconTone,
  trend,
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  icon?: ReactNode;
  iconTone?: string;
  trend?: ReactNode;
  className?: string;
  /** Extra content below the caption, e.g. a progress bar. */
  children?: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">
            {label}
          </p>
          <div className="mt-1.5">{value}</div>
        </div>
        {icon ? (
          <span
            className={cx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-field)] border",
              iconTone ?? "border-brand-100 bg-brand-50 text-brand-700",
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
      {trend ?? null}
      {caption ? <p className="mt-1.5 text-[11.5px] text-ink-subtle">{caption}</p> : null}
      {children}
    </div>
  );
}

/** Two-column definition row, used on detail pages. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-[12.5px] text-ink-muted">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-ink">{children}</dd>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded bg-sunken", className)} aria-hidden="true" />;
}

/** The disclaimer, rendered verbatim. Never paraphrased in the client. */
export function Disclaimer({ text, className }: { text: string; className?: string }) {
  return (
    <p
      className={cx(
        "rounded-[var(--radius-card)] border border-line bg-sunken px-4 py-3 text-[11.5px] leading-relaxed text-ink-muted",
        className,
      )}
    >
      {text}
    </p>
  );
}
