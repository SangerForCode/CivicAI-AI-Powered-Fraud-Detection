"use client";

/**
 * Document entry.
 *
 * The three-state distinction matters to the engine and is surfaced directly:
 *
 * - `null`  — the document set is unknown, so the documentation dimension
 *             cannot be assessed.
 * - `[]`    — known to be empty, which is a finding in its own right.
 * - `[...]` — the documents on record.
 */

import { useState } from "react";

import { Button, cx } from "@/components/ui";

const KNOWN_DOCUMENTS = [
  "Sanction Order",
  "Work Order",
  "Estimate / BOQ",
  "Measurement Book",
  "Progress Report",
  "Site Photographs",
  "Completion Certificate",
  "Utilisation Certificate",
  "Audit Report",
] as const;

export function DocumentChecklist({
  value,
  onChange,
}: {
  value: string[] | null;
  onChange: (value: string[] | null) => void;
}) {
  const [customDocument, setCustomDocument] = useState("");
  const known = value === null ? null : value;

  const toggle = (name: string) => {
    const current = known ?? [];
    onChange(
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  };

  const addCustom = () => {
    const name = customDocument.trim();
    if (!name) return;
    const current = known ?? [];
    if (!current.some((item) => item.toLowerCase() === name.toLowerCase())) {
      onChange([...current, name]);
    }
    setCustomDocument("");
  };

  const extras = (known ?? []).filter(
    (name) => !KNOWN_DOCUMENTS.some((doc) => doc === name),
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ModeButton active={value === null} onClick={() => onChange(null)}>
          Unknown
        </ModeButton>
        <ModeButton active={value !== null} onClick={() => onChange(value ?? [])}>
          On record
        </ModeButton>
        {value !== null ? (
          <span className="text-[12px] text-ink-subtle">
            {value.length === 0
              ? "Recorded as having no documents."
              : `${value.length} document${value.length === 1 ? "" : "s"} selected.`}
          </span>
        ) : (
          <span className="text-[12px] text-ink-subtle">
            The documentation dimension will not be assessed.
          </span>
        )}
      </div>

      {value !== null ? (
        <>
          <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {KNOWN_DOCUMENTS.map((name) => {
              const id = `doc-${name.replace(/\W+/g, "-").toLowerCase()}`;
              return (
                <label key={name} htmlFor={id} className="flex items-center gap-2 text-[13px] text-ink">
                  <input
                    id={id}
                    type="checkbox"
                    checked={(known ?? []).includes(name)}
                    onChange={() => toggle(name)}
                    className="h-3.5 w-3.5 rounded border-line-strong text-brand-700 focus:ring-brand-600/25"
                  />
                  {name}
                </label>
              );
            })}
          </div>

          {extras.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {extras.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[12px] text-ink"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => toggle(name)}
                    aria-label={`Remove ${name}`}
                    className="text-ink-subtle hover:text-ink"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex gap-2">
            <input
              value={customDocument}
              onChange={(e) => setCustomDocument(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Add another document name"
              className="flex-1 rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/25"
            />
            <Button type="button" variant="secondary" onClick={addCustom}>
              Add
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
        active
          ? "border-brand-700 bg-brand-50 text-brand-700"
          : "border-line-strong bg-surface text-ink-muted hover:bg-canvas",
      )}
    >
      {children}
    </button>
  );
}
