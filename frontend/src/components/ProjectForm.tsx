"use client";

/**
 * The project entry form.
 *
 * Two rules govern this component:
 *
 * 1. A blank field is *omitted* from the request, never sent as `0` or `""`.
 *    The engine distinguishes unknown from zero, and flattening that here
 *    would silently turn "we don't know" into "nothing was spent".
 * 2. Validation is shape-only — required id, numeric ranges. No threshold, no
 *    scoring, no risk judgement happens on this side of the wire.
 */

import { useState } from "react";

import { DocumentChecklist } from "@/components/DocumentChecklist";
import { FormField, Select, TextInput } from "@/components/FormField";
import { Button, Card, CardHeader, Spinner } from "@/components/ui";
import { EXAMPLE_PROJECTS, type ExampleProject } from "@/lib/examples";
import { CATEGORY_LABELS, STAGE_LABELS } from "@/lib/format";
import type { Category, ProjectInput, ProjectStage } from "@/types/assessment";

/** Form state is all strings: an empty string is the UI's representation of "unknown". */
interface FormState {
  project_id: string;
  project_name: string;
  state: string;
  district: string;
  category: string;
  sanctioned_amount: string;
  amount_spent: string;
  completion_percentage: string;
  planned_duration_days: string;
  elapsed_days: string;
  project_stage: string;
  days_since_last_update: string;
  /** null means the document set is unknown; an array means it is on record. */
  documents: string[] | null;
}

export const EMPTY_FORM: FormState = {
  project_id: "",
  project_name: "",
  state: "",
  district: "",
  category: "",
  sanctioned_amount: "",
  amount_spent: "",
  completion_percentage: "",
  planned_duration_days: "",
  elapsed_days: "",
  project_stage: "",
  days_since_last_update: "",
  documents: null,
};

export type FieldErrors = Partial<Record<keyof FormState, string>>;

function exampleToForm(example: ExampleProject): FormState {
  const input = example.input;
  const text = (value: string | undefined) => value ?? "";
  const num = (value: number | undefined) => (value === undefined ? "" : String(value));

  return {
    project_id: input.project_id,
    project_name: text(input.project_name),
    state: text(input.state),
    district: text(input.district),
    category: text(input.category),
    sanctioned_amount: num(input.sanctioned_amount),
    amount_spent: num(input.amount_spent),
    completion_percentage: num(input.completion_percentage),
    planned_duration_days: num(input.planned_duration_days),
    elapsed_days: num(input.elapsed_days),
    project_stage: text(input.project_stage),
    days_since_last_update: num(input.days_since_last_update),
    documents: input.documents ?? null,
  };
}

/** Shape validation only. Anything score-related belongs to the engine. */
export function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.project_id.trim()) {
    errors.project_id = "Project ID is required.";
  }

  const numeric: [keyof FormState, { min?: number; max?: number; integer?: boolean; label: string }][] = [
    ["sanctioned_amount", { min: 0, label: "Sanctioned amount" }],
    ["amount_spent", { min: 0, label: "Amount spent" }],
    ["completion_percentage", { min: 0, max: 100, label: "Completion" }],
    ["planned_duration_days", { min: 1, integer: true, label: "Planned duration" }],
    ["elapsed_days", { min: 0, integer: true, label: "Elapsed days" }],
    ["days_since_last_update", { min: 0, integer: true, label: "Days since update" }],
  ];

  for (const [key, rule] of numeric) {
    const raw = form[key] as string;
    if (raw.trim() === "") continue; // blank stays unknown, which is valid

    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errors[key] = `${rule.label} must be a number.`;
      continue;
    }
    if (rule.integer && !Number.isInteger(value)) {
      errors[key] = `${rule.label} must be a whole number of days.`;
      continue;
    }
    if (rule.min !== undefined && value < rule.min) {
      errors[key] = `${rule.label} must be ${rule.min} or more.`;
      continue;
    }
    if (rule.max !== undefined && value > rule.max) {
      errors[key] = `${rule.label} must be ${rule.max} or less.`;
    }
  }

  return errors;
}

/**
 * Build the request body, omitting every blank field.
 *
 * This is the single point where "blank" becomes "absent". Keys are only added
 * when the user actually supplied something.
 */
export function toProjectInput(form: FormState): ProjectInput {
  const input: ProjectInput = { project_id: form.project_id.trim() };

  const addText = (key: "project_name" | "state" | "district", value: string) => {
    if (value.trim()) input[key] = value.trim();
  };
  addText("project_name", form.project_name);
  addText("state", form.state);
  addText("district", form.district);

  if (form.category) input.category = form.category as Category;
  if (form.project_stage) input.project_stage = form.project_stage as ProjectStage;

  const addNumber = (
    key: "sanctioned_amount" | "amount_spent" | "completion_percentage" |
      "planned_duration_days" | "elapsed_days" | "days_since_last_update",
    raw: string,
  ) => {
    if (raw.trim() === "") return;
    const value = Number(raw);
    if (Number.isFinite(value)) input[key] = value;
  };
  addNumber("sanctioned_amount", form.sanctioned_amount);
  addNumber("amount_spent", form.amount_spent);
  addNumber("completion_percentage", form.completion_percentage);
  addNumber("planned_duration_days", form.planned_duration_days);
  addNumber("elapsed_days", form.elapsed_days);
  addNumber("days_since_last_update", form.days_since_last_update);

  // null stays absent (unknown); [] is sent (known to be empty).
  if (form.documents !== null) input.documents = form.documents;

  return input;
}

