"use client";

/**
 * Officer portal chrome: dark-green rail, compact top bar, content well.
 *
 * Every nav entry here goes to a screen that exists and does something. A
 * disabled-looking placeholder in a government tool teaches people not to
 * trust the navigation, so there are none.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ApiStatus } from "@/components/ApiStatus";
import { Wordmark } from "@/components/Brand";
import {
  BookIcon,
  ChartIcon,
  FileIcon,
  GaugeIcon,
  GridIcon,
  MapPinIcon,
  MegaphoneIcon,
  SearchIcon,
  WorksIcon,
} from "@/components/icons";
import { cx } from "@/components/ui";

interface NavEntry {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
}

const NAV: NavEntry[] = [
  { href: "/officer", label: "Dashboard", icon: <GridIcon className="h-[18px] w-[18px]" />, exact: true },
  { href: "/officer/works", label: "Works", icon: <WorksIcon className="h-[18px] w-[18px]" /> },
  { href: "/officer/map", label: "Risk Map", icon: <MapPinIcon className="h-[18px] w-[18px]" /> },
  { href: "/officer/documents", label: "Documents", icon: <FileIcon className="h-[18px] w-[18px]" /> },
  { href: "/officer/reports", label: "Citizen Reports", icon: <MegaphoneIcon className="h-[18px] w-[18px]" /> },
  { href: "/officer/rules", label: "Rule Catalogue", icon: <BookIcon className="h-[18px] w-[18px]" /> },
  { href: "/officer/console", label: "Engine Console", icon: <GaugeIcon className="h-[18px] w-[18px]" /> },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5 px-3" aria-label="Officer portal">
      {NAV.map((entry) => {
        const active = entry.exact ? pathname === entry.href : pathname.startsWith(entry.href);
        return (
          <Link
            key={entry.href}
            href={entry.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cx(
              "relative flex items-center gap-3 rounded-[var(--radius-field)] px-3 py-2 text-[13px] font-medium transition-colors duration-150",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
              active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/8 hover:text-white",
            )}
          >
            {active ? (
              <span
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-500"
                aria-hidden="true"
              />
            ) : null}
            <span className={active ? "text-accent-100" : "text-white/50"}>{entry.icon}</span>
            {entry.label}
          </Link>
        );
      })}
    </nav>
  );
}

function OfficerIdentity() {
  return (
    <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-[var(--radius-field)] bg-white/8 px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500 text-[12px] font-semibold text-white">
        AS
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[12.5px] font-medium text-white">A. Sharma</span>
        <span className="block truncate text-[11px] text-white/50">District Officer · demo</span>
      </span>
    </div>
  );
}

export function OfficerShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Rail — fixed on desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col bg-brand-800 lg:flex">
        <div className="px-4 py-4">
          <Wordmark href="/officer" tone="light" />
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto py-2">
          <NavList />
        </div>
        <OfficerIdentity />
      </aside>

      {/* Drawer — mobile */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-brand-900/50"
          />
          <aside className="animate-fade absolute inset-y-0 left-0 flex w-[264px] flex-col bg-brand-800">
            <div className="px-4 py-4">
              <Wordmark href="/officer" tone="light" />
            </div>
            <div className="thin-scroll flex-1 overflow-y-auto py-2">
              <NavList onNavigate={() => setDrawerOpen(false)} />
            </div>
            <OfficerIdentity />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[232px]">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="rounded-[var(--radius-field)] border border-line p-2 text-ink-muted lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[17px] font-semibold tracking-tight text-ink">{title}</h1>
              {subtitle ? (
                <p className="truncate text-[12.5px] text-ink-muted">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <Link
                href="/explore"
                className="hidden rounded-[var(--radius-field)] border border-line-strong px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors duration-150 hover:bg-sunken sm:inline-flex"
              >
                Citizen view
              </Link>
              <span className="hidden rounded-full border border-line bg-sunken px-3 py-1.5 md:inline-flex">
                <ApiStatus />
              </span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 lg:px-6 lg:py-6">{children}</main>
      </div>
    </div>
  );
}

/** Search field used above the works table and the reports list. */
export function ToolbarSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-[var(--radius-field)] border border-line bg-surface py-2 pl-9 pr-3 text-[12.5px] text-ink placeholder:text-ink-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

/** Icon-only re-export so pages can reuse the chart glyph in headers. */
export { ChartIcon };
