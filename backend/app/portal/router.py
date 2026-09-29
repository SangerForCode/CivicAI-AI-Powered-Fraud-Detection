"""Portal endpoints for the citizen and officer experiences.

These serve the synthetic works catalogue. Every risk figure they return was
produced by ``app.engine.scoring.assess`` — this layer filters, sorts, counts
and formats, and never computes a score of its own.
"""

from __future__ import annotations

from collections import Counter
from datetime import date

from fastapi import APIRouter, HTTPException, Query, status

from app.engine import constants as C
from app.portal import catalogue as cat
from app.portal.geography import STATES
from app.portal.intelligence import AssistedAnalysis, analyse
from app.portal.schemas import (
    CitizenReport,
    CitizenReportCreate,
    CitizenStats,
    CountBucket,
    DashboardSummary,
    FilterOptions,
    ReviewStatus,
    TrendStat,
    WorkDetail,
    WorkPage,
    WorkSummary,
)
from app.portal.store import store
from app.schemas import Category, ProjectStage, RiskLevel

router = APIRouter()

RISK_ORDER: dict[str, int] = {"critical": 3, "high": 2, "medium": 1, "low": 0}

# Month-over-month deltas are a fixed property of this demo dataset rather than
# a measurement; the UI labels them as illustrative.
KPI_DELTAS: dict[str, tuple[float, str]] = {
    "total": (12.0, "up"),
    "high_risk": (5.0, "up"),
    "under_review": (8.0, "up"),
    "completed": (14.0, "up"),
}


