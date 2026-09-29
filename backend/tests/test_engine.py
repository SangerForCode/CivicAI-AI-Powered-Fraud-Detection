"""Tests for the risk-scoring engine."""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.engine import constants as C
from app.engine.formatting import format_inr
from app.engine.rules import ALL_RULES
from app.engine.scoring import assess
from app.main import app
from app.schemas import (
    AssessmentStatus,
    DimensionKey,
    ProjectInput,
    RiskLevel,
)

client = TestClient(app)


def project(**overrides) -> ProjectInput:
    """A fully-specified, unremarkable project that triggers nothing."""
    base = dict(
        project_id="MPL-TEST",
        project_name="Test Work",
        state="Maharashtra",
        district="Nanded",
        category="road",
        sanctioned_amount=1_000_000,
        amount_spent=400_000,
        completion_percentage=45,
        planned_duration_days=180,
        elapsed_days=80,
        project_stage="in_progress",
        documents=["Sanction Order", "Work Order", "Progress Report"],
        days_since_last_update=10,
    )
    base.update(overrides)
    return ProjectInput(**base)


def triggered(result) -> set[str]:
    return {signal.rule_id for signal in result.signals}


# --- baseline ---------------------------------------------------------------


def test_clean_project_triggers_nothing_and_is_complete():
    result = assess(project())
    assert result.signals == []
    assert result.risk_score == 0.0
    assert result.risk_level is RiskLevel.LOW
    assert result.assessment_status is AssessmentStatus.COMPLETE
    assert result.assessment_completeness == 1.0
    assert all(d.available for d in result.dimensions)


def test_all_four_dimensions_always_present_and_in_order():
    result = assess(ProjectInput(project_id="MPL-BARE"))
    assert [d.key for d in result.dimensions] == list(DimensionKey)


# --- financial rules --------------------------------------------------------


def test_fin_001_spend_above_sanction():
    result = assess(project(sanctioned_amount=1_000_000, amount_spent=1_200_000))
    assert "FIN-001" in triggered(result)


def test_fin_002_spend_ahead_of_completion():
    result = assess(project(sanctioned_amount=1_000_000, amount_spent=850_000, completion_percentage=40))
    assert "FIN-002" in triggered(result)
    signal = next(s for s in result.signals if s.rule_id == "FIN-002")
    assert set(signal.evidence_fields) == {"amount_spent", "completion_percentage", "sanctioned_amount"}
    assert "₹8,50,000" in [o.value for o in signal.observed]


def test_fin_003_near_full_utilisation_low_completion():
    result = assess(project(sanctioned_amount=1_000_000, amount_spent=950_000, completion_percentage=30))
    assert "FIN-003" in triggered(result)


def test_fin_004_completed_but_underspent():
    result = assess(
        project(
            sanctioned_amount=1_000_000,
            amount_spent=400_000,
            completion_percentage=100,
            project_stage="completed",
            documents=["Sanction Order", "Completion Certificate", "Utilisation Certificate"],
        )
    )
    assert "FIN-004" in triggered(result)


def test_fin_005_spend_with_zero_completion():
    result = assess(project(sanctioned_amount=1_000_000, amount_spent=300_000, completion_percentage=0))
    assert "FIN-005" in triggered(result)


def test_zero_sanction_skips_ratio_rules_without_dividing_by_zero():
    result = assess(project(sanctioned_amount=0, amount_spent=0, completion_percentage=10))
    assert not any(s.rule_id in {"FIN-002", "FIN-003", "FIN-005"} for s in result.signals)
    assert "DQ-002" in {w.code for w in result.data_quality_warnings}


# --- timeline rules ---------------------------------------------------------


def test_tim_001_moderate_overrun():
    result = assess(project(planned_duration_days=100, elapsed_days=120, completion_percentage=80))
    assert "TIM-001" in triggered(result)
    assert "TIM-002" not in triggered(result)


def test_tim_002_severe_overrun_excludes_tim_001():
    result = assess(project(planned_duration_days=100, elapsed_days=300, completion_percentage=40))
    assert "TIM-002" in triggered(result)
    assert "TIM-001" not in triggered(result)


def test_tim_003_time_ahead_of_progress():
    result = assess(project(planned_duration_days=100, elapsed_days=70, completion_percentage=20))
    assert "TIM-003" in triggered(result)


def test_tim_004_abandoned():
    result = assess(project(project_stage="abandoned"))
    assert "TIM-004" in triggered(result)


def test_completed_work_past_schedule_does_not_trigger_overrun():
    result = assess(
        project(
            planned_duration_days=100,
            elapsed_days=200,
            completion_percentage=100,
            project_stage="completed",
            documents=["Sanction Order", "Completion Certificate", "Utilisation Certificate"],
        )
    )
    assert "TIM-001" not in triggered(result)
    assert "TIM-002" not in triggered(result)


