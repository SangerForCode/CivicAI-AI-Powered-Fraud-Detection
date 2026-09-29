"""The synthetic works catalogue behind both portals.

Everything in here is fabricated demo data. No real MPLADS record, constituency
representative, agency or citizen appears in it; village names are invented and
the representative field is a placeholder rather than any person's name. That
matters because the platform attaches risk scores to records, and a risk score
against a real name would be a claim this system has no basis to make.

The catalogue is generated from a fixed seed, so the same dataset appears on
every run, and materialised against the current date at import so the demo
always looks current. Risk is *not* assigned: each record is built with a
plausible shape and then scored by ``app.engine.scoring.assess``. The dashboard
counts are real aggregates over those engine outputs.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from functools import lru_cache

from app.engine.formatting import format_date, format_duration, format_inr, humanise_days
from app.engine.scoring import assess
from app.portal.geography import DISTRICTS, District
from app.portal.schemas import (
    DocumentStatus,
    Milestone,
    MilestoneStatus,
    Money,
    Duration,
    ReviewStatus,
    WorkDocument,
    WorkSummary,
)
from app.schemas import Category, ProjectInput, ProjectStage, RiskAssessment

SEED = 20260930
TARGET_WORKS = 1_420

DATA_DISCLAIMER = (
    "Synthetic demonstration data. Works, locations, agencies and reports are "
    "fabricated for evaluation of the risk engine and do not describe any real "
    "MPLADS work or person."
)

# Short operator-facing labels for a triggered rule, for table "key flag" cells.
FLAG_LABELS: dict[str, str] = {
    "FIN-001": "Cost deviation",
    "FIN-002": "Spend ahead of progress",
    "FIN-003": "Near-full utilisation",
    "FIN-004": "Underspend at completion",
    "FIN-005": "Spend without progress",
    "TIM-001": "Delay",
    "TIM-002": "Severe delay",
    "TIM-003": "Behind schedule",
    "TIM-004": "Recorded abandoned",
    "DOC-001": "Sanction order missing",
    "DOC-002": "Utilisation certificate missing",
    "DOC-003": "Completion certificate missing",
    "DOC-004": "Progress records missing",
    "DOC-005": "No documents on record",
    "STL-001": "Stale reporting",
    "STL-002": "Stale reporting",
    "STL-003": "Update overdue",
}

CATEGORY_LABELS: dict[Category, str] = {
    Category.ROAD: "Roads",
    Category.DRINKING_WATER: "Drinking Water",
    Category.SANITATION: "Sanitation",
    Category.EDUCATION: "Education",
    Category.HEALTH: "Health",
    Category.COMMUNITY_ASSET: "Community Assets",
    Category.PUBLIC_LIGHTING: "Public Lighting",
    Category.SPORTS: "Sports",
    Category.OTHER: "Other",
}

STAGE_LABELS: dict[ProjectStage, str] = {
    ProjectStage.RECOMMENDED: "Recommended",
    ProjectStage.SANCTIONED: "Sanctioned",
    ProjectStage.IN_PROGRESS: "In Progress",
    ProjectStage.COMPLETED: "Completed",
    ProjectStage.ABANDONED: "Abandoned",
}

REVIEW_STATUS_LABELS: dict[ReviewStatus, str] = {
    ReviewStatus.OPEN: "Open",
    ReviewStatus.UNDER_REVIEW: "Under Review",
    ReviewStatus.COMPLETED: "Completed",
    ReviewStatus.FLAGGED: "Flagged",
}

# Title templates per category. ``{place}`` is an invented village or ward.
TITLES: dict[Category, tuple[str, ...]] = {
    Category.ROAD: (
        "Village Road Construction, {place}",
        "Approach Road to {place}",
        "Cement Concrete Road, {place}",
        "Road Widening Works, {place}",
    ),
    Category.DRINKING_WATER: (
        "Community Water Tank, {place}",
        "Borewell and Pipeline, {place}",
        "Drinking Water Supply Scheme, {place}",
        "Overhead Reservoir, {place}",
    ),
    Category.SANITATION: (
        "Community Sanitation Complex, {place}",
        "Drainage Works, {place}",
        "Solid Waste Shed, {place}",
    ),
    Category.EDUCATION: (
        "School Building Extension, {place}",
        "Anganwadi Centre, {place}",
        "Village Library Building, {place}",
        "School Boundary Wall, {place}",
    ),
    Category.HEALTH: (
        "Primary Health Sub-Centre, {place}",
        "Health Centre Ward Block, {place}",
        "Ambulance Shed, {place}",
    ),
    Category.COMMUNITY_ASSET: (
        "Community Hall, {place}",
        "Panchayat Bhawan, {place}",
        "Multipurpose Shelter, {place}",
    ),
    Category.PUBLIC_LIGHTING: (
        "Solar Street Lighting, {place}",
        "LED Street Lights, {place}",
        "High Mast Lighting, {place}",
    ),
    Category.SPORTS: (
        "Playground Development, {place}",
        "Open Air Gymnasium, {place}",
        "Sports Ground Levelling, {place}",
    ),
    Category.OTHER: (
        "Bus Shelter, {place}",
        "Public Seating and Shade, {place}",
        "Boundary Fencing Works, {place}",
    ),
}

# Invented settlement names. Any resemblance to a real village is incidental.
PLACES: tuple[str, ...] = (
    "Anandpura", "Baliganj", "Chandwa", "Devgaon", "Eksal", "Fatehnagar",
    "Ganeshwadi", "Haripur", "Indrapur", "Jamkhed", "Kadamwadi", "Lakhanpur",
    "Madhavpur", "Narsinghpur", "Oranpalli", "Pimpalgaon", "Rampura",
    "Sultanpura", "Talegaon", "Umarkhed", "Vadgaon", "Wadhona", "Yelapur",
    "Zirapur", "Bhimnagar", "Chikhali", "Dhanora", "Gopalpura", "Kesarwadi",
    "Mangaldeep", "Nimgaon", "Pathari", "Raghunathpur", "Shivnagar",
    "Tarapur", "Ujjainpura", "Virpur", "Ward 4 Extension", "Ward 11 Colony",
)

AGENCIES: tuple[str, ...] = (
    "Zilla Parishad — Works Division",
    "Public Works Department (Rural Works)",
    "Municipal Council — Engineering Wing",
    "Block Development Office",
    "Rural Water Supply Cell",
    "District Rural Development Agency",
)

# Which illustration a client shows for a work; purely presentational.
IMAGE_KEYS: dict[Category, str] = {
    Category.ROAD: "road",
    Category.DRINKING_WATER: "water",
    Category.SANITATION: "sanitation",
    Category.EDUCATION: "school",
    Category.HEALTH: "health",
    Category.COMMUNITY_ASSET: "community",
    Category.PUBLIC_LIGHTING: "lighting",
    Category.SPORTS: "sports",
    Category.OTHER: "community",
}

CATEGORY_WEIGHTS: tuple[tuple[Category, int], ...] = (
    (Category.ROAD, 26),
    (Category.DRINKING_WATER, 16),
    (Category.EDUCATION, 14),
    (Category.COMMUNITY_ASSET, 12),
    (Category.PUBLIC_LIGHTING, 10),
    (Category.SANITATION, 8),
    (Category.HEALTH, 7),
    (Category.SPORTS, 4),
    (Category.OTHER, 3),
)

# How often each shape of record appears. Most public works are unremarkable;
# the troubled ones have to stay a small minority or the demo tells a false
# story about MPLADS. The proportions here are chosen to sit near published
# MPLADS completion rates rather than to make the dashboard look busy.
#
# The troubled archetypes deliberately compound across dimensions. A work that
# is genuinely in difficulty is rarely late *only*: it is late, and the spend
# has run ahead of the progress, and nobody has filed an update. Single-issue
# records score mid-band by design, because the engine takes a weighted mean.
ARCHETYPE_WEIGHTS: tuple[tuple[str, int], ...] = (
    ("completed_clean", 600),
    ("completed_underspent", 55),
    ("healthy_active", 140),
    ("minor_lag", 70),
    ("spend_ahead", 40),
    ("delayed", 30),
    ("doc_gap", 22),
    ("stalled", 20),
    ("early_stage", 15),
    ("severe_case", 8),
    ("sparse_record", 5),
)


@dataclass(frozen=True)
class WorkRecord:
    """One work: its descriptive record plus the engine's assessment of it."""

    work_id: str
    title: str
    category: Category
    place: District
    block: str
    lat: float
    lon: float
    mp_name: str
    agency: str

    sanctioned_amount: Decimal
    amount_spent: Decimal | None
    completion_percentage: float | None

    sanction_date: date
    work_start_date: date | None
    planned_duration_days: int | None
    elapsed_days: int | None
    expected_completion: date | None
    last_progress_update: date | None

    stage: ProjectStage
    documents: list[str] | None
    review_status: ReviewStatus

    assessment: RiskAssessment
    document_records: list[WorkDocument] = field(default_factory=list)

    # --- derived views -------------------------------------------------

    @property
    def key_flags(self) -> list[str]:
        """Short labels for the triggered rules, de-duplicated, order preserved."""
        seen: list[str] = []
        for signal in self.assessment.signals:
            label = FLAG_LABELS.get(signal.rule_id)
            if label and label not in seen:
                seen.append(label)
        return seen

    def summary(self, report_count: int = 0) -> WorkSummary:
        return WorkSummary(
            work_id=self.work_id,
            title=self.title,
            category=self.category,
            category_label=CATEGORY_LABELS[self.category],
            state=self.place.state,
            district=self.place.district,
            block=self.block,
            lat=self.lat,
            lon=self.lon,
            sanctioned=Money(
                amount=self.sanctioned_amount,
                formatted=format_inr(self.sanctioned_amount),
            ),
            spent=(
                None
                if self.amount_spent is None
                else Money(amount=self.amount_spent, formatted=format_inr(self.amount_spent))
            ),
            completion_percentage=self.completion_percentage,
            stage=self.stage,
            stage_label=STAGE_LABELS[self.stage],
            review_status=self.review_status,
            review_status_label=REVIEW_STATUS_LABELS[self.review_status],
            risk_score=self.assessment.risk_score,
            risk_level=self.assessment.risk_level,
            key_flags=self.key_flags,
            citizen_report_count=report_count,
        )

    def milestones(self, today: date) -> list[Milestone]:
        """The sanction-to-completion timeline shown on a work's page.

        The target date stays ``upcoming`` even once it has passed: a date
        going by does not make a work complete, and showing the target as
        reached would say the opposite of what the schedule note says.
        """
        if self.stage is ProjectStage.COMPLETED:
            entries: list[tuple[str, date | None, MilestoneStatus]] = [
                ("Sanctioned", self.sanction_date, MilestoneStatus.DONE),
                ("Work Started", self.work_start_date, MilestoneStatus.DONE),
                ("Completed", self.last_progress_update, MilestoneStatus.DONE),
            ]
        else:
            started = self.work_start_date is not None and self.work_start_date <= today
            entries = [
                ("Sanctioned", self.sanction_date, MilestoneStatus.DONE),
                (
                    "Work Started",
                    self.work_start_date,
                    MilestoneStatus.DONE if started else MilestoneStatus.UPCOMING,
                ),
                (
                    "Latest Update",
                    self.last_progress_update,
                    MilestoneStatus.CURRENT
                    if self.last_progress_update
                    else MilestoneStatus.UPCOMING,
                ),
                (
                    # Say it plainly when the target has gone by. Otherwise the
                    # timeline shows a date earlier than the update before it
                    # and reads like a sorting bug rather than an overrun.
                    "Expected Completion (overdue)"
                    if self.expected_completion and self.expected_completion < today
                    else "Expected Completion",
                    self.expected_completion,
                    MilestoneStatus.UPCOMING,
                ),
            ]

        return [
            Milestone(
                label=label,
                date=when,
                date_formatted=format_date(when) if when else None,
                status=status if when else MilestoneStatus.UPCOMING,
            )
            for label, when, status in entries
        ]

    def schedule_note(self, today: date) -> str | None:
        """``Due in 5 months 2 weeks`` / ``Overdue by 3 months``."""
        if self.stage is ProjectStage.COMPLETED:
            return "Completed"
        if self.expected_completion is None:
            return None
        delta = (self.expected_completion - today).days
        if delta >= 0:
            return f"Due in {humanise_days(delta)}"
        return f"Overdue by {humanise_days(-delta)}"

    def project_input(self) -> ProjectInput:
        """The record as the engine expects it. The only bridge to scoring."""
        return _project_input(self)


