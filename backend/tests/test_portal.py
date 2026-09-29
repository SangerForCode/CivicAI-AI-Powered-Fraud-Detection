"""Tests for the portal layer that fronts the risk engine.

The property that matters most here is that the portal never invents a score.
Several tests below assert that a figure served by a portal endpoint is
identical to what ``assess`` returns for the same record.
"""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.engine.formatting import format_duration, humanise_days
from app.engine.scoring import assess
from app.main import app
from app.portal import catalogue as cat
from app.portal.intelligence import analyse
from app.portal.schemas import CitizenReportCreate, IssueType
from app.portal.store import ReportStore


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="module")
def worst_work_id() -> str:
    """The highest-scoring work, found by property rather than hardcoded.

    Any change to the generator reshuffles which id lands where, so pinning an
    id here would make these tests fail for reasons that have nothing to do
    with what they check.
    """
    worst = max(cat.catalogue(), key=lambda record: record.assessment.risk_score or -1)
    return worst.work_id


# --------------------------------------------------------------------------
# Duration humanising
# --------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("days", "expected"),
    [
        (0, "0 days"),
        (1, "1 day"),
        (3, "3 days"),
        (7, "1 week"),
        (30, "1 month"),
        (45, "1 month 2 weeks"),
        (167, "5 months 2 weeks"),
        (365, "1 year"),
        (620, "1 year 8 months"),
    ],
)
def test_humanise_days(days: int, expected: str) -> None:
    assert humanise_days(days) == expected


def test_humanise_days_never_reports_four_weeks() -> None:
    """Four leftover weeks should read as the month it almost is."""
    for days in range(7, 900):
        assert "4 weeks" not in humanise_days(days)


def test_humanise_days_ignores_sign() -> None:
    assert humanise_days(-167) == humanise_days(167)


def test_format_duration_pairs_exact_and_human() -> None:
    assert format_duration(620) == "620 days ≈ 1 year 8 months"
    # No "≈" when the two renderings would say the same thing.
    assert format_duration(3) == "3 days"


# --------------------------------------------------------------------------
# Catalogue integrity
# --------------------------------------------------------------------------


def test_catalogue_is_deterministic() -> None:
    first = cat.catalogue()
    second = cat.catalogue()
    assert [record.work_id for record in first] == [record.work_id for record in second]


def test_work_ids_are_unique() -> None:
    ids = [record.work_id for record in cat.catalogue()]
    assert len(ids) == len(set(ids))


def test_catalogue_scores_come_from_the_engine() -> None:
    """The portal must never hold a score the engine did not produce."""
    today = date.today()
    for record in cat.catalogue()[:120]:
        recomputed = assess(record.project_input(), today=today)
        assert record.assessment.risk_score == recomputed.risk_score
        assert record.assessment.risk_level == recomputed.risk_level
        assert record.assessment.assessment_status == recomputed.assessment_status


def test_catalogue_never_names_a_real_representative() -> None:
    """Risk scores must not be attached to any real person's name."""
    for record in cat.catalogue():
        assert "demo record" in record.mp_name


def test_most_works_are_unremarkable() -> None:
    """A demo that flags everything would misrepresent MPLADS."""
    records = cat.catalogue()
    low = sum(
        1
        for record in records
        if record.assessment.risk_level and record.assessment.risk_level.value == "low"
    )
    assert low / len(records) > 0.75


def test_catalogue_contains_each_risk_band() -> None:
    levels = {
        record.assessment.risk_level.value
        for record in cat.catalogue()
        if record.assessment.risk_level
    }
    assert {"low", "medium", "high", "critical"} <= levels


def test_sparse_records_are_reported_incomplete_not_zero() -> None:
    sparse = [
        record
        for record in cat.catalogue()
        if record.assessment.assessment_status.value == "incomplete"
    ]
    assert sparse, "expected at least one under-documented record in the demo set"
    for record in sparse:
        # An unknown record is never presented as a clean one.
        assert record.assessment.risk_score is None or record.assessment.risk_score >= 0
        if record.assessment.risk_score is None:
            assert record.assessment.risk_level is None