export function ProjectForm({
  form,
  onFormChange,
  errors,
  onSubmit,
  onReset,
  submitting,
}: {
  form: FormState;
  onFormChange: (form: FormState) => void;
  errors: FieldErrors;
  onSubmit: () => void;
  onReset: () => void;
  submitting: boolean;
}) {
  const [exampleMenuOpen, setExampleMenuOpen] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    onFormChange({ ...form, [key]: value });

  return (
    <Card>
      <CardHeader
        title="Project Assessment"
        subtitle="Enter a synthetic project, then submit it to the scoring engine."
        action={
          <div className="relative">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setExampleMenuOpen((open) => !open)}
              aria-expanded={exampleMenuOpen}
              aria-haspopup="menu"
            >
              Load Example
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </Button>
            {exampleMenuOpen ? (
              <>
                {/* Click-away layer, so the menu closes without a global listener. */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExampleMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1.5 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-raised)]"
                >
                  {EXAMPLE_PROJECTS.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onFormChange(exampleToForm(example));
                        setExampleMenuOpen(false);
                      }}
                      className="block w-full border-b border-line px-4 py-2.5 text-left last:border-b-0 hover:bg-surface-sunken"
                    >
                      <span className="block text-[13px] font-medium text-ink">{example.name}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">
                        {example.note}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        noValidate
      >
        <div className="space-y-6 px-5 py-5">
          <Fieldset legend="Identification">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Project ID" htmlFor="project_id" error={errors.project_id}>
                <TextInput
                  id="project_id"
                  value={form.project_id}
                  placeholder="MPL-1001"
                  invalid={Boolean(errors.project_id)}
                  onChange={(e) => set("project_id", e.target.value)}
                />
              </FormField>
              <FormField label="Project Name" htmlFor="project_name">
                <TextInput
                  id="project_name"
                  value={form.project_name}
                  placeholder="Village Road Construction"
                  onChange={(e) => set("project_name", e.target.value)}
                />
              </FormField>
              <FormField label="State" htmlFor="state">
                <TextInput
                  id="state"
                  value={form.state}
                  placeholder="Maharashtra"
                  onChange={(e) => set("state", e.target.value)}
                />
              </FormField>
              <FormField label="District" htmlFor="district">
                <TextInput
                  id="district"
                  value={form.district}
                  placeholder="Nanded"
                  onChange={(e) => set("district", e.target.value)}
                />
              </FormField>
              <FormField label="Category" htmlFor="category">
                <Select
                  id="category"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  <option value="">Not specified</option>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Project Stage" htmlFor="project_stage">
                <Select
                  id="project_stage"
                  value={form.project_stage}
                  onChange={(e) => set("project_stage", e.target.value)}
                >
                  <option value="">Not specified</option>
                  {Object.entries(STAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </Fieldset>

          <Fieldset legend="Financial">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Sanctioned Amount (₹)"
                htmlFor="sanctioned_amount"
                error={errors.sanctioned_amount}
              >
                <TextInput
                  id="sanctioned_amount"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  className="tabular"
                  value={form.sanctioned_amount}
                  placeholder="Unknown"
                  invalid={Boolean(errors.sanctioned_amount)}
                  onChange={(e) => set("sanctioned_amount", e.target.value)}
                />
              </FormField>
              <FormField
                label="Amount Spent (₹)"
                htmlFor="amount_spent"
                error={errors.amount_spent}
              >
                <TextInput
                  id="amount_spent"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  className="tabular"
                  value={form.amount_spent}
                  placeholder="Unknown"
                  invalid={Boolean(errors.amount_spent)}
                  onChange={(e) => set("amount_spent", e.target.value)}
                />
              </FormField>
              <FormField
                label="Completion (%)"
                htmlFor="completion_percentage"
                error={errors.completion_percentage}
              >
                <TextInput
                  id="completion_percentage"
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  inputMode="numeric"
                  className="tabular"
                  value={form.completion_percentage}
                  placeholder="Unknown"
                  invalid={Boolean(errors.completion_percentage)}
                  onChange={(e) => set("completion_percentage", e.target.value)}
                />
              </FormField>
            </div>
          </Fieldset>

          <Fieldset legend="Timeline">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Planned Duration (days)"
                htmlFor="planned_duration_days"
                error={errors.planned_duration_days}
              >
                <TextInput
                  id="planned_duration_days"
                  type="number"
                  min={1}
                  step="1"
                  inputMode="numeric"
                  className="tabular"
                  value={form.planned_duration_days}
                  placeholder="Unknown"
                  invalid={Boolean(errors.planned_duration_days)}
                  onChange={(e) => set("planned_duration_days", e.target.value)}
                />
              </FormField>
              <FormField label="Elapsed Days" htmlFor="elapsed_days" error={errors.elapsed_days}>
                <TextInput
                  id="elapsed_days"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  className="tabular"
                  value={form.elapsed_days}
                  placeholder="Unknown"
                  invalid={Boolean(errors.elapsed_days)}
                  onChange={(e) => set("elapsed_days", e.target.value)}
                />
              </FormField>
              <FormField
                label="Days Since Last Update"
                htmlFor="days_since_last_update"
                error={errors.days_since_last_update}
                hint="Leave blank if unknown."
              >
                <TextInput
                  id="days_since_last_update"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  className="tabular"
                  value={form.days_since_last_update}
                  placeholder="Unknown"
                  invalid={Boolean(errors.days_since_last_update)}
                  onChange={(e) => set("days_since_last_update", e.target.value)}
                />
              </FormField>
            </div>
          </Fieldset>

          <Fieldset legend="Documents">
            <DocumentChecklist
              value={form.documents}
              onChange={(documents) => set("documents", documents)}
            />
          </Fieldset>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-sunken/60 px-5 py-4">
          <p className="text-[12px] text-ink-subtle">
            Blank fields are submitted as unknown, not as zero.
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onReset} disabled={submitting}>
              Reset
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  Assessing…
                </>
              ) : (
                "Assess Risk"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

export type { FormState };
