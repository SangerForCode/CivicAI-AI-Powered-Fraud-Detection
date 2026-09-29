"use client";

/** Public-facing header. Low, white, and the same on every citizen page. */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Wordmark } from "@/components/Brand";
import { SearchIcon } from "@/components/icons";
import { cx } from "@/components/ui";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore Works" },
  { href: "/map", label: "Map View" },
  { href: "/explore?report=1", label: "Report an Issue" },
  { href: "/about", label: "About" },
];

export function CitizenHeader() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // An entry with a query string only lights up on an exact match, so
  // "Explore Works" and "Report an Issue" never highlight together.
  const isActive = (href: string) => {
    const [base, query] = href.split("?");
    if (query) return pathname + "?" + (params.toString() || "") === href;
    if (base === "/") return pathname === "/";
    return pathname.startsWith(base) && !params.has("report");
  };

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/explore?search=${encodeURIComponent(trimmed)}` : "/explore");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-2.5 lg:px-8">
        <Wordmark />

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Citizen portal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "rounded-[var(--radius-field)] px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
                isActive(item.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-muted hover:bg-sunken hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={search} className="ml-auto hidden min-w-0 md:block" role="search">
          <label className="sr-only" htmlFor="citizen-search">
            Search works
          </label>
          <div className="relative w-[clamp(11rem,22vw,20rem)]">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              id="citizen-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by district, village, work title…"
              className="w-full rounded-full border border-line bg-sunken py-2 pl-9 pr-3 text-[12.5px] text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </form>

        <Link
          href="/officer"
          className="ml-auto hidden shrink-0 rounded-[var(--radius-field)] border border-line-strong px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors duration-150 hover:bg-sunken md:ml-3 md:block"
        >
          Officer Login
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          className="ml-auto rounded-[var(--radius-field)] border border-line p-2 text-ink-muted lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d={menuOpen ? "M5 5l10 10M15 5L5 15" : "M3 6h14M3 10h14M3 14h14"}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {menuOpen ? (
        <div className="animate-fade border-t border-line bg-surface px-4 py-3 lg:hidden">
          <form onSubmit={search} className="mb-3" role="search">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by district, village, work title…"
                aria-label="Search works"
                className="w-full rounded-full border border-line bg-sunken py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:bg-surface focus:outline-none"
              />
            </div>
          </form>
          <nav className="grid gap-1" aria-label="Citizen portal">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cx(
                  "rounded-[var(--radius-field)] px-3 py-2 text-[13.5px] font-medium",
                  isActive(item.href) ? "bg-brand-50 text-brand-700" : "text-ink-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/officer"
              onClick={() => setMenuOpen(false)}
              className="mt-1 rounded-[var(--radius-field)] border border-line-strong px-3 py-2 text-[13.5px] font-medium text-ink"
            >
              Officer Login
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