# --- documentation rules ----------------------------------------------------


def test_doc_001_missing_sanction_order():
    result = assess(project(documents=["Progress Report"]))
    assert "DOC-001" in triggered(result)


def test_doc_002_and_003_for_completed_work_without_certificates():
    result = assess(project(project_stage="completed", documents=["Sanction Order"]))
    assert {"DOC-002", "DOC-003"} <= triggered(result)


def test_doc_004_active_work_without_progress_record():
    result = assess(project(documents=["Sanction Order", "Work Order"]))
    assert "DOC-004" in triggered(result)


def test_doc_005_empty_document_list_is_a_known_absence():
    result = assess(project(documents=[]))
    assert "DOC-005" in triggered(result)
    docs = next(d for d in result.dimensions if d.key is DimensionKey.DOCUMENTATION_GAPS)
    assert docs.available, "an empty list is known information, so the dimension is assessable"


def test_document_matching_is_case_and_suffix_insensitive():
    result = assess(project(documents=["SANCTION ORDER (signed scan)", "Progress Report - Q2"]))
    assert "DOC-001" not in triggered(result)
    assert "DOC-004" not in triggered(result)


# --- stale reporting --------------------------------------------------------


@pytest.mark.parametrize(
    "days,expected",
    [(10, None), (45, "STL-003"), (120, "STL-001"), (400, "STL-002")],
)
def test_stale_reporting_bands_are_exclusive(days, expected):
    result = assess(project(days_since_last_update=days))
    stale = {s for s in triggered(result) if s.startswith("STL-")}
    assert stale == (set() if expected is None else {expected})


def test_stale_rules_only_apply_to_active_works():
    result = assess(
        project(
            project_stage="completed",
            days_since_last_update=400,
            documents=["Sanction Order", "Completion Certificate", "Utilisation Certificate"],
        )
    )
    assert not any(s.rule_id.startswith("STL-") for s in result.signals)


def test_last_progress_update_is_derived_into_days_since_update():
    today = date(2026, 9, 29)
    result = assess(
        project(days_since_last_update=None, last_progress_update=today - timedelta(days=120)),
        today=today,
    )
    assert "STL-001" in triggered(result)


# --- missing data and rescaling --------------------------------------------


def test_bare_project_is_incomplete_with_no_score():
    result = assess(ProjectInput(project_id="MPL-BARE"))
    assert result.risk_score is None
    assert result.risk_level is None
    assert result.assessment_status is AssessmentStatus.INCOMPLETE
    assert result.assessment_completeness == 0.0
    assert all(not d.available for d in result.dimensions)
    assert all(d.score is None for d in result.dimensions)


def test_score_is_rescaled_over_available_weight_only():
    """A single bad dimension in isolation must not be diluted by unknown ones."""
    result = assess(
        ProjectInput(
            project_id="MPL-PARTIAL",
            sanctioned_amount=1_000_000,
            amount_spent=1_500_000,
            completion_percentage=10,
        )
    )
    financial = next(d for d in result.dimensions if d.key is DimensionKey.FINANCIAL_ANOMALY)
    assert financial.available
    # Only the financial dimension is assessable, so the overall score equals it.
    assert result.risk_score == financial.score
    assert result.risk_level is RiskLevel.CRITICAL
    assert result.assessment_status is AssessmentStatus.INCOMPLETE
    expected = C.DIMENSION_WEIGHTS[DimensionKey.FINANCIAL_ANOMALY]
    assert result.assessment_completeness == pytest.approx(expected)


def test_missing_field_is_never_treated_as_zero():
    unknown = assess(ProjectInput(project_id="MPL-A", sanctioned_amount=1_000_000))
    known_zero = assess(ProjectInput(project_id="MPL-B", sanctioned_amount=1_000_000, amount_spent=0, completion_percentage=0))
    unknown_fin = next(d for d in unknown.dimensions if d.key is DimensionKey.FINANCIAL_ANOMALY)
    known_fin = next(d for d in known_zero.dimensions if d.key is DimensionKey.FINANCIAL_ANOMALY)
    assert unknown_fin.available is False
    assert known_fin.available is True


def test_unavailable_dimension_names_what_is_missing():
    result = assess(ProjectInput(project_id="MPL-X"))
    timeline = next(d for d in result.dimensions if d.key is DimensionKey.TIMELINE_ANOMALY)
    assert "planned_duration_days" in timeline.missing_fields
    assert "planned_duration_days" in timeline.explanation


