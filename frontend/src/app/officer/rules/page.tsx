"use client";

/** The rule catalogue, served read-only from the engine. */

import { OfficerShell } from "@/components/OfficerShell";
import { RuleCatalogue } from "@/components/RuleCatalogue";

export default function OfficerRulesPage() {
  return (
    <OfficerShell
      title="Rule Catalogue"
      subtitle="Every check the engine can run, and the inputs each one needs."
    >
      <RuleCatalogue />
    </OfficerShell>
  );
}
