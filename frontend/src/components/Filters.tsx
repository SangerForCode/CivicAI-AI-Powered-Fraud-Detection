"use client";

/** Filter controls shared by the citizen explorer and the officer works table. */

import { FilterIcon } from "@/components/icons";
import { Button, cx } from "@/components/ui";
import type { FilterOptions } from "@/types/portal";

export interface FilterValues {
  search: string;
  state: string;
  district: string;
  category: string;
  stage: string;
  risk_level: string;
  review_status: string;
}

export const EMPTY_FILTERS: FilterValues = {
  search: "",
  state: "",
  district: "",
  category: "",
  stage: "",
  risk_level: "",
  review_status: "",
};

export function countActive(values: FilterValues): number {
  return Object.values(values).filter(Boolean).length;
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--radius-field)] border border-line bg-surface px-2.5 py-2 text-[12.5px] text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        {children}
      </select>
    </label>
  );
}

export function FilterBar({
  values,
  onChange,
  options,
  showRisk = true,
  showReviewStatus = false,
  className,
}: {
  values: FilterValues;
  onChange: (next: FilterValues) => void;
  options: FilterOptions | null;
  showRisk?: boolean;
  showReviewStatus?: boolean;
  className?: string;
}) {
  const set = (patch: Partial<FilterValues>) => onChange({ ...values, ...patch });
  const districts = values.state ? (options?.districts[values.state] ?? []) : [];
  const active = countActive(values);

  return (
    <div
      className={cx(
        "rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
          <FilterIcon className="h-4 w-4 text-ink-subtle" />
          Filters
          {active > 0 ? (
            <span className="tabular rounded-full bg-brand-50 px-1.5 text-[11px] text-brand-700">
              {active}
            </span>
          ) : null}
        </span>
        {active > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
            Clear all
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="State"
          value={values.state}
          // Changing state invalidates the district below it.
          onChange={(state) => set({ state, district: "" })}
        >
          <option value="">All states</option>
          {options?.states.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>

        <Select label="District" value={values.district} onChange={(district) => set({ district })}>
          <option value="">{values.state ? "All districts" : "Select a state first"}</option>
          {districts.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>

        <Select label="Category" value={values.category} onChange={(category) => set({ category })}>
          <option value="">All categories</option>
          {options?.categories.map((bucket) => (
            <option key={bucket.key} value={bucket.key}>
              {bucket.label} ({bucket.count})
            </option>
          ))}
        </Select>

        <Select label="Status" value={values.stage} onChange={(stage) => set({ stage })}>
          <option value="">Any status</option>
          {options?.stages.map((bucket) => (
            <option key={bucket.key} value={bucket.key}>
              {bucket.label} ({bucket.count})
            </option>
          ))}
        </Select>

        {showRisk ? (
          <Select
            label="Risk level"
            value={values.risk_level}
            onChange={(risk_level) => set({ risk_level })}
          >
            <option value="">Any risk level</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        ) : null}

        {showReviewStatus ? (
          <Select
            label="Review status"
            value={values.review_status}
            onChange={(review_status) => set({ review_status })}
          >
            <option value="">Any review status</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="flagged">Flagged</option>
            <option value="completed">Completed</option>
          </Select>
        ) : null}
      </div>
    </div>
  );
}
