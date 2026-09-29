"""Assisted analysis layer.

An important scoping note, because the label on this panel matters.

There is no language model behind this module and no trained model of any
kind. What it does is deterministic: it reads the signals the rule engine
already produced, reads the citizen reports already attached to the work, and
composes those into a short prose summary, a corroboration figure and a list of
review actions. The same work always produces the same text.

It is labelled "Assisted Analysis" rather than anything that would imply a
model is forming an opinion, and every number it reports is traceable:

* ``corroboration`` — how far independent citizen observations line up with
  what the rules already flagged. Derived, not predicted.
* ``confidence`` — the share of the scoring weight that was actually
  assessable, i.e. how complete the underlying record is. A sparse record
  yields low confidence no matter how alarming the signals look.

None of this alters the risk score. The engine remains the single source of
truth; this module only explains and prioritises what it found.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.portal.schemas import CitizenReport
from app.schemas import DimensionKey, RiskAssessment, Severity

ANALYSIS_DISCLAIMER = (
    "Assisted analysis. Composed from the engine's rule output and citizen "
    "reports; it adds no independent judgement and requires human verification."
)

SEVERITY_ORDER: dict[Severity, int] = {
    Severity.INFO: 0,
    Severity.LOW: 1,
    Severity.MEDIUM: 2,
    Severity.HIGH: 3,
    Severity.CRITICAL: 4,
}

# Which citizen observations speak to which scoring dimension. Used only to
# decide whether a report corroborates a signal, never to change a score.
REPORT_DIMENSION_HINTS: dict[str, tuple[DimensionKey, ...]] = {
    "work_not_started": (DimensionKey.TIMELINE_ANOMALY, DimensionKey.FINANCIAL_ANOMALY),
    "work_stalled": (DimensionKey.TIMELINE_ANOMALY, DimensionKey.STALE_PROGRESS),
    "quality_concern": (DimensionKey.FINANCIAL_ANOMALY,),
    "incomplete_work": (DimensionKey.FINANCIAL_ANOMALY, DimensionKey.TIMELINE_ANOMALY),
    "not_as_described": (DimensionKey.FINANCIAL_ANOMALY, DimensionKey.DOCUMENTATION_GAPS),
    "other": (),
}

DIMENSION_REVIEW_ACTIONS: dict[DimensionKey, tuple[str, ...]] = {
    DimensionKey.FINANCIAL_ANOMALY: (
        "Review the latest expenditure records against measured work",
        "Confirm the sanctioned figure and any revision on file",
    ),
    DimensionKey.TIMELINE_ANOMALY: (
        "Verify current physical progress at site",
        "Check whether a time extension was granted and recorded",
    ),
    DimensionKey.DOCUMENTATION_GAPS: (
        "Obtain the missing records from the implementing agency",
        "Confirm whether the documents exist but were never uploaded",
    ),
    DimensionKey.STALE_PROGRESS: (
        "Request a current progress update from the site engineer",
        "Confirm whether work is ongoing or has paused",
    ),
}

DIMENSION_PHRASES: dict[DimensionKey, str] = {
    DimensionKey.FINANCIAL_ANOMALY: "expenditure against reported progress",
    DimensionKey.TIMELINE_ANOMALY: "progress against the planned schedule",
    DimensionKey.DOCUMENTATION_GAPS: "the completeness of the document record",
    DimensionKey.STALE_PROGRESS: "the recency of progress reporting",
}


class AnalysisMetric(BaseModel):
    label: str
    value: int
    unit: str = "/ 100"
    caption: str


class ReviewAction(BaseModel):
    action: str
    reason: str


class AssistedAnalysis(BaseModel):
    """What the analysis panel renders. Text is composed, never invented."""

    headline: str
    metrics: list[AnalysisMetric]
    observations: list[str] = Field(
        default_factory=list, description="Short prose points, each traceable to a signal or report."
    )
    review_actions: list[ReviewAction] = Field(default_factory=list)
    corroborating_report_count: int = 0
    method: str = Field(description="How this was produced, in one line.")
    disclaimer: str = ANALYSIS_DISCLAIMER


def _ranked_dimensions(assessment: RiskAssessment) -> list[DimensionKey]:
    """Dimensions that produced signals, worst first."""
    scored = [
        dimension
        for dimension in assessment.dimensions
        if dimension.available and dimension.score and dimension.triggered_rules
    ]
    scored.sort(key=lambda dimension: dimension.score or 0, reverse=True)
    return [dimension.key for dimension in scored]


def _corroboration(assessment: RiskAssessment, reports: list[CitizenReport]) -> tuple[int, int]:
    """How far citizen observations line up with the engine's signals.

    Returns the 0-100 figure and the number of reports that matched a
    dimension the engine had already flagged.
    """
    if not reports:
        return 0, 0

    flagged = {
        dimension.key
        for dimension in assessment.dimensions
        if dimension.triggered_rules
    }
    matching = 0
    for report in reports:
        hints = REPORT_DIMENSION_HINTS.get(report.issue_type.value, ())
        if any(hint in flagged for hint in hints):
            matching += 1

    if matching == 0:
        return 0, 0

    # Agreement between two independent sources, scaled by how many reports
    # there are: one matching report is suggestive, four is a pattern.
    share = matching / len(reports)
    volume = min(matching / 4.0, 1.0)
    return int(round(100 * (0.55 * share + 0.45 * volume))), matching


def analyse(
    assessment: RiskAssessment,
    reports: list[CitizenReport],
    *,
    work_title: str,
) -> AssistedAnalysis:
    """Compose the analysis panel for one work."""
    ranked = _ranked_dimensions(assessment)
    corroboration, matching_reports = _corroboration(assessment, reports)
    confidence = int(round(assessment.assessment_completeness * 100))

    # --- headline ------------------------------------------------------
    if assessment.risk_score is None:
        headline = (
            "The record is too sparse to assess. Nothing here indicates a problem "
            "with the work — only that the information needed to check it is absent."
        )
    elif not ranked:
        headline = "No rule triggered on the information held for this work."
    else:
        lead = DIMENSION_PHRASES[ranked[0]]
        if len(ranked) == 1:
            headline = f"The engine's findings centre on {lead}."
        else:
            second = DIMENSION_PHRASES[ranked[1]]
            headline = f"The engine's findings centre on {lead}, alongside {second}."

    # --- observations --------------------------------------------------
    observations: list[str] = []
    ordered_signals = sorted(
        assessment.signals,
        key=lambda signal: SEVERITY_ORDER[signal.severity],
        reverse=True,
    )
    for signal in ordered_signals[:3]:
        observations.append(signal.explanation)

    if matching_reports:
        noun, verb = ("report", "describes") if matching_reports == 1 else ("reports", "describe")
        observations.append(
            f"{matching_reports} citizen {noun} {verb} conditions consistent with what the "
            "rules flagged, from a source independent of the official record."
        )
    elif reports:
        noun, verb = ("report", "does") if len(reports) == 1 else ("reports", "do")
        observations.append(
            f"{len(reports)} citizen {noun} {verb} not correspond to any dimension the "
            "rules flagged, and are worth reading on their own terms."
        )

    if assessment.assessment_status.value == "incomplete":
        observations.append(
            f"Only {confidence}% of the scoring weight could be evaluated, so this "
            "picture is partial. Treat the absent dimensions as unknown, not as clear."
        )

    # --- review actions ------------------------------------------------
    review_actions: list[ReviewAction] = []
    for key in ranked[:3]:
        dimension = next(d for d in assessment.dimensions if d.key == key)
        rules = ", ".join(dimension.triggered_rules)
        for action in DIMENSION_REVIEW_ACTIONS[key][:1]:
            review_actions.append(
                ReviewAction(action=action, reason=f"{dimension.label} — {rules}")
            )

    missing_dimensions = [d for d in assessment.dimensions if not d.available]
    if missing_dimensions:
        fields = sorted({field for d in missing_dimensions for field in d.missing_fields})
        review_actions.append(
            ReviewAction(
                action="Complete the record so the unassessed dimensions can be scored",
                reason="Missing: " + ", ".join(fields[:4]),
            )
        )

    if not review_actions:
        review_actions.append(
            ReviewAction(
                action="No review action indicated by the current record",
                reason="No rule triggered and the record is complete",
            )
        )

    return AssistedAnalysis(
        headline=headline,
        metrics=[
            AnalysisMetric(
                label="Citizen Corroboration",
                value=corroboration,
                caption=(
                    f"{matching_reports} of {len(reports)} reports align with a flagged dimension"
                    if reports
                    else "No citizen reports attached to this work"
                ),
            ),
            AnalysisMetric(
                label="Record Confidence",
                value=confidence,
                unit="%",
                caption="Share of the scoring weight the record allowed us to assess",
            ),
        ],
        observations=observations,
        review_actions=review_actions,
        corroborating_report_count=matching_reports,
        method=(
            "Composed deterministically from the engine's triggered rules and the "
            "citizen reports on file. No predictive model is involved."
        ),
    )