def _project_input(record: "WorkRecord | _Draft") -> ProjectInput:
    return ProjectInput(
        project_id=record.work_id,
        project_name=record.title,
        state=record.place.state,
        district=record.place.district,
        category=record.category,
        sanctioned_amount=record.sanctioned_amount,
        amount_spent=record.amount_spent,
        completion_percentage=record.completion_percentage,
        planned_duration_days=record.planned_duration_days,
        elapsed_days=record.elapsed_days,
        project_stage=record.stage,
        documents=record.documents,
        last_progress_update=record.last_progress_update,
    )


@dataclass
class _Draft:
    """A record under construction, before the engine has seen it."""

    work_id: str
    title: str
    category: Category
    place: District
    block: str
    lat: float
    lon: float
    mp_name: str
    agency: str
    sanctioned_amount: Decimal
    amount_spent: Decimal | None
    completion_percentage: float | None
    sanction_date: date
    work_start_date: date | None
    planned_duration_days: int | None
    elapsed_days: int | None
    expected_completion: date | None
    last_progress_update: date | None
    stage: ProjectStage
    documents: list[str] | None


def _weighted(rng: random.Random, options: tuple[tuple[object, int], ...]) -> object:
    population = [item for item, _ in options]
    weights = [weight for _, weight in options]
    return rng.choices(population, weights=weights, k=1)[0]