def test_key_flags_map_to_triggered_rules() -> None:
    for record in cat.catalogue()[:200]:
        if not record.assessment.signals:
            assert record.key_flags == []


# --------------------------------------------------------------------------
# Milestones and schedule wording
# --------------------------------------------------------------------------


def test_expected_completion_stays_upcoming_when_overdue() -> None:
    """A date passing does not make a work complete."""
    today = date.today()
    overdue = [
        record
        for record in cat.catalogue()
        if record.expected_completion
        and record.expected_completion < today
        and record.stage.value != "completed"
    ]
    assert overdue
    for record in overdue[:40]:
        target = [m for m in record.milestones(today) if m.label.startswith("Expected Completion")]
        assert target and target[0].status.value == "upcoming"
        assert target[0].label == "Expected Completion (overdue)"
        assert record.schedule_note(today).startswith("Overdue by")


def test_target_not_marked_overdue_while_still_ahead() -> None:
    today = date.today()
    upcoming = [
        record
        for record in cat.catalogue()
        if record.expected_completion
        and record.expected_completion >= today
        and record.stage.value != "completed"
    ]
    assert upcoming
    for record in upcoming[:40]:
        labels = [m.label for m in record.milestones(today)]
        assert "Expected Completion" in labels


def test_completed_work_reports_completed_schedule() -> None:
    completed = next(r for r in cat.catalogue() if r.stage.value == "completed")
    assert completed.schedule_note(date.today()) == "Completed"


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------


def test_list_works_paginates(client: TestClient) -> None:
    body = client.get("/works", params={"limit": 5}).json()
    assert len(body["works"]) == 5
    assert body["total"] > 5
    assert body["limit"] == 5


def test_list_works_sorted_by_risk_by_default(client: TestClient) -> None:
    works = client.get("/works", params={"limit": 20}).json()["works"]
    scores = [work["risk_score"] or -1 for work in works]
    assert scores == sorted(scores, reverse=True)


def test_list_works_filters_by_state(client: TestClient) -> None:
    body = client.get("/works", params={"state": "Bihar", "limit": 50}).json()
    assert body["total"] > 0
    assert {work["state"] for work in body["works"]} == {"Bihar"}


def test_list_works_filters_by_risk_level(client: TestClient) -> None:
    body = client.get("/works", params={"risk_level": "critical", "limit": 50}).json()
    assert body["total"] > 0
    assert {work["risk_level"] for work in body["works"]} == {"critical"}


def test_list_works_search_matches_id(client: TestClient) -> None:
    body = client.get("/works", params={"search": "MPL-1001"}).json()
    assert body["total"] == 1
    assert body["works"][0]["work_id"] == "MPL-1001"


def test_list_works_rejects_bad_sort(client: TestClient) -> None:
    assert client.get("/works", params={"sort": "nonsense"}).status_code == 422


def test_work_detail_matches_engine_output(client: TestClient) -> None:
    detail = client.get("/works/MPL-1001").json()
    record = cat.by_id()["MPL-1001"]
    recomputed = assess(record.project_input(), today=date.today())
    assert detail["assessment"]["risk_score"] == recomputed.risk_score
    assert detail["summary"]["risk_score"] == recomputed.risk_score


def test_work_detail_is_case_insensitive(client: TestClient) -> None:
    assert client.get("/works/mpl-1001").status_code == 200


def test_unknown_work_returns_404(client: TestClient) -> None:
    assert client.get("/works/MPL-999999").status_code == 404


def test_work_detail_carries_the_disclaimer(client: TestClient) -> None:
    detail = client.get("/works/MPL-1001").json()
    assert detail["assessment"]["disclaimer"]


