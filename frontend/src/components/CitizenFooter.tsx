/** Public footer. Carries the standing disclaimer on every citizen page. */

import Link from "next/link";

import { Wordmark } from "@/components/Brand";

const LINKS = [
  { href: "/explore", label: "Explore Works" },
  { href: "/map", label: "Map View" },
  { href: "/about", label: "About" },
  { href: "/officer", label: "Officer Portal" },
];

export function CitizenFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Wordmark href={undefined} />
            <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
              A transparency platform for works funded under the Members of Parliament Local Area
              Development Scheme. Explore what has been sanctioned near you, follow its progress,
              and tell the authorities what you see on the ground.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid gap-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12.5px] text-ink-muted transition-colors duration-150 hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-7 space-y-2 border-t border-line pt-5">
          <p className="text-[11.5px] leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">Prototype.</span> Built for Smart India
            Hackathon 2026. All works, locations, agencies and reports shown are synthetic
            demonstration data and do not describe any real MPLADS work or person.
          </p>
          <p className="text-[11.5px] leading-relaxed text-ink-subtle">
            Risk scores are decision-support signals routed for authorised human review. They are
            not findings of fraud, and no automated determination is made about any work, person or
            organisation.
          </p>
        </div>
      </div>
    </footer>
  );
}
