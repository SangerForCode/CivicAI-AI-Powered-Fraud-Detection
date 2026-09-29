"""Schemas for the citizen and officer portals.

These describe the *demo catalogue* that sits in front of the risk engine. The
engine itself is untouched: every risk figure in these responses comes from
``app.engine.scoring.assess``, and nothing here recomputes one.

Durations are sent both as a raw integer and as a pre-formatted human string
(``620`` / ``"1 year 8 months"``) so that clients render text rather than
deriving their own calendar arithmetic.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas import Category, ProjectStage, RiskAssessment, RiskLevel

# Two models below carry a field literally called ``date``, which would shadow
# the imported type inside the class namespace when the annotation is resolved.
DateValue = date


class ReviewStatus(str, Enum):
    """Operational state of a work in the officer's queue.

    Deliberately separate from the risk engine: this is workflow, not scoring.
    """

    OPEN = "open"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    FLAGGED = "flagged"


class DocumentStatus(str, Enum):
    ON_RECORD = "on_record"
    MISSING = "missing"


class MilestoneStatus(str, Enum):
    DONE = "done"
    CURRENT = "current"
    UPCOMING = "upcoming"


class IssueType(str, Enum):
    """What a citizen is reporting. Neutral wording: these are observations."""

    WORK_NOT_STARTED = "work_not_started"
    WORK_STALLED = "work_stalled"
    QUALITY_CONCERN = "quality_concern"
    INCOMPLETE_WORK = "incomplete_work"
    NOT_AS_DESCRIBED = "not_as_described"
    OTHER = "other"


class Duration(BaseModel):
    """A day count with its human rendering, formatted server-side."""

    days: int
    human: str = Field(description='e.g. "1 year 8 months"')


class Money(BaseModel):
    """An amount with its Indian-grouped rendering, formatted server-side."""

    amount: Decimal
    formatted: str = Field(description='e.g. "₹18,50,000"')


class Milestone(BaseModel):
    label: str
    date: DateValue | None = None
    date_formatted: str | None = None
    status: MilestoneStatus


class WorkDocument(BaseModel):
    name: str
    status: DocumentStatus
    date: DateValue | None = None
    date_formatted: str | None = None
    source: str


class CitizenReport(BaseModel):
    """An observation submitted from the citizen portal.

    A report is an input to human review. It is never evidence of wrongdoing
    and it does not alter the engine's score.
    """

    report_id: str
    work_id: str
    issue_type: IssueType
    issue_label: str
    description: str
    submitted_on: date
    submitted_on_formatted: str
    has_photo: bool
    reporter_area: str | None = None
    status: str = Field(default="received", description="received | acknowledged")


class CitizenReportCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    issue_type: IssueType
    description: str = Field(min_length=10, max_length=2000)
    reporter_area: str | None = Field(default=None, max_length=128)
    has_photo: bool = False


class WorkSummary(BaseModel):
    """List-row view of a work. Enough for a table, a card or a map marker."""

    work_id: str
    title: str
    category: Category
    category_label: str
    state: str
    district: str
    block: str
    lat: float
    lon: float

    sanctioned: Money
    spent: Money | None = None
    completion_percentage: float | None = None

    stage: ProjectStage
    stage_label: str
    review_status: ReviewStatus
    review_status_label: str

    # From the engine. Never derived client-side.
    risk_score: float | None = None
    risk_level: RiskLevel | None = None
    key_flags: list[str] = Field(
        default_factory=list, description="Short labels for the triggered signals."
    )
    citizen_report_count: int = 0


class WorkDetail(BaseModel):
    """Full record for a work, including its live assessment."""

    summary: WorkSummary

    mp_name: str
    agency: str
    sanction_date: date
    sanction_date_formatted: str
    work_start_date: date | None = None
    work_start_date_formatted: str | None = None
    expected_completion: date | None = None
    expected_completion_formatted: str | None = None

    planned_duration: Duration | None = None
    elapsed: Duration | None = None
    schedule_note: str | None = Field(
        default=None, description='e.g. "Due in 5 months 2 weeks" or "Overdue by 3 months"'
    )

    last_progress_update: date | None = None
    last_progress_update_formatted: str | None = None
    since_last_update: Duration | None = None

    image_key: str = Field(description="Which stock illustration the client should show.")
    milestones: list[Milestone] = Field(default_factory=list)
    documents: list[WorkDocument] = Field(default_factory=list)

    assessment: RiskAssessment
    reports: list[CitizenReport] = Field(default_factory=list)


class WorkPage(BaseModel):
    works: list[WorkSummary]
    total: int
    offset: int
    limit: int


class CountBucket(BaseModel):
    key: str
    label: str
    count: int


class TrendStat(BaseModel):
    """A KPI with a change indicator.

    The delta is a fixed characteristic of the demo dataset rather than a real
    month-over-month measurement; it is labelled as such in the UI.
    """

    key: str
    label: str
    value: int
    delta_percent: float | None = None
    delta_direction: str | None = Field(default=None, description="up | down")


class DashboardSummary(BaseModel):
    kpis: list[TrendStat]
    risk_distribution: list[CountBucket]
    top_categories: list[CountBucket]
    state_rollup: list[CountBucket]
    high_risk_works: list[WorkSummary]
    total_works: int
    districts_covered: int
    completed_percentage: float
    disclaimer: str


class CitizenStats(BaseModel):
    """The public-facing counters on the citizen home page."""

    total_works: int
    total_works_display: str
    districts_covered: int
    completed_percentage: float
    disclaimer: str


class FilterOptions(BaseModel):
    states: list[str]
    districts: dict[str, list[str]]
    categories: list[CountBucket]
    stages: list[CountBucket]