def _round_to(value: float, step: int) -> Decimal:
    return Decimal(int(round(value / step)) * step)


def _draft(rng: random.Random, index: int, today: date) -> _Draft:
    """Build one plausible record. Risk emerges from the shape, not a label."""
    place: District = rng.choice(DISTRICTS)
    category: Category = _weighted(rng, CATEGORY_WEIGHTS)  # type: ignore[assignment]
    block = rng.choice(PLACES)

    # Scatter works around the district headquarters instead of stacking them
    # all on one coordinate. Roughly +/-40km, which keeps a marker inside its
    # district while making a map of 500 works look like 500 works.
    lat = round(place.lat + rng.uniform(-0.36, 0.36), 4)
    lon = round(place.lon + rng.uniform(-0.36, 0.36), 4)
    title = rng.choice(TITLES[category]).format(place=block)
    archetype = _weighted(rng, ARCHETYPE_WEIGHTS)

    sanctioned = _round_to(rng.uniform(250_000, 4_800_000), 10_000)
    planned = rng.choice((90, 120, 180, 240, 270, 365, 450))

    full_docs = ["Sanction Order", "Work Order", "Progress Report", "Measurement Book"]
    completion_docs = full_docs + ["Utilisation Certificate", "Completion Certificate"]

    stage = ProjectStage.IN_PROGRESS
    documents: list[str] | None = list(full_docs)
    review_default = ReviewStatus.OPEN

    if archetype == "completed_clean":
        stage = ProjectStage.COMPLETED
        completion = 100.0
        spend_ratio = rng.uniform(0.9, 1.0)
        elapsed = int(planned * rng.uniform(0.82, 1.05))
        update_age = rng.randint(5, 70)
        documents = list(completion_docs)

    elif archetype == "completed_underspent":
        # Closed out well under sanction — worth a look, not an accusation.
        stage = ProjectStage.COMPLETED
        completion = 100.0
        spend_ratio = rng.uniform(0.48, 0.68)
        elapsed = int(planned * rng.uniform(0.7, 1.0))
        update_age = rng.randint(10, 90)
        documents = list(completion_docs)

    elif archetype == "healthy_active":
        completion = round(rng.uniform(25, 85), 0)
        spend_ratio = (completion / 100) * rng.uniform(0.92, 1.12)
        elapsed = int(planned * (completion / 100) * rng.uniform(0.9, 1.15))
        update_age = rng.randint(3, 26)

    elif archetype == "minor_lag":
        completion = round(rng.uniform(30, 70), 0)
        spend_ratio = (completion / 100) * rng.uniform(0.95, 1.15)
        elapsed = int(planned * rng.uniform(0.85, 0.99))
        update_age = rng.randint(32, 80)

    elif archetype == "spend_ahead":
        # Financial dimension leads; reporting has also slipped a little.
        completion = round(rng.uniform(20, 45), 0)
        spend_ratio = rng.uniform(0.78, 0.96)
        elapsed = int(planned * rng.uniform(0.6, 0.95))
        update_age = rng.randint(34, 85)

    elif archetype == "delayed":
        # Time overrun, progress behind the clock, spend ahead of the work,
        # and the progress file has gone quiet. Three dimensions at once.
        completion = round(rng.uniform(30, 60), 0)
        spend_ratio = (completion / 100) * rng.uniform(1.4, 1.9)
        elapsed = int(planned * rng.uniform(1.3, 1.9))
        update_age = rng.randint(95, 150)
        documents = rng.choice(
            [["Sanction Order", "Work Order"], ["Sanction Order", "Work Order", "Progress Report"]]
        )

    elif archetype == "doc_gap":
        # Documentation leads, with the reporting lapse that usually accompanies it.
        completion = round(rng.uniform(40, 90), 0)
        spend_ratio = (completion / 100) * rng.uniform(1.0, 1.25)
        elapsed = int(planned * rng.uniform(0.9, 1.2))
        update_age = rng.randint(60, 110)
        documents = rng.choice([["Sanction Order"], ["Sanction Order", "Work Order"], []])

    elif archetype == "stalled":
        # Nothing filed for two quarters or more on a work still open.
        completion = round(rng.uniform(15, 50), 0)
        spend_ratio = (completion / 100) * rng.uniform(1.5, 2.1)
        elapsed = int(planned * rng.uniform(1.2, 2.0))
        update_age = rng.randint(200, 420)
        documents = rng.choice([["Sanction Order"], ["Sanction Order", "Work Order"]])

    elif archetype == "severe_case":
        # The compound case the officer queue exists for.
        completion = round(rng.uniform(10, 35), 0)
        spend_ratio = rng.uniform(1.02, 1.22)
        elapsed = int(planned * rng.uniform(1.7, 2.6))
        update_age = rng.randint(220, 460)
        documents = rng.choice([[], ["Sanction Order"]])

    elif archetype == "early_stage":
        stage = ProjectStage.SANCTIONED
        completion = 0.0
        spend_ratio = 0.0
        elapsed = rng.randint(5, 40)
        update_age = rng.randint(4, 25)
        documents = ["Sanction Order"]

    else:  # sparse_record — the register simply does not hold the figures
        completion = None  # type: ignore[assignment]
        spend_ratio = None  # type: ignore[assignment]
        elapsed = None  # type: ignore[assignment]
        update_age = None  # type: ignore[assignment]
        documents = None

    if archetype == "sparse_record":
        amount_spent = None
        completion_percentage = None
        planned_duration = None
        elapsed_days = None
        last_update = None
        work_start: date | None = None
        expected: date | None = None
        sanction_date = today - timedelta(days=rng.randint(120, 600))
    else:
        amount_spent = _round_to(float(sanctioned) * spend_ratio, 1_000)
        completion_percentage = float(completion)
        planned_duration = planned
        elapsed_days = max(elapsed, 1)
        last_update = today - timedelta(days=update_age)
        work_start = today - timedelta(days=elapsed_days)
        expected = work_start + timedelta(days=planned)
        sanction_date = work_start - timedelta(days=rng.randint(20, 90))

    if stage is ProjectStage.COMPLETED:
        review_default = ReviewStatus.COMPLETED

    return _Draft(
        work_id=f"MPL-{1000 + index}",
        title=title,
        category=category,
        place=place,
        block=block,
        lat=lat,
        lon=lon,
        # A placeholder, never a real representative's name.
        mp_name=f"Constituency Representative — {place.district} (demo record)",
        agency=rng.choice(AGENCIES),
        sanctioned_amount=sanctioned,
        amount_spent=amount_spent,
        completion_percentage=completion_percentage,
        sanction_date=sanction_date,
        work_start_date=work_start,
        planned_duration_days=planned_duration,
        elapsed_days=elapsed_days,
        expected_completion=expected,
        last_progress_update=last_update,
        stage=stage,
        documents=documents,
    ), review_default  # type: ignore[return-value]


