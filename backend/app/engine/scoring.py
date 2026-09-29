"""Dimension availability, aggregation and the overall risk score.

The central idea: a dimension is scored only when its inputs are present, and
the overall score is rescaled over the weight that was actually assessable. A
project with three unknown dimensions must not look low-risk merely because the
unknown parts contributed zero.
"""

from __future__ import annotations

from datetime import date

from app.engine import constants as C
from app.engine.rules import ALL_RULES, Rule, rules_for_dimension
from app.schemas import (
    AssessmentStatus,
    DataQualityWarning,
    DimensionKey,
    DimensionResult,
    DimensionStatus,
    ProjectInput,
    RiskAssessment,
    RiskLevel,
    RiskSignal,
    Severity,
)

_SEVERITY_ORDER = {
    Severity.CRITICAL: 0,
    Severity.HIGH: 1,
    Severity.MEDIUM: 2,
    Severity.LOW: 3,
    Severity.INFO: 4,
}

#: Fields the engine can reason about, in a stable display order.
_SCORING_FIELDS: tuple[str, ...] = (
    "sanctioned_amount",
    "amount_spent",
    "completion_percentage",
    "planned_duration_days",
    "elapsed_days",
    "project_stage",
    "documents",
    "days_since_last_update",
)


def normalise(project: ProjectInput, today: date | None = None) -> ProjectInput:
    """Fill ``days_since_last_update`` from ``last_progress_update`` when needed.

    Derivation lives here rather than in the client so no date arithmetic that
    affects a score happens outside the engine.
    """
    if project.days_since_last_update is not None or project.last_progress_update is None:
        return project
    reference = today or date.today()
    delta = (reference - project.last_progress_update).days
    return project.model_copy(update={"days_since_last_update": max(delta, 0)})


def _field_is_present(project: ProjectInput, name: str) -> bool:
    """``documents=[]`` counts as present: an empty set on record is a known fact."""
    return getattr(project, name) is not None


def _missing_for_rule(project: ProjectInput, rule: Rule) -> list[str]:
    return [name for name in rule.required_fields if not _field_is_present(project, name)]


def _dimension_required_fields(dimension: DimensionKey) -> list[str]:
    seen: list[str] = []
    for rule in rules_for_dimension(dimension):
        for name in rule.required_fields:
            if name not in seen:
                seen.append(name)
    return seen


def _score_from_signals(signals: list[RiskSignal]) -> float:
    """Combine severities into a 0-100 dimension score.

    Contributions combine with diminishing returns rather than summing, so a
    dimension cannot be pushed past 100 by stacking rules, and the strongest
    signal always dominates.
    """
    if not signals:
        return 0.0
    remaining = 100.0
    for signal in sorted(signals, key=lambda s: _SEVERITY_ORDER[s.severity]):
        points = C.SEVERITY_POINTS[signal.severity]
        remaining -= remaining * (points / 100.0)
    return round(100.0 - remaining, 1)


def _evaluate_dimension(project: ProjectInput, dimension: DimensionKey) -> tuple[DimensionResult, list[RiskSignal]]:
    rules = rules_for_dimension(dimension)
    weight = C.DIMENSION_WEIGHTS[dimension]
    label = C.DIMENSION_LABELS[dimension]
    required = _dimension_required_fields(dimension)

    evaluable = [rule for rule in rules if not _missing_for_rule(project, rule)]
    missing = [name for name in required if not _field_is_present(project, name)]

    if not evaluable:
        return (
            DimensionResult(
                key=dimension,
                label=label,
                score=None,
                weight=weight,
                available=False,
                status=DimensionStatus.UNAVAILABLE,
                triggered_rules=[],
                explanation=(
                    f"Not assessed. This dimension requires information that was not provided: "
                    f"{', '.join(missing)}."
                ),
                required_fields=required,
                missing_fields=missing,
            ),
            [],
        )

    signals = [signal for rule in evaluable if (signal := rule.evaluate(project)) is not None]
    score = _score_from_signals(signals)

    if signals:
        explanation = (
            f"{len(signals)} rule{'s' if len(signals) != 1 else ''} triggered on the information provided."
        )
    else:
        explanation = "No rules triggered on the information provided."
    if missing:
        explanation += (
            f" Partly assessed: {len(evaluable)} of {len(rules)} rules could be evaluated, "
            f"as {', '.join(missing)} {'were' if len(missing) > 1 else 'was'} not provided."
        )

    return (
        DimensionResult(
            key=dimension,
            label=label,
            score=score,
            weight=weight,
            available=True,
            status=DimensionStatus.AVAILABLE,
            triggered_rules=[signal.rule_id for signal in signals],
            explanation=explanation,
            required_fields=required,
            missing_fields=missing,
        ),
        signals,
    )