def _seed_reports_once() -> None:
    """Attach demo reports to a spread of flagged and ordinary works."""
    if store.total():
        return
    records = cat.catalogue()
    flagged = [
        record.work_id
        for record in sorted(
            records,
            key=lambda record: -(record.assessment.risk_score or 0),
        )
        if record.assessment.risk_level
        and record.assessment.risk_level.value in {"high", "critical"}
    ][:26]
    # A few reports on unremarkable works too, so corroboration means something
    # rather than being a synonym for "already flagged". Spread across the
    # catalogue instead of taking the first few, which would otherwise put a
    # report badge on every card of the first page of the works list.
    low_risk = [
        record.work_id
        for record in records
        if record.assessment.risk_level and record.assessment.risk_level.value == "low"
    ]
    stride = max(len(low_risk) // 7, 1)
    ordinary = low_risk[stride::stride][:6]
    store.seed(flagged + ordinary, date.today())


def _summaries(records: list[cat.WorkRecord]) -> list[WorkSummary]:
    counts = store.counts()
    return [record.summary(report_count=counts.get(record.work_id, 0)) for record in records]


def _filtered(
    *,
    state: str | None,
    district: str | None,
    category: Category | None,
    stage: ProjectStage | None,
    risk_level: RiskLevel | None,
    review_status: ReviewStatus | None,
    search: str | None,
) -> list[cat.WorkRecord]:
    records = list(cat.catalogue())

    if state:
        records = [r for r in records if r.place.state.lower() == state.lower()]
    if district:
        records = [r for r in records if r.place.district.lower() == district.lower()]
    if category:
        records = [r for r in records if r.category is category]
    if stage:
        records = [r for r in records if r.stage is stage]
    if risk_level:
        records = [
            r for r in records if r.assessment.risk_level and r.assessment.risk_level is risk_level
        ]
    if review_status:
        records = [r for r in records if r.review_status is review_status]
    if search:
        needle = search.strip().lower()
        if needle:
            records = [
                r
                for r in records
                if needle in r.title.lower()
                or needle in r.work_id.lower()
                or needle in r.place.district.lower()
                or needle in r.place.state.lower()
                or needle in r.block.lower()
            ]
    return records


@router.get("/works", response_model=WorkPage, tags=["portal"])
def list_works(
    state: str | None = None,
    district: str | None = None,
    category: Category | None = None,
    stage: ProjectStage | None = None,
    risk_level: RiskLevel | None = None,
    review_status: ReviewStatus | None = None,
    search: str | None = None,
    sort: str = Query(default="risk", pattern="^(risk|amount|completion|id)$"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=200),
) -> WorkPage:
    """Filterable list of works, shared by the citizen explorer and officer table."""
    _seed_reports_once()
    records = _filtered(
        state=state,
        district=district,
        category=category,
        stage=stage,
        risk_level=risk_level,
        review_status=review_status,
        search=search,
    )

    if sort == "risk":
        records.sort(key=lambda r: (r.assessment.risk_score or -1), reverse=True)
    elif sort == "amount":
        records.sort(key=lambda r: r.sanctioned_amount, reverse=True)
    elif sort == "completion":
        records.sort(key=lambda r: (r.completion_percentage or -1), reverse=True)
    else:
        records.sort(key=lambda r: r.work_id)

    window = records[offset : offset + limit]
    return WorkPage(
        works=_summaries(window), total=len(records), offset=offset, limit=limit
    )


@router.get("/works/map", response_model=list[WorkSummary], tags=["portal"])
def map_works(
    state: str | None = None,
    category: Category | None = None,
    risk_level: RiskLevel | None = None,
    limit: int = Query(default=400, ge=1, le=1500),
) -> list[WorkSummary]:
    """Marker set for the map views, highest risk first so pins that matter win."""
    _seed_reports_once()
    records = _filtered(
        state=state,
        district=None,
        category=category,
        stage=None,
        risk_level=risk_level,
        review_status=None,
        search=None,
    )
    records.sort(key=lambda r: (r.assessment.risk_score or -1), reverse=True)
    return _summaries(records[:limit])


@router.get("/works/{work_id}", response_model=WorkDetail, tags=["portal"])
def get_work(work_id: str) -> WorkDetail:
    """Everything one work's page needs, including its live assessment."""
    _seed_reports_once()
    record = cat.by_id().get(work_id.upper())
    if record is None:
        raise HTTPException(status_code=404, detail=f"No work with id {work_id!r}.")

    today = date.today()
    reports = store.for_work(record.work_id)

    return WorkDetail(
        summary=record.summary(report_count=len(reports)),
        mp_name=record.mp_name,
        agency=record.agency,
        sanction_date=record.sanction_date,
        sanction_date_formatted=cat.format_date(record.sanction_date),
        work_start_date=record.work_start_date,
        work_start_date_formatted=(
            cat.format_date(record.work_start_date) if record.work_start_date else None
        ),
        expected_completion=record.expected_completion,
        expected_completion_formatted=(
            cat.format_date(record.expected_completion) if record.expected_completion else None
        ),
        planned_duration=cat.duration(record.planned_duration_days),
        elapsed=cat.duration(record.elapsed_days),
        schedule_note=record.schedule_note(today),
        last_progress_update=record.last_progress_update,
        last_progress_update_formatted=(
            cat.format_date(record.last_progress_update) if record.last_progress_update else None
        ),
        since_last_update=cat.duration(
            (today - record.last_progress_update).days if record.last_progress_update else None
        ),
        image_key=cat.IMAGE_KEYS[record.category],
        milestones=record.milestones(today),
        documents=record.document_records,
        assessment=record.assessment,
        reports=reports,
    )


@router.get("/works/{work_id}/analysis", response_model=AssistedAnalysis, tags=["portal"])
def work_analysis(work_id: str) -> AssistedAnalysis:
    """The assisted-analysis panel. Deterministic; see ``portal.intelligence``."""
    _seed_reports_once()
    record = cat.by_id().get(work_id.upper())
    if record is None:
        raise HTTPException(status_code=404, detail=f"No work with id {work_id!r}.")
    return analyse(
        record.assessment, store.for_work(record.work_id), work_title=record.title
    )


@router.get("/works/{work_id}/reports", response_model=list[CitizenReport], tags=["portal"])
def work_reports(work_id: str) -> list[CitizenReport]:
    _seed_reports_once()
    if work_id.upper() not in cat.by_id():
        raise HTTPException(status_code=404, detail=f"No work with id {work_id!r}.")
    return store.for_work(work_id.upper())


@router.post(
    "/works/{work_id}/reports",
    response_model=CitizenReport,
    status_code=status.HTTP_201_CREATED,
    tags=["portal"],
)
def submit_report(work_id: str, payload: CitizenReportCreate) -> CitizenReport:
    """Accept a citizen observation against a work.

    The report is stored for human review. It does not change the risk score,
    and nothing here treats it as a finding.
    """
    _seed_reports_once()
    if work_id.upper() not in cat.by_id():
        raise HTTPException(status_code=404, detail=f"No work with id {work_id!r}.")
    return store.add(work_id.upper(), payload, date.today())


@router.get("/reports/recent", response_model=list[CitizenReport], tags=["portal"])
def recent_reports(limit: int = Query(default=8, ge=1, le=50)) -> list[CitizenReport]:
    _seed_reports_once()
    return store.recent(limit)


@router.get("/dashboard/summary", response_model=DashboardSummary, tags=["portal"])
def dashboard_summary() -> DashboardSummary:
    """Officer dashboard aggregates, computed over the engine's own output."""
    _seed_reports_once()
    records = list(cat.catalogue())
    total = len(records)

    levels = Counter(
        record.assessment.risk_level.value if record.assessment.risk_level else "unscored"
        for record in records
    )
    high_risk = levels["high"] + levels["critical"]
    under_review = sum(1 for r in records if r.review_status is ReviewStatus.UNDER_REVIEW)
    completed = sum(1 for r in records if r.stage is ProjectStage.COMPLETED)

    def kpi(key: str, label: str, value: int) -> TrendStat:
        delta, direction = KPI_DELTAS[key]
        return TrendStat(
            key=key, label=label, value=value, delta_percent=delta, delta_direction=direction
        )

    risk_distribution = [
        CountBucket(key="critical", label="Critical", count=levels["critical"]),
        CountBucket(key="high", label="High Risk", count=levels["high"]),
        CountBucket(key="medium", label="Medium Risk", count=levels["medium"]),
        CountBucket(key="low", label="Low Risk", count=levels["low"]),
        CountBucket(key="unscored", label="Not Assessable", count=levels["unscored"]),
    ]

    # Top categories by how many *flagged* works each holds — the question the
    # officer is asking is "where is the trouble", not "what is most common".
    flagged_categories = Counter(
        record.category
        for record in records
        if record.assessment.risk_level
        and record.assessment.risk_level.value in {"high", "critical", "medium"}
    )
    top_categories = [
        CountBucket(key=category.value, label=cat.CATEGORY_LABELS[category], count=count)
        for category, count in flagged_categories.most_common(6)
    ]

    flagged_states = Counter(
        record.place.state
        for record in records
        if record.assessment.risk_level
        and record.assessment.risk_level.value in {"high", "critical"}
    )
    state_rollup = [
        CountBucket(key=name, label=name, count=count)
        for name, count in flagged_states.most_common(6)
    ]

    worst = sorted(records, key=lambda r: -(r.assessment.risk_score or -1))[:8]

    return DashboardSummary(
        kpis=[
            kpi("total", "Total Works", total),
            kpi("high_risk", "High Risk Works", high_risk),
            kpi("under_review", "Under Review", under_review),
            kpi("completed", "Completed", completed),
        ],
        risk_distribution=risk_distribution,
        top_categories=top_categories,
        state_rollup=state_rollup,
        high_risk_works=_summaries(worst),
        total_works=total,
        districts_covered=len({record.place.district for record in records}),
        completed_percentage=round(completed / total * 100, 1) if total else 0.0,
        disclaimer=cat.DATA_DISCLAIMER,
    )


@router.get("/citizen/stats", response_model=CitizenStats, tags=["portal"])
def citizen_stats() -> CitizenStats:
    """The public counters on the citizen home page."""
    records = cat.catalogue()
    total = len(records)
    completed = sum(1 for r in records if r.stage is ProjectStage.COMPLETED)
    return CitizenStats(
        total_works=total,
        total_works_display=f"{total:,}",
        districts_covered=len({record.place.district for record in records}),
        completed_percentage=round(completed / total * 100, 1) if total else 0.0,
        disclaimer=cat.DATA_DISCLAIMER,
    )


@router.get("/filters", response_model=FilterOptions, tags=["portal"])
def filter_options() -> FilterOptions:
    """Everything the filter controls need, derived from the catalogue itself."""
    records = cat.catalogue()

    districts: dict[str, list[str]] = {}
    for record in records:
        bucket = districts.setdefault(record.place.state, [])
        if record.place.district not in bucket:
            bucket.append(record.place.district)
    for names in districts.values():
        names.sort()

    categories = Counter(record.category for record in records)
    stages = Counter(record.stage for record in records)

    return FilterOptions(
        states=list(STATES),
        districts=districts,
        categories=[
            CountBucket(key=category.value, label=cat.CATEGORY_LABELS[category], count=count)
            for category, count in sorted(categories.items(), key=lambda item: -item[1])
        ],
        stages=[
            CountBucket(key=stage.value, label=cat.STAGE_LABELS[stage], count=count)
            for stage, count in sorted(stages.items(), key=lambda item: -item[1])
        ],
    )
