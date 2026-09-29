/**
 * Synthetic projects for exercising the engine.
 *
 * All data is invented. None of it refers to a real MPLADS work, and the
 * expected outcomes below are notes about what each case is designed to probe,
 * not predictions the UI relies on — the engine decides the score.
 */

import type { ProjectInput } from "@/types/assessment";

export interface ExampleProject {
  id: string;
  name: string;
  /** What this case is meant to demonstrate, shown in the picker. */
  note: string;
  input: ProjectInput;
}

export const EXAMPLE_PROJECTS: ExampleProject[] = [
  {
    id: "low-risk",
    name: "Normal low-risk project",
    note: "On schedule, expenditure proportionate to progress, full document set.",
    input: {
      project_id: "MPL-1001",
      project_name: "Village Road Construction",
      state: "Maharashtra",
      district: "Nanded",
      category: "road",
      sanctioned_amount: 2000000,
      amount_spent: 900000,
      completion_percentage: 48,
      planned_duration_days: 240,
      elapsed_days: 105,
      project_stage: "in_progress",
      documents: [
        "Sanction Order",
        "Work Order",
        "Estimate / BOQ",
        "Measurement Book",
        "Progress Report",
        "Site Photographs",
      ],
      days_since_last_update: 12,
    },
  },
  {
    id: "spend-ahead",
    name: "High expenditure relative to completion",
    note: "85% of funds utilised against 40% physical completion.",
    input: {
      project_id: "MPL-8842",
      project_name: "Community Water Tank",
      state: "Rajasthan",
      district: "Udaipur",
      category: "drinking_water",
      sanctioned_amount: 1000000,
      amount_spent: 850000,
      completion_percentage: 40,
      planned_duration_days: 180,
      elapsed_days: 120,
      project_stage: "in_progress",
      documents: ["Sanction Order", "Work Order", "Progress Report"],
      days_since_last_update: 20,
    },
  },
  {
    id: "over-sanction",
    name: "Expenditure above sanctioned amount",
    note: "Recorded expenditure exceeds the sanctioned ceiling.",
    input: {
      project_id: "MPL-4472",
      project_name: "Community Hall",
      state: "Odisha",
      district: "Cuttack",
      category: "community_asset",
      sanctioned_amount: 800000,
      amount_spent: 1150000,
      completion_percentage: 70,
      planned_duration_days: 200,
      elapsed_days: 190,
      project_stage: "in_progress",
      documents: ["Sanction Order", "Work Order", "Measurement Book"],
      days_since_last_update: 35,
    },
  },
  {
    id: "delayed",
    name: "Delayed project",
    note: "Far past its planned window, low progress, and no recent reporting.",
    input: {
      project_id: "MPL-7710",
      project_name: "Government School Building",
      state: "Bihar",
      district: "Patna",
      category: "education",
      sanctioned_amount: 2500000,
      amount_spent: 1600000,
      completion_percentage: 35,
      planned_duration_days: 270,
      elapsed_days: 620,
      project_stage: "in_progress",
      documents: ["Sanction Order", "Work Order"],
      days_since_last_update: 210,
    },
  },
  {
    id: "incomplete-data",
    name: "Incomplete-data project",
    note: "Only identification fields are known; most dimensions cannot be assessed.",
    input: {
      project_id: "MPL-3290",
      project_name: "Street Lighting",
      state: "Odisha",
      district: "Cuttack",
      category: "public_lighting",
    },
  },
];