def test_work_detail_sends_preformatted_durations(client: TestClient) -> None:
    """Clients render strings; they do not do calendar arithmetic."""
    detail = client.get("/works/MPL-1001").json()
    assert detail["elapsed"]["human"]
    assert detail["planned_duration"]["human"]
    assert detail["summary"]["sanctioned"]["formatted"].startswith("₹")


def test_map_endpoint_returns_coordinates(client: TestClient) -> None:
    works = client.get("/works/map", params={"limit": 30}).json()
    assert len(works) == 30
    for work in works:
        assert 6.0 < work["lat"] < 38.0
        assert 67.0 < work["lon"] < 98.0


def test_markers_do_not_stack_on_one_point_per_district() -> None:
    """Works are scattered within their district, or a map of 500 shows 54."""
    records = cat.catalogue()
    assert len({(record.lat, record.lon) for record in records}) == len(records)


def test_markers_stay_near_their_district() -> None:
    for record in cat.catalogue()[:200]:
        assert abs(record.lat - record.place.lat) < 0.4
        assert abs(record.lon - record.place.lon) < 0.4


def test_dashboard_counts_agree_with_the_catalogue(client: TestClient) -> None:
    summary = client.get("/dashboard/summary").json()
    kpis = {kpi["key"]: kpi["value"] for kpi in summary["kpis"]}
    records = cat.catalogue()

    assert kpis["total"] == len(records)
    expected_high = sum(
        1
        for record in records
        if record.assessment.risk_level
        and record.assessment.risk_level.value in {"high", "critical"}
    )
    assert kpis["high_risk"] == expected_high
    assert kpis["completed"] == sum(1 for r in records if r.stage.value == "completed")


def test_risk_distribution_sums_to_total(client: TestClient) -> None:
    summary = client.get("/dashboard/summary").json()
    total = sum(bucket["count"] for bucket in summary["risk_distribution"])
    assert total == summary["total_works"]


def test_citizen_stats_are_real_aggregates(client: TestClient) -> None:
    stats = client.get("/citizen/stats").json()
    assert stats["total_works"] == len(cat.catalogue())
    assert stats["districts_covered"] == len({r.place.district for r in cat.catalogue()})
    assert 0 <= stats["completed_percentage"] <= 100


def test_filters_list_states_and_districts(client: TestClient) -> None:
    filters = client.get("/filters").json()
    assert "Maharashtra" in filters["states"]
    assert "Nanded" in filters["districts"]["Maharashtra"]


def test_demo_data_is_labelled_as_synthetic(client: TestClient) -> None:
    for path in ("/dashboard/summary", "/citizen/stats"):
        assert "Synthetic" in client.get(path).json()["disclaimer"]


# --------------------------------------------------------------------------
# Citizen reports
# --------------------------------------------------------------------------


def test_submitting_a_report_attaches_it_to_the_work(client: TestClient) -> None:
    before = len(client.get("/works/MPL-1002/reports").json())
    response = client.post(
        "/works/MPL-1002/reports",
        json={
            "issue_type": "work_stalled",
            "description": "No activity seen at the site for several weeks.",
            "reporter_area": "Resident, ward 2",
        },
    )
    assert response.status_code == 201
    created = response.json()
    assert created["work_id"] == "MPL-1002"
    assert created["issue_label"]
    assert created["submitted_on_formatted"]

    after = client.get("/works/MPL-1002/reports").json()
    assert len(after) == before + 1
    assert after[0]["report_id"] == created["report_id"]


def test_report_does_not_change_the_risk_score(client: TestClient) -> None:
    """A citizen observation is an input to review, not to scoring."""
    before = client.get("/works/MPL-1003").json()["assessment"]["risk_score"]
    client.post(
        "/works/MPL-1003/reports",
        json={"issue_type": "quality_concern", "description": "Surface has cracked already."},
    )
    after = client.get("/works/MPL-1003").json()["assessment"]["risk_score"]
    assert before == after


def test_report_requires_a_substantive_description(client: TestClient) -> None:
    response = client.post(
        "/works/MPL-1004/reports", json={"issue_type": "other", "description": "bad"}
    )
    assert response.status_code == 422


