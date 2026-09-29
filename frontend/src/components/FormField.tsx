"use client";

import type { ReactNode } from "react";

import { cx } from "@/components/ui";

const CONTROL_CLASSES =
  "w-full rounded-md border bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle " +
  "focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600";

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[12.5px] font-medium text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-[12px] text-risk-critical">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[12px] text-ink-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={cx(
        CONTROL_CLASSES,
        invalid ? "border-risk-critical" : "border-line-strong",
        className,
      )}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={cx(
        CONTROL_CLASSES,
        invalid ? "border-risk-critical" : "border-line-strong",
        className,
      )}
    >
      {children}
    </select>
  );
}
