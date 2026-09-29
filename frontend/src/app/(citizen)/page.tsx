"use client";

/**
 * Citizen home.
 *
 * The first ten seconds have to say what this is: works near you, what state
 * they are in, and that you can say something about them. Everything below the
 * hero is real data from the engine's catalogue.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { HeroArt } from "@/components/HeroArt";
import { WorkCard } from "@/components/WorkCard";
import {
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
  MegaphoneIcon,
  SearchIcon,
  WorksIcon,
} from "@/components/icons";
import { Button, Card, SectionTitle, Skeleton, cx } from "@/components/ui";
import { formatCount } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { fetchCitizenStats, fetchWorks } from "@/services/api";

function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = value.trim();
        router.push(trimmed ? `/explore?search=${encodeURIComponent(trimmed)}` : "/explore");
      }}
      className="mt-6 flex w-full max-w-xl items-center gap-2 rounded-full border border-white/20 bg-white/95 p-1.5 shadow-[var(--shadow-panel)] backdrop-blur"
      role="search"
    >
      <label className="sr-only" htmlFor="hero-search">
        Enter your district, village or pincode
      </label>
      <SearchIcon className="ml-2.5 h-4 w-4 shrink-0 text-ink-subtle" />
      <input
        id="hero-search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Enter your district, village or pincode…"
        className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] text-ink placeholder:text-ink-subtle focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-brand-700 px-4 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <span className="hidden sm:inline">Search</span>
        <ArrowRightIcon className="h-4 w-4 sm:hidden" />
      </button>
    </form>
  );
}

function PublicStat({
  icon,
  value,
  label,
  loading,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-field)] bg-brand-50 text-brand-700">
        {icon}
      </span>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <p className="tabular text-[20px] font-semibold leading-none text-ink">{value}</p>
        )}
        <p className="mt-1 text-[12px] text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

export default function CitizenHome() {
  const stats = useAsync(() => fetchCitizenStats(), []);
  const recent = useAsync(() => fetchWorks({ sort: "id", limit: 6 }), []);

  const loadingStats = stats.state.kind !== "ready";
  const data = stats.state.kind === "ready" ? stats.state.data : null;

  return (
    <>
      {/* Hero — around 40% of the first viewport, never full-screen. */}
      <section className="relative isolate overflow-hidden">
        <HeroArt className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/60 to-brand-900/25"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1400px] px-4 py-14 sm:py-16 lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11.5px] font-medium text-white/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
            Public transparency portal · prototype
          </p>

          <h1 className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.15] tracking-tight text-white sm:text-[38px] lg:text-[44px]">
            MPLADS Works
            <br />
            in Your Area
          </h1>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-white/80 sm:text-[15px]">
            Explore development works, track their status and help ensure accountability.
          </p>

          <HeroSearch />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-field)] border border-white/25 bg-white/10 px-3.5 py-2 text-[13px] font-medium text-white backdrop-blur transition-colors duration-150 hover:bg-white/20"
            >
              <MapPinIcon className="h-4 w-4" />
              Browse the map
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/85 underline-offset-4 transition-colors duration-150 hover:text-white hover:underline"
            >
              See all works
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Public counters */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <PublicStat
            loading={loadingStats}
            icon={<WorksIcon className="h-5 w-5" />}
            value={data ? formatCount(data.total_works) : "—"}
            label="Works in this dataset"
          />
          <PublicStat
            loading={loadingStats}
            icon={<MapPinIcon className="h-5 w-5" />}
            value={data ? `${data.districts_covered}` : "—"}
            label="Districts covered"
          />
          <PublicStat
            loading={loadingStats}
            icon={<CheckIcon className="h-5 w-5" />}
            value={data ? `${data.completed_percentage}%` : "—"}
            label="Works completed"
          />
          <PublicStat
            loading={false}
            icon={<MegaphoneIcon className="h-5 w-5" />}
            value="Open for All"
            label="View. Verify. Report."
          />
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8">
        {/* How it works */}
        <section>
          <SectionTitle
            title="How this works"
            subtitle="Three steps, and the third one is yours."
          />
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Find a work near you",
                body: "Search by district, village or pincode, or open the map and look at what has been sanctioned around you.",
              },
              {
                step: "02",
                title: "See where it stands",
                body: "Every work shows its sanctioned amount, reported progress, expected completion and the documents on record.",
              },
              {
                step: "03",
                title: "Tell us what you see",
                body: "If what is on the ground does not match the record, report it. Your observation reaches the reviewing officer.",
              },
            ].map((item) => (
              <li key={item.step}>
                <Card className="h-full p-5">
                  <span className="tabular text-[12px] font-semibold text-accent-500">
                    {item.step}
                  </span>
                  <h3 className="mt-2 text-[14.5px] font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{item.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* Recent works */}
        <section className="mt-10">
          <SectionTitle
            title="Recently added works"
            subtitle="A sample from the register. Open any one to see its full record."
            action={
              <Link href="/explore">
                <Button variant="secondary" size="sm">
                  View all
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Button>
              </Link>
            }
          />

          {recent.state.kind === "loading" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Card key={index} className="p-4">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-2.5 w-2/3" />
                  <Skeleton className="mt-5 h-1.5 w-full" />
                </Card>
              ))}
            </div>
          ) : recent.state.kind === "error" ? (
            <Card className="p-5">
              <p className="text-[13px] text-ink-muted">{recent.state.error.message}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={recent.reload}>
                Try again
              </Button>
            </Card>
          ) : (
            <div className={cx("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", "animate-rise")}>
              {recent.state.data.works.map((work) => (
                <WorkCard key={work.work_id} work={work} showRisk={false} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