EXPECTED_DOCUMENTS: tuple[tuple[str, str], ...] = (
    ("Sanction Order", "District Authority"),
    ("Work Order", "Implementing Agency"),
    ("Progress Report", "Implementing Agency"),
    ("Measurement Book", "Site Engineer"),
    ("Utilisation Certificate", "Implementing Agency"),
    ("Completion Certificate", "District Authority"),
)


def _document_records(draft: _Draft, rng: random.Random) -> list[WorkDocument]:
    """The document register for a work, as available/missing rows.

    A missing document is a data-quality signal, not an allegation.
    """
    on_record = set(draft.documents or [])
    unknown = draft.documents is None

    records: list[WorkDocument] = []
    for name, source in EXPECTED_DOCUMENTS:
        # Certificates only become expected once the work is complete.
        if name in {"Utilisation Certificate", "Completion Certificate"}:
            if draft.stage is not ProjectStage.COMPLETED:
                continue
        if unknown:
            continue
        present = name in on_record
        when: date | None = None
        if present and draft.work_start_date is not None:
            offset = rng.randint(0, max((draft.elapsed_days or 30) - 1, 1))
            when = draft.work_start_date + timedelta(days=offset)
        records.append(
            WorkDocument(
                name=name,
                status=DocumentStatus.ON_RECORD if present else DocumentStatus.MISSING,
                date=when,
                date_formatted=format_date(when) if when else None,
                source=source,
            )
        )
    return records


