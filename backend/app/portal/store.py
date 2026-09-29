"""In-memory store for citizen reports.

Process-local and deliberately so: the brief for this prototype excludes a
database, and a report here is demo material rather than a record anyone should
rely on. Everything resets when the service restarts.

The store is seeded so the officer portal has something to show on first load,
and seeded specifically against works the engine already flagged — that is the
demo's whole argument: an independent citizen observation arriving on top of a
rule-based signal is worth more than either alone.
"""

from __future__ import annotations

import threading
from datetime import date, timedelta
from itertools import count

from app.engine.formatting import format_date
from app.portal.schemas import CitizenReport, CitizenReportCreate, IssueType

ISSUE_LABELS: dict[IssueType, str] = {
    IssueType.WORK_NOT_STARTED: "Work does not appear to have started",
    IssueType.WORK_STALLED: "Work appears to have stopped",
    IssueType.QUALITY_CONCERN: "Concern about quality of work",
    IssueType.INCOMPLETE_WORK: "Work recorded as done but appears incomplete",
    IssueType.NOT_AS_DESCRIBED: "Work on site differs from the description",
    IssueType.OTHER: "Other observation",
}

# Wording for seeded reports. Observational, non-accusatory: a citizen reports
# what they saw, and the platform must not put an allegation in their mouth.
_SEED_TEXTS: tuple[tuple[IssueType, str], ...] = (
    (
        IssueType.WORK_STALLED,
        "No work has been visible at this site for the last few months. Materials "
        "are lying at the location but no labour has been present when I have passed.",
    ),
    (
        IssueType.INCOMPLETE_WORK,
        "The notice board says the work is nearly finished, but only part of the "
        "stretch appears to have been done. The remaining section is unchanged.",
    ),
    (
        IssueType.WORK_NOT_STARTED,
        "A board was put up at this location some time ago but I have not seen any "
        "construction activity begin.",
    ),
    (
        IssueType.QUALITY_CONCERN,
        "The completed portion has developed cracks within a short period. Requesting "
        "that the site be inspected.",
    ),
    (
        IssueType.NOT_AS_DESCRIBED,
        "The facility described in the record does not match what is present at this "
        "location. Requesting verification of the site details.",
    ),
)

_AREAS: tuple[str, ...] = (
    "Resident, ward 3", "Resident, nearby village", "Local shopkeeper",
    "Resident, adjoining colony", "Daily commuter on this route",
)


class ReportStore:
    """Thread-safe because uvicorn may serve requests from a worker pool."""

    def __init__(self) -> None:
        self._by_work: dict[str, list[CitizenReport]] = {}
        self._ids = count(1)
        self._lock = threading.Lock()

    def seed(self, work_ids: list[str], today: date) -> None:
        """Attach a deterministic spread of reports to the given works."""
        with self._lock:
            for position, work_id in enumerate(work_ids):
                # One to three reports each, varying by position so the demo
                # shows a single observation and a corroborated cluster.
                how_many = 1 + (position % 3)
                for offset in range(how_many):
                    issue, text = _SEED_TEXTS[(position + offset) % len(_SEED_TEXTS)]
                    submitted = today - timedelta(days=6 + (position * 3 + offset * 5) % 55)
                    report_id = f"CR-{next(self._ids):04d}"
                    self._by_work.setdefault(work_id, []).append(
                        CitizenReport(
                            report_id=report_id,
                            work_id=work_id,
                            issue_type=issue,
                            issue_label=ISSUE_LABELS[issue],
                            description=text,
                            submitted_on=submitted,
                            submitted_on_formatted=format_date(submitted),
                            has_photo=(position + offset) % 2 == 0,
                            reporter_area=_AREAS[(position + offset) % len(_AREAS)],
                            status="acknowledged" if offset == 0 else "received",
                        )
                    )

    def for_work(self, work_id: str) -> list[CitizenReport]:
        with self._lock:
            reports = list(self._by_work.get(work_id, ()))
        # Newest first — the officer wants the latest observation.
        return sorted(reports, key=lambda report: report.submitted_on, reverse=True)

    def count_for(self, work_id: str) -> int:
        with self._lock:
            return len(self._by_work.get(work_id, ()))

    def counts(self) -> dict[str, int]:
        with self._lock:
            return {work_id: len(reports) for work_id, reports in self._by_work.items()}

    def recent(self, limit: int = 10) -> list[CitizenReport]:
        with self._lock:
            everything = [report for reports in self._by_work.values() for report in reports]
        everything.sort(key=lambda report: (report.submitted_on, report.report_id), reverse=True)
        return everything[:limit]

    def add(self, work_id: str, payload: CitizenReportCreate, today: date) -> CitizenReport:
        with self._lock:
            report = CitizenReport(
                report_id=f"CR-{next(self._ids):04d}",
                work_id=work_id,
                issue_type=payload.issue_type,
                issue_label=ISSUE_LABELS[payload.issue_type],
                description=payload.description.strip(),
                submitted_on=today,
                submitted_on_formatted=format_date(today),
                has_photo=payload.has_photo,
                reporter_area=payload.reporter_area,
                status="received",
            )
            self._by_work.setdefault(work_id, []).append(report)
            return report

    def total(self) -> int:
        with self._lock:
            return sum(len(reports) for reports in self._by_work.values())


store = ReportStore()
