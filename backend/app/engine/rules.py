"""The rule catalogue.

Each rule is a pure function of a :class:`ProjectInput` that either returns a
:class:`RiskSignal` or ``None``. A rule declares the fields it needs; the
dimension layer only evaluates rules whose inputs are present, so a rule body
can assume its required fields are non-``None``.

Rule copy describes *what was observed*. It never asserts intent, wrongdoing or
a finding — these are signals for human review, and a test enforces that.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from decimal import Decimal

from app.engine import constants as C
from app.engine.formatting import (
    format_days,
    format_inr,
    format_percentage,
    format_ratio_as_percentage,
)
from app.schemas import DimensionKey, ObservedValue, ProjectInput, RiskSignal, Severity


@dataclass(frozen=True)
class Rule:
    rule_id: str
    dimension: DimensionKey
    severity: Severity
    description: str
    required_fields: tuple[str, ...]
    evaluate: Callable[[ProjectInput], RiskSignal | None] = field(repr=False)


def _signal(
    rule: "RuleSpec",
    explanation: str,
    observed: list[ObservedValue],
    evidence_fields: list[str],
) -> RiskSignal:
    return RiskSignal(
        rule_id=rule.rule_id,
        dimension=rule.dimension,
        severity=rule.severity,
        explanation=explanation,
        observed=observed,
        evidence_fields=evidence_fields,
    )


@dataclass(frozen=True)
class RuleSpec:
    """The identity half of a rule, referenced by its own evaluator."""

    rule_id: str
    dimension: DimensionKey
    severity: Severity
    description: str
    required_fields: tuple[str, ...]


def _spend_ratio(project: ProjectInput) -> float:
    """Expenditure as a share of sanction. Callers guarantee sanction > 0."""
    assert project.sanctioned_amount is not None and project.amount_spent is not None
    return float(project.amount_spent / project.sanctioned_amount)


def _has_document(project: ProjectInput, needle: str) -> bool:
    """Case-insensitive substring match against recorded document names."""
    documents = project.documents or []
    return any(needle in name.lower() for name in documents)


# --------------------------------------------------------------------------
# Financial anomaly
# --------------------------------------------------------------------------

FIN_001 = RuleSpec(
    rule_id="FIN-001",
    dimension=DimensionKey.FINANCIAL_ANOMALY,
    severity=Severity.CRITICAL,
    description="Reported expenditure exceeds the sanctioned amount.",
    required_fields=("sanctioned_amount", "amount_spent"),
)


def _eval_fin_001(project: ProjectInput) -> RiskSignal | None:
    if project.amount_spent <= project.sanctioned_amount:
        return None
    excess = project.amount_spent - project.sanctioned_amount
    return _signal(
        FIN_001,
        "Reported expenditure exceeds the sanctioned amount for this work.",
        [
            ObservedValue(label="Sanctioned amount", value=format_inr(project.sanctioned_amount)),
            ObservedValue(label="Amount spent", value=format_inr(project.amount_spent)),
            ObservedValue(label="Excess", value=format_inr(excess)),
        ],
        ["sanctioned_amount", "amount_spent"],
    )


FIN_002 = RuleSpec(
    rule_id="FIN-002",
    dimension=DimensionKey.FINANCIAL_ANOMALY,
    severity=Severity.HIGH,
    description="Reported expenditure is substantially higher than physical completion.",
    required_fields=("sanctioned_amount", "amount_spent", "completion_percentage"),
)


def _eval_fin_002(project: ProjectInput) -> RiskSignal | None:
    if project.sanctioned_amount == 0:
        return None
    ratio = _spend_ratio(project)
    gap = ratio - (project.completion_percentage / 100.0)
    if gap <= C.FIN_SPEND_AHEAD_OF_COMPLETION:
        return None
    return _signal(
        FIN_002,
        "Reported expenditure is substantially higher than physical completion.",
        [
            ObservedValue(label="Amount spent", value=format_inr(project.amount_spent)),
            ObservedValue(label="Completion", value=format_percentage(project.completion_percentage)),
            ObservedValue(label="Utilisation", value=format_ratio_as_percentage(ratio)),
        ],
        ["amount_spent", "completion_percentage", "sanctioned_amount"],
    )


FIN_003 = RuleSpec(
    rule_id="FIN-003",
    dimension=DimensionKey.FINANCIAL_ANOMALY,
    severity=Severity.HIGH,
    description="Near-complete fund utilisation alongside low reported completion.",
    required_fields=("sanctioned_amount", "amount_spent", "completion_percentage"),
)


def _eval_fin_003(project: ProjectInput) -> RiskSignal | None:
    if project.sanctioned_amount == 0:
        return None
    ratio = _spend_ratio(project)
    if ratio < C.FIN_NEAR_FULL_UTILISATION or project.completion_percentage >= C.FIN_LOW_COMPLETION:
        return None
    return _signal(
        FIN_003,
        "Almost the whole sanctioned amount has been utilised while reported physical completion remains low.",
        [
            ObservedValue(label="Utilisation", value=format_ratio_as_percentage(ratio)),
            ObservedValue(label="Completion", value=format_percentage(project.completion_percentage)),
        ],
        ["amount_spent", "sanctioned_amount", "completion_percentage"],
    )


FIN_004 = RuleSpec(
    rule_id="FIN-004",
    dimension=DimensionKey.FINANCIAL_ANOMALY,
    severity=Severity.MEDIUM,
    description="Work reported complete with materially lower expenditure than sanctioned.",
    required_fields=("sanctioned_amount", "amount_spent", "project_stage"),
)


def _eval_fin_004(project: ProjectInput) -> RiskSignal | None:
    if project.project_stage.value != "completed" or project.sanctioned_amount == 0:
        return None
    ratio = _spend_ratio(project)
    if ratio >= C.FIN_COMPLETED_UNDERSPEND:
        return None
    return _signal(
        FIN_004,
        "The work is reported complete, but expenditure is materially below the sanctioned amount. "
        "This may reflect savings, or an incomplete expenditure record.",
        [
            ObservedValue(label="Sanctioned amount", value=format_inr(project.sanctioned_amount)),
            ObservedValue(label="Amount spent", value=format_inr(project.amount_spent)),
            ObservedValue(label="Utilisation", value=format_ratio_as_percentage(ratio)),
        ],
        ["sanctioned_amount", "amount_spent", "project_stage"],
    )


FIN_005 = RuleSpec(
    rule_id="FIN-005",
    dimension=DimensionKey.FINANCIAL_ANOMALY,
    severity=Severity.MEDIUM,
    description="Expenditure recorded against zero reported physical completion.",
    required_fields=("sanctioned_amount", "amount_spent", "completion_percentage"),
)


def _eval_fin_005(project: ProjectInput) -> RiskSignal | None:
    if project.completion_percentage != 0 or project.sanctioned_amount == 0:
        return None
    ratio = _spend_ratio(project)
    if ratio <= C.FIN_SPEND_WITH_NO_PROGRESS:
        return None
    return _signal(
        FIN_005,
        "Expenditure has been recorded while reported physical completion is still zero.",
        [
            ObservedValue(label="Amount spent", value=format_inr(project.amount_spent)),
            ObservedValue(label="Completion", value=format_percentage(0)),
        ],
        ["amount_spent", "completion_percentage", "sanctioned_amount"],
    )


# --------------------------------------------------------------------------
# Timeline anomaly
# --------------------------------------------------------------------------

TIM_001 = RuleSpec(
    rule_id="TIM-001",
    dimension=DimensionKey.TIMELINE_ANOMALY,
    severity=Severity.HIGH,
    description="Elapsed time has passed the planned duration while the work is incomplete.",
    required_fields=("planned_duration_days", "elapsed_days", "completion_percentage"),
)


def _eval_tim_001(project: ProjectInput) -> RiskSignal | None:
    ratio = project.elapsed_days / project.planned_duration_days
    # TIM-002 covers the severe band; this rule reports the moderate overrun only.
    if ratio <= C.TIM_OVERRUN or ratio > C.TIM_SEVERE_OVERRUN:
        return None
    if project.completion_percentage >= 100:
        return None
    return _signal(
        TIM_001,
        "The work has passed its planned duration and is not yet reported complete.",
        [
            ObservedValue(label="Planned duration", value=format_days(project.planned_duration_days)),
            ObservedValue(label="Elapsed", value=format_days(project.elapsed_days)),
            ObservedValue(label="Completion", value=format_percentage(project.completion_percentage)),
        ],
        ["planned_duration_days", "elapsed_days", "completion_percentage"],
    )


TIM_002 = RuleSpec(
    rule_id="TIM-002",
    dimension=DimensionKey.TIMELINE_ANOMALY,
    severity=Severity.CRITICAL,
    description="Elapsed time far exceeds the planned duration while the work is incomplete.",
    required_fields=("planned_duration_days", "elapsed_days", "completion_percentage"),
)


def _eval_tim_002(project: ProjectInput) -> RiskSignal | None:
    ratio = project.elapsed_days / project.planned_duration_days
    if ratio <= C.TIM_SEVERE_OVERRUN or project.completion_percentage >= 100:
        return None
    overrun_days = project.elapsed_days - project.planned_duration_days
    return _signal(
        TIM_002,
        "Elapsed time far exceeds the planned duration and the work is not yet reported complete.",
        [
            ObservedValue(label="Planned duration", value=format_days(project.planned_duration_days)),
            ObservedValue(label="Elapsed", value=format_days(project.elapsed_days)),
            ObservedValue(label="Overrun", value=format_days(overrun_days)),
            ObservedValue(label="Completion", value=format_percentage(project.completion_percentage)),
        ],
        ["planned_duration_days", "elapsed_days", "completion_percentage"],
    )


TIM_003 = RuleSpec(
    rule_id="TIM-003",
    dimension=DimensionKey.TIMELINE_ANOMALY,
    severity=Severity.MEDIUM,
    description="Share of planned time consumed is well ahead of reported progress.",
    required_fields=("planned_duration_days", "elapsed_days", "completion_percentage"),
)


def _eval_tim_003(project: ProjectInput) -> RiskSignal | None:
    time_ratio = project.elapsed_days / project.planned_duration_days
    gap = time_ratio - (project.completion_percentage / 100.0)
    if gap <= C.TIM_TIME_AHEAD_OF_PROGRESS:
        return None
    return _signal(
        TIM_003,
        "A substantially larger share of the planned schedule has been consumed than of the physical work.",
        [
            ObservedValue(label="Schedule consumed", value=format_ratio_as_percentage(time_ratio)),
            ObservedValue(label="Completion", value=format_percentage(project.completion_percentage)),
        ],
        ["elapsed_days", "planned_duration_days", "completion_percentage"],
    )


TIM_004 = RuleSpec(
    rule_id="TIM-004",
    dimension=DimensionKey.TIMELINE_ANOMALY,
    severity=Severity.HIGH,
    description="The work is recorded as abandoned.",
    required_fields=("project_stage",),
)


def _eval_tim_004(project: ProjectInput) -> RiskSignal | None:
    if project.project_stage.value != "abandoned":
        return None
    return _signal(
        TIM_004,
        "The work is recorded as abandoned and has no expected completion path.",
        [ObservedValue(label="Project stage", value="Abandoned")],
        ["project_stage"],
    )


# --------------------------------------------------------------------------
# Documentation gaps
# --------------------------------------------------------------------------

DOC_001 = RuleSpec(
    rule_id="DOC-001",
    dimension=DimensionKey.DOCUMENTATION_GAPS,
    severity=Severity.HIGH,
    description="No sanction order on record for a sanctioned or later work.",
    required_fields=("documents", "project_stage"),
)

_POST_SANCTION_STAGES = ("sanctioned", "in_progress", "completed", "abandoned")


def _eval_doc_001(project: ProjectInput) -> RiskSignal | None:
    if project.project_stage.value not in _POST_SANCTION_STAGES:
        return None
    if _has_document(project, C.DOC_SANCTION_ORDER):
        return None
    return _signal(
        DOC_001,
        "No sanction order is recorded although the work has reached or passed the sanction stage.",
        [
            ObservedValue(label="Project stage", value=project.project_stage.value.replace("_", " ").title()),
            ObservedValue(label="Documents on record", value=_documents_summary(project)),
        ],
        ["documents", "project_stage"],
    )


DOC_002 = RuleSpec(
    rule_id="DOC-002",
    dimension=DimensionKey.DOCUMENTATION_GAPS,
    severity=Severity.CRITICAL,
    description="No utilisation certificate on record for a completed work.",
    required_fields=("documents", "project_stage"),
)


def _eval_doc_002(project: ProjectInput) -> RiskSignal | None:
    if project.project_stage.value != "completed":
        return None
    if _has_document(project, C.DOC_UTILISATION_CERTIFICATE):
        return None
    return _signal(
        DOC_002,
        "The work is reported complete but no utilisation certificate is on record.",
        [ObservedValue(label="Documents on record", value=_documents_summary(project))],
        ["documents", "project_stage"],
    )


DOC_003 = RuleSpec(
    rule_id="DOC-003",
    dimension=DimensionKey.DOCUMENTATION_GAPS,
    severity=Severity.HIGH,
    description="No completion certificate on record for a completed work.",
    required_fields=("documents", "project_stage"),
)


def _eval_doc_003(project: ProjectInput) -> RiskSignal | None:
    if project.project_stage.value != "completed":
        return None
    if _has_document(project, C.DOC_COMPLETION_CERTIFICATE):
        return None
    return _signal(
        DOC_003,
        "The work is reported complete but no completion certificate is on record.",
        [ObservedValue(label="Documents on record", value=_documents_summary(project))],
        ["documents", "project_stage"],
    )


DOC_004 = RuleSpec(
    rule_id="DOC-004",
    dimension=DimensionKey.DOCUMENTATION_GAPS,
    severity=Severity.MEDIUM,
    description="No progress report or measurement book for a work under execution.",
    required_fields=("documents", "project_stage"),
)


def _eval_doc_004(project: ProjectInput) -> RiskSignal | None:
    if project.project_stage.value not in C.ACTIVE_STAGES:
        return None
    if _has_document(project, C.DOC_PROGRESS_REPORT) or _has_document(project, C.DOC_MEASUREMENT_BOOK):
        return None
    return _signal(
        DOC_004,
        "The work is under execution but neither a progress report nor a measurement book is on record.",
        [ObservedValue(label="Documents on record", value=_documents_summary(project))],
        ["documents", "project_stage"],
    )


DOC_005 = RuleSpec(
    rule_id="DOC-005",
    dimension=DimensionKey.DOCUMENTATION_GAPS,
    severity=Severity.HIGH,
    description="No documents at all are recorded against the work.",
    required_fields=("documents",),
)


def _eval_doc_005(project: ProjectInput) -> RiskSignal | None:
    if project.documents:
        return None
    return _signal(
        DOC_005,
        "No supporting documents of any kind are recorded against this work.",
        [ObservedValue(label="Documents on record", value="None")],
        ["documents"],
    )


def _documents_summary(project: ProjectInput) -> str:
    documents = project.documents or []
    return ", ".join(documents) if documents else "None"


# --------------------------------------------------------------------------
# Stale progress reporting
# --------------------------------------------------------------------------

STL_001 = RuleSpec(
    rule_id="STL-001",
    dimension=DimensionKey.STALE_PROGRESS,
    severity=Severity.HIGH,
    description="No progress update for over 90 days on a work under execution.",
    required_fields=("days_since_last_update", "project_stage"),
)


def _eval_stl_001(project: ProjectInput) -> RiskSignal | None:
    if project.project_stage.value not in C.ACTIVE_STAGES:
        return None
    days = project.days_since_last_update
    # STL-002 covers beyond the severe threshold.
    if not (C.STL_HIGH_DAYS < days <= C.STL_SEVERE_DAYS):
        return None
    return _signal(
        STL_001,
        "No progress update has been recorded for over 90 days on a work under execution.",
        [ObservedValue(label="Days since last update", value=format_days(days))],
        ["days_since_last_update", "project_stage"],
    )


STL_002 = RuleSpec(
    rule_id="STL-002",
    dimension=DimensionKey.STALE_PROGRESS,
    severity=Severity.CRITICAL,
    description="No progress update for over 180 days on a work under execution.",
    required_fields=("days_since_last_update", "project_stage"),
)


def _eval_stl_002(project: ProjectInput) -> RiskSignal | None:
    if project.project_stage.value not in C.ACTIVE_STAGES:
        return None
    if project.days_since_last_update <= C.STL_SEVERE_DAYS:
        return None
    return _signal(
        STL_002,
        "No progress update has been recorded for over 180 days on a work under execution.",
        [ObservedValue(label="Days since last update", value=format_days(project.days_since_last_update))],
        ["days_since_last_update", "project_stage"],
    )


STL_003 = RuleSpec(
    rule_id="STL-003",
    dimension=DimensionKey.STALE_PROGRESS,
    severity=Severity.LOW,
    description="No progress update for 30 to 90 days on a work under execution.",
    required_fields=("days_since_last_update", "project_stage"),
)


def _eval_stl_003(project: ProjectInput) -> RiskSignal | None:
    if project.project_stage.value not in C.ACTIVE_STAGES:
        return None
    days = project.days_since_last_update
    if not (C.STL_MODERATE_DAYS < days <= C.STL_HIGH_DAYS):
        return None
    return _signal(
        STL_003,
        "The most recent progress update on this work is more than 30 days old.",
        [ObservedValue(label="Days since last update", value=format_days(days))],
        ["days_since_last_update", "project_stage"],
    )


# --------------------------------------------------------------------------
# Catalogue
# --------------------------------------------------------------------------

def _build(spec: RuleSpec, evaluator: Callable[[ProjectInput], RiskSignal | None]) -> Rule:
    return Rule(
        rule_id=spec.rule_id,
        dimension=spec.dimension,
        severity=spec.severity,
        description=spec.description,
        required_fields=spec.required_fields,
        evaluate=evaluator,
    )


ALL_RULES: tuple[Rule, ...] = (
    _build(FIN_001, _eval_fin_001),
    _build(FIN_002, _eval_fin_002),
    _build(FIN_003, _eval_fin_003),
    _build(FIN_004, _eval_fin_004),
    _build(FIN_005, _eval_fin_005),
    _build(TIM_001, _eval_tim_001),
    _build(TIM_002, _eval_tim_002),
    _build(TIM_003, _eval_tim_003),
    _build(TIM_004, _eval_tim_004),
    _build(DOC_001, _eval_doc_001),
    _build(DOC_002, _eval_doc_002),
    _build(DOC_003, _eval_doc_003),
    _build(DOC_004, _eval_doc_004),
    _build(DOC_005, _eval_doc_005),
    _build(STL_001, _eval_stl_001),
    _build(STL_002, _eval_stl_002),
    _build(STL_003, _eval_stl_003),
)


def rules_for_dimension(dimension: DimensionKey) -> tuple[Rule, ...]:
    return tuple(rule for rule in ALL_RULES if rule.dimension is dimension)