def _build(today: date) -> list[WorkRecord]:
    rng = random.Random(SEED)
    records: list[WorkRecord] = []

    for index in range(TARGET_WORKS):
        draft, review_default = _draft(rng, index, today)
        assessment = assess(_project_input(draft), today=today)

        review_status = review_default
        if review_status is not ReviewStatus.COMPLETED:
            level = assessment.risk_level.value if assessment.risk_level else None
            if level in {"high", "critical"}:
                # A portion of the risky works are already in someone's queue.
                review_status = (
                    ReviewStatus.UNDER_REVIEW if rng.random() < 0.55 else ReviewStatus.FLAGGED
                )
            elif rng.random() < 0.08:
                review_status = ReviewStatus.UNDER_REVIEW

        records.append(
            WorkRecord(
                work_id=draft.work_id,
                title=draft.title,
                category=draft.category,
                place=draft.place,
                block=draft.block,
                lat=draft.lat,
                lon=draft.lon,
                mp_name=draft.mp_name,
                agency=draft.agency,
                sanctioned_amount=draft.sanctioned_amount,
                amount_spent=draft.amount_spent,
                completion_percentage=draft.completion_percentage,
                sanction_date=draft.sanction_date,
                work_start_date=draft.work_start_date,
                planned_duration_days=draft.planned_duration_days,
                elapsed_days=draft.elapsed_days,
                expected_completion=draft.expected_completion,
                last_progress_update=draft.last_progress_update,
                stage=draft.stage,
                documents=draft.documents,
                review_status=review_status,
                assessment=assessment,
                document_records=_document_records(draft, rng),
            )
        )

    return records


@lru_cache(maxsize=1)
def catalogue() -> tuple[WorkRecord, ...]:
    """The demo catalogue, built once per process against today's date."""
    return tuple(_build(date.today()))


@lru_cache(maxsize=1)
def by_id() -> dict[str, WorkRecord]:
    return {record.work_id: record for record in catalogue()}


def duration(days: int | None) -> Duration | None:
    if days is None:
        return None
    return Duration(days=days, human=humanise_days(days))


def duration_text(days: int | None) -> str | None:
    return None if days is None else format_duration(days)
