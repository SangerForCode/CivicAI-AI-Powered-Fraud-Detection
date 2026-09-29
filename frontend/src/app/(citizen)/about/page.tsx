/** What the platform is, what it does not do, and how to read a risk score. */

import Link from "next/link";

import { Card, SectionTitle } from "@/components/ui";

export const metadata = {
  title: "About — MPLADS Sentinel",
  description:
    "What MPLADS Sentinel does, how its risk scoring works, and the limits of what it can tell you.",
};

const FAQ = [
  {
    question: "What is MPLADS?",
    answer:
      "The Members of Parliament Local Area Development Scheme lets each Member of Parliament recommend development works in their constituency — roads, drinking water, school buildings, community assets and similar local infrastructure. The works are executed by district authorities and implementing agencies.",
  },
  {
    question: "What does this platform do?",
    answer:
      "It puts the register of works in front of the people those works are for, and it runs a rule-based check over each record to surface the ones whose paperwork does not add up. Officers get a prioritised queue; citizens get a way to say what is actually happening on the ground.",
  },
  {
    question: "What does a risk score mean?",
    answer:
      "It means the record for that work has one or more patterns worth checking — expenditure that has run ahead of reported progress, a deadline that has passed, documents that are not on file, or reporting that has gone quiet. It is a prompt for a human to look. It is not a finding of wrongdoing, and it says nothing about any person.",
  },
  {
    question: "How is the score calculated?",
    answer:
      "Seventeen rules across four dimensions — financial, timeline, documentation and reporting recency. Each rule states which fields it needs and only runs when they are present. A dimension with missing inputs is reported as unassessable rather than scored as zero, and the overall score is rescaled over the weight that could actually be assessed.",
  },
  {
    question: "What happens to a report I submit?",
    answer:
      "It is attached to that work and shown to the reviewing officer alongside the official record. It does not change the risk score. Where an observation lines up with something the rules already flagged, the officer sees that the two agree — which is more useful than either on its own.",
  },
  {
    question: "Is the data on this site real?",
    answer:
      "No. Every work, location, agency, representative and citizen report shown here is synthetic data generated for demonstration. The scoring engine behind it is real and runs on every record you see, but the records themselves are fabricated.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[840px] px-4 py-10 lg:px-8">
      <p className="text-[12px] font-medium uppercase tracking-wide text-accent-600">About</p>
      <h1 className="mt-1.5 text-[28px] font-semibold leading-tight tracking-tight text-ink">
        Public money, in public view
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
        MPLADS Sentinel brings together two things that usually sit apart: the official record of a
        development work, and what people living beside it can see. The platform checks the first
        for internal inconsistencies, collects the second from the public, and puts both in front of
        the officer who can act.
      </p>

      <section className="mt-9">
        <SectionTitle title="What it will not do" />
        <Card className="p-5">
          <ul className="space-y-2.5 text-[13px] leading-relaxed text-ink-muted">
            <li>
              <span className="font-medium text-ink">It does not allege fraud.</span> A risk signal
              says a record is inconsistent. Records are inconsistent for many ordinary reasons —
              delayed paperwork, a revised sanction, a site engineer on leave.
            </li>
            <li>
              <span className="font-medium text-ink">It does not decide anything.</span> Every
              output is routed to a person. No work is stopped, no payment held and no conclusion
              reached by this system.
            </li>
            <li>
              <span className="font-medium text-ink">It does not fill in blanks.</span> Where the
              record is missing a figure, the platform says so. Unknown is never treated as zero,
              because a work nobody has reported on is not the same as a work with nothing to
              report.
            </li>
            <li>
              <span className="font-medium text-ink">It does not score people.</span> Scores attach
              to records of works, never to officials, agencies or representatives.
            </li>
          </ul>
        </Card>
      </section>

      <section className="mt-9">
        <SectionTitle title="Common questions" />
        <div className="space-y-3">
          {FAQ.map((item) => (
            <Card key={item.question} className="p-5">
              <h3 className="text-[14px] font-semibold text-ink">{item.question}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{item.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <Card className="bg-brand-50 p-5">
          <h2 className="text-[15px] font-semibold text-ink">Start with your district</h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
            Search the register for works near you, or open the map and look around.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/explore"
              className="rounded-[var(--radius-field)] bg-brand-700 px-3.5 py-2 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-brand-500"
            >
              Explore works
            </Link>
            <Link
              href="/map"
              className="rounded-[var(--radius-field)] border border-line-strong bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition-colors duration-150 hover:bg-sunken"
            >
              Open the map
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