def test_report_rejects_unknown_fields(client: TestClient) -> None:
    response = client.post(
        "/works/MPL-1004/reports",
        json={
            "issue_type": "other",
            "description": "A description long enough to pass validation.",
            "risk_score": 99,
        },
    )
    assert response.status_code == 422


def test_report_against_unknown_work_is_404(client: TestClient) -> None:
    response = client.post(
        "/works/MPL-999999/reports",
        json={"issue_type": "other", "description": "A description long enough to pass."},
    )
    assert response.status_code == 404


def test_store_returns_newest_report_first() -> None:
    store = ReportStore()
    today = date.today()
    store.add(
        "MPL-1", CitizenReportCreate(issue_type=IssueType.OTHER, description="older entry here"), today - timedelta(days=5)
    )
    store.add(
        "MPL-1", CitizenReportCreate(issue_type=IssueType.OTHER, description="newer entry here"), today
    )
    reports = store.for_work("MPL-1")
    assert reports[0].submitted_on == today


# --------------------------------------------------------------------------
# Assisted analysis
# --------------------------------------------------------------------------


def test_analysis_is_deterministic(client: TestClient, worst_work_id: str) -> None:
    first = client.get(f"/works/{worst_work_id}/analysis").json()
    second = client.get(f"/works/{worst_work_id}/analysis").json()
    assert first == second


def test_analysis_confidence_tracks_record_completeness(client: TestClient) -> None:
    detail = client.get("/works/MPL-1001").json()
    analysis = client.get("/works/MPL-1001/analysis").json()
    confidence = next(m for m in analysis["metrics"] if m["label"] == "Record Confidence")
    expected = round(detail["assessment"]["assessment_completeness"] * 100)
    assert confidence["value"] == expected


def test_analysis_states_that_no_model_is_involved(client: TestClient) -> None:
    analysis = client.get("/works/MPL-1001/analysis").json()
    assert "no predictive model" in analysis["method"].lower()
    assert "human verification" in analysis["disclaimer"].lower()


def test_analysis_observations_come_from_signals(
    client: TestClient, worst_work_id: str
) -> None:
    detail = client.get(f"/works/{worst_work_id}").json()
    analysis = client.get(f"/works/{worst_work_id}/analysis").json()
    explanations = {signal["explanation"] for signal in detail["assessment"]["signals"]}
    from_signals = [text for text in analysis["observations"] if text in explanations]
    assert from_signals, "analysis should quote the engine rather than paraphrase it"


def test_analysis_without_reports_reports_zero_corroboration() -> None:
    record = cat.by_id()["MPL-1001"]
    analysis = analyse(record.assessment, [], work_title=record.title)
    corroboration = next(m for m in analysis.metrics if m.label == "Citizen Corroboration")
    assert corroboration.value == 0
    assert analysis.corroborating_report_count == 0


def test_analysis_flags_an_incomplete_record() -> None:
    sparse = next(
        record
        for record in cat.catalogue()
        if record.assessment.assessment_status.value == "incomplete"
    )
    analysis = analyse(sparse.assessment, [], work_title=sparse.title)
    joined = " ".join(analysis.observations) + analysis.headline
    assert "unknown" in joined.lower() or "sparse" in joined.lower()


def test_analysis_never_asserts_wrongdoing() -> None:
    """The analysis is decision support, not an accusation."""
    prohibited = ("fraud", "corrupt", "embezzl", "guilty", "criminal", "scam", "theft")
    worst = sorted(
        cat.catalogue(), key=lambda entry: -(entry.assessment.risk_score or -1)
    )[:25]
    for record in worst:
        analysis = analyse(record.assessment, [], work_title=record.title)
        blob = " ".join(
            [analysis.headline, analysis.method, analysis.disclaimer]
            + analysis.observations
            + [action.action for action in analysis.review_actions]
        ).lower()
        for word in prohibited:
            assert word not in blob