def test_dimension_score_saturates_at_100():
    result = assess(
        project(
            sanctioned_amount=1_000_000,
            amount_spent=2_000_000,
            completion_percentage=0,
        )
    )
    financial = next(d for d in result.dimensions if d.key is DimensionKey.FINANCIAL_ANOMALY)
    assert 0 <= financial.score <= 100


def test_partially_assessed_dimension_is_flagged_incomplete():
    """documents present but stage unknown: DOC-005 runs, the stage rules cannot."""
    result = assess(ProjectInput(project_id="MPL-D", documents=["Sanction Order"]))
    docs = next(d for d in result.dimensions if d.key is DimensionKey.DOCUMENTATION_GAPS)
    assert docs.available
    assert "project_stage" in docs.missing_fields
    assert result.assessment_status is AssessmentStatus.INCOMPLETE


# --- data quality -----------------------------------------------------------


def test_spend_without_sanction_raises_data_quality_warning():
    result = assess(ProjectInput(project_id="MPL-Q", amount_spent=500_000))
    assert "DQ-001" in {w.code for w in result.data_quality_warnings}


def test_contradictory_stage_and_completion_are_reported():
    result = assess(project(completion_percentage=100, project_stage="in_progress"))
    assert "DQ-003" in {w.code for w in result.data_quality_warnings}


# --- ordering, formatting, language ----------------------------------------


def test_signals_are_ordered_most_severe_first():
    result = assess(
        project(
            sanctioned_amount=1_000_000,
            amount_spent=1_500_000,
            completion_percentage=5,
            planned_duration_days=100,
            elapsed_days=400,
            documents=[],
            days_since_last_update=365,
        )
    )
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    ranks = [order[s.severity.value] for s in result.signals]
    assert ranks == sorted(ranks)


@pytest.mark.parametrize(
    "amount,expected",
    [(0, "₹0"), (500, "₹500"), (8_50_000, "₹8,50,000"), (1_00_00_000, "₹1,00,00,000"), (12_345, "₹12,345")],
)
def test_indian_digit_grouping(amount, expected):
    assert format_inr(amount) == expected


def test_no_rule_alleges_wrongdoing():
    """Copy must frame output as signals for review, never as a finding."""
    banned = (
        "fraud", "fraudulent", "corrupt", "corruption", "guilty", "guilt",
        "embezzle", "misappropriat", "criminal", "theft", "scam", "bribe",
    )
    corpus = " ".join(rule.description for rule in ALL_RULES).lower()
    for project_case in (
        project(sanctioned_amount=1_000_000, amount_spent=2_000_000, completion_percentage=0, documents=[]),
        project(project_stage="abandoned"),
    ):
        corpus += " " + " ".join(s.explanation for s in assess(project_case).signals).lower()
    offenders = [term for term in banned if term in corpus]
    assert not offenders, f"rule copy must not allege wrongdoing: {offenders}"


def test_disclaimer_is_always_returned():
    assert assess(ProjectInput(project_id="MPL-Z")).disclaimer == C.DISCLAIMER


def test_rule_ids_are_unique():
    ids = [rule.rule_id for rule in ALL_RULES]
    assert len(ids) == len(set(ids))


# --- API --------------------------------------------------------------------


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_assess_endpoint_returns_full_assessment():
    response = client.post(
        "/risk/assess",
        json={
            "project_id": "MPL-8842",
            "sanctioned_amount": 1000000,
            "amount_spent": 850000,
            "completion_percentage": 40,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["project_id"] == "MPL-8842"
    assert len(body["dimensions"]) == 4
    assert any(s["rule_id"] == "FIN-002" for s in body["signals"])
    assert body["assessment_status"] == "incomplete"
    assert body["disclaimer"]


def test_assess_rejects_out_of_range_completion():
    response = client.post("/risk/assess", json={"project_id": "MPL-1", "completion_percentage": 140})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "completion_percentage"


def test_assess_rejects_negative_amount():
    response = client.post("/risk/assess", json={"project_id": "MPL-1", "amount_spent": -5})
    assert response.status_code == 422


def test_assess_rejects_missing_project_id():
    assert client.post("/risk/assess", json={}).status_code == 422


def test_assess_rejects_unknown_field():
    response = client.post("/risk/assess", json={"project_id": "MPL-1", "nonsense": 1})
    assert response.status_code == 422


def test_omitted_fields_stay_unknown_over_the_wire():
    body = client.post("/risk/assess", json={"project_id": "MPL-1"}).json()
    assert body["risk_score"] is None
    assert "amount_spent" in body["missing_fields"]


def test_rules_endpoint_lists_the_catalogue():
    body = client.get("/risk/rules").json()
    assert len(body["rules"]) == len(ALL_RULES)
    assert body["disclaimer"]