def _risk_level(score: float) -> RiskLevel:
    low, medium, high = C.RISK_LEVEL_BANDS
    if score < low:
        return RiskLevel.LOW
    if score < medium:
        return RiskLevel.MEDIUM
    if score < high:
        return RiskLevel.HIGH
    return RiskLevel.CRITICAL


def _data_quality_warnings(project: ProjectInput) -> list[DataQualityWarning]:
    """Observations worth showing a reviewer that do not themselves carry score."""
    warnings: list[DataQualityWarning] = []

    if project.amount_spent is not None and project.sanctioned_amount is None:
        warnings.append(
            DataQualityWarning(
                code="DQ-001",
                message="Expenditure is recorded but no sanctioned amount was provided, so utilisation cannot be computed.",
                fields=["amount_spent", "sanctioned_amount"],
            )
        )

    if project.sanctioned_amount is not None and project.sanctioned_amount == 0:
        warnings.append(
            DataQualityWarning(
                code="DQ-002",
                message="The sanctioned amount is zero, so ratio-based financial rules were skipped.",
                fields=["sanctioned_amount"],
            )
        )

    if (
        project.completion_percentage is not None
        and project.completion_percentage >= 100
        and project.project_stage is not None
        and project.project_stage.value == "in_progress"
    ):
        warnings.append(
            DataQualityWarning(
                code="DQ-003",
                message="Completion is reported as 100% while the stage is still 'in progress'. These records disagree.",
                fields=["completion_percentage", "project_stage"],
            )
        )

    if project.elapsed_days is not None and project.planned_duration_days is None:
        warnings.append(
            DataQualityWarning(
                code="DQ-004",
                message="Elapsed days are recorded without a planned duration, so schedule overrun cannot be computed.",
                fields=["elapsed_days", "planned_duration_days"],
            )
        )

    if (
        project.project_stage is not None
        and project.project_stage.value == "completed"
        and project.completion_percentage is not None
        and project.completion_percentage < 100
    ):
        warnings.append(
            DataQualityWarning(
                code="DQ-005",
                message="The stage is 'completed' while reported completion is below 100%. These records disagree.",
                fields=["project_stage", "completion_percentage"],
            )
        )

    if project.documents is not None and len(project.documents) == 0:
        warnings.append(
            DataQualityWarning(
                code="DQ-006",
                message="The document set is recorded as empty. This is treated as a known absence, not as unknown.",
                fields=["documents"],
            )
        )

    return warnings


def assess(project: ProjectInput, today: date | None = None) -> RiskAssessment:
    """Score one project. This is the single source of truth for a risk score."""
    project = normalise(project, today)

    dimensions: list[DimensionResult] = []
    signals: list[RiskSignal] = []
    for dimension in DimensionKey:
        result, dimension_signals = _evaluate_dimension(project, dimension)
        dimensions.append(result)
        signals.extend(dimension_signals)

    available = [d for d in dimensions if d.available]
    available_weight = sum(d.weight for d in available)
    total_weight = sum(C.DIMENSION_WEIGHTS.values())
    completeness = round(available_weight / total_weight, 4)

    if available_weight > 0:
        weighted = sum((d.score or 0.0) * d.weight for d in available)
        risk_score = round(weighted / available_weight, 1)
        risk_level = _risk_level(risk_score)
    else:
        # Nothing was assessable. Returning 0 here would read as "low risk",
        # which is the opposite of what is true, so the score stays null.
        risk_score = None
        risk_level = None

    status = (
        AssessmentStatus.COMPLETE
        if completeness >= 1.0 and not any(d.missing_fields for d in dimensions)
        else AssessmentStatus.INCOMPLETE
    )

    missing_fields = [name for name in _SCORING_FIELDS if not _field_is_present(project, name)]

    signals.sort(key=lambda s: (_SEVERITY_ORDER[s.severity], s.rule_id))

    return RiskAssessment(
        project_id=project.project_id,
        risk_score=risk_score,
        risk_level=risk_level,
        assessment_status=status,
        assessment_completeness=completeness,
        dimensions=dimensions,
        signals=signals,
        missing_fields=missing_fields,
        data_quality_warnings=_data_quality_warnings(project),
        disclaimer=C.DISCLAIMER,
    )


def rule_catalogue() -> list[Rule]:
    return list(ALL_RULES)
