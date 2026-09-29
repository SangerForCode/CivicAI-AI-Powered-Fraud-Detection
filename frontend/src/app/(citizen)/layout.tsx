import { Suspense, type ReactNode } from "react";

import { CitizenHeader } from "@/components/CitizenHeader";
import { CitizenFooter } from "@/components/CitizenFooter";

export default function CitizenLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* The header reads search params to decide its active item, so it needs
          a boundary to prerender against. */}
      <Suspense fallback={<div className="h-[57px] border-b border-line bg-surface" />}>
        <CitizenHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
      <CitizenFooter />
    </div>
  );
}
