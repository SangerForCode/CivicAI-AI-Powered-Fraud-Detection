"""Thresholds, weights and copy for the risk engine.

Every number in this module is an illustrative prototype assumption. None of it
is official MPLADS policy. They are gathered here so that the assumptions are
reviewable in one place rather than scattered through the rule bodies.
"""

from __future__ import annotations

from app.schemas import DimensionKey, Severity

DISCLAIMER = (
    "Prototype decision-support scoring. Thresholds are illustrative assumptions "
    "and are not official MPLADS policy. Risk signals are not findings of fraud."
)

SERVICE_NAME = "mplads-sentinel-risk-engine"
SERVICE_VERSION = "0.1.0"

# --- Dimension weights ------------------------------------------------------
# Must sum to 1.0; asserted at import time so a future edit cannot drift.

DIMENSION_WEIGHTS: dict[DimensionKey, float] = {
    DimensionKey.FINANCIAL_ANOMALY: 0.35,
    DimensionKey.TIMELINE_ANOMALY: 0.30,
    DimensionKey.DOCUMENTATION_GAPS: 0.20,
    DimensionKey.STALE_PROGRESS: 0.15,
}

DIMENSION_LABELS: dict[DimensionKey, str] = {
    DimensionKey.FINANCIAL_ANOMALY: "Financial Anomaly",
    DimensionKey.TIMELINE_ANOMALY: "Timeline Anomaly",
    DimensionKey.DOCUMENTATION_GAPS: "Documentation Gaps",
    DimensionKey.STALE_PROGRESS: "Stale Progress Reporting",
}

assert abs(sum(DIMENSION_WEIGHTS.values()) - 1.0) < 1e-9, "dimension weights must sum to 1.0"

# --- Severity contribution --------------------------------------------------
# Points a triggered rule contributes within its own dimension, before
# saturation. Values are deliberately coarse.

SEVERITY_POINTS: dict[Severity, float] = {
    Severity.INFO: 0.0,
    Severity.LOW: 20.0,
    Severity.MEDIUM: 45.0,
    Severity.HIGH: 70.0,
    Severity.CRITICAL: 100.0,
}

# --- Overall risk-level bands ----------------------------------------------

RISK_LEVEL_BANDS: tuple[float, float, float] = (25.0, 50.0, 75.0)

# --- Financial thresholds ---------------------------------------------------

#: Spend ratio may exceed completion by this fraction before FIN-002 triggers.
FIN_SPEND_AHEAD_OF_COMPLETION = 0.25
#: Utilisation at or above this is "near full" for FIN-003.
FIN_NEAR_FULL_UTILISATION = 0.90
#: Completion below this, alongside near-full utilisation, triggers FIN-003.
FIN_LOW_COMPLETION = 50.0
#: A completed work spending less than this share of sanction triggers FIN-004.
FIN_COMPLETED_UNDERSPEND = 0.60
#: Spend above this share with zero reported completion triggers FIN-005.
FIN_SPEND_WITH_NO_PROGRESS = 0.10

# --- Timeline thresholds ----------------------------------------------------

#: elapsed / planned above this, while incomplete, triggers TIM-001.
TIM_OVERRUN = 1.0
#: elapsed / planned above this triggers the severe-overrun rule TIM-002.
TIM_SEVERE_OVERRUN = 1.5
#: Time consumed may exceed completion by this fraction before TIM-003 triggers.
TIM_TIME_AHEAD_OF_PROGRESS = 0.30

# --- Stale-reporting thresholds (days) --------------------------------------

STL_MODERATE_DAYS = 30
STL_HIGH_DAYS = 90
STL_SEVERE_DAYS = 180

# --- Documentation ----------------------------------------------------------
# Document names are matched case-insensitively on normalised substrings, so
# "Sanction Order (signed)" satisfies the sanction-order expectation.

DOC_SANCTION_ORDER = "sanction order"
DOC_UTILISATION_CERTIFICATE = "utilisation certificate"
DOC_COMPLETION_CERTIFICATE = "completion certificate"
DOC_PROGRESS_REPORT = "progress report"
DOC_MEASUREMENT_BOOK = "measurement book"

#: The full checklist offered to a reviewer, in display order.
KNOWN_DOCUMENTS: tuple[str, ...] = (
    "Sanction Order",
    "Work Order",
    "Estimate / BOQ",
    "Measurement Book",
    "Progress Report",
    "Site Photographs",
    "Completion Certificate",
    "Utilisation Certificate",
    "Audit Report",
)

#: Stages at which a work is being executed and so should be reporting progress.
ACTIVE_STAGES = ("in_progress",)
