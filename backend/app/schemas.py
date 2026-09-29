"""Request and response schemas for the MPLADS Sentinel risk-scoring engine.

A note on missing data, because it drives most of the design here: every field
of :class:`ProjectInput` except ``project_id`` is optional, and a missing field
means *unknown*, never zero. ``amount_spent=0`` states that nothing was spent;
``amount_spent=None`` states that we do not know. The two lead to different
assessments, so the distinction is preserved from the request through to the
rendered response.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Category(str, Enum):
    """Work categories, loosely following MPLADS permissible-works groupings."""

    ROAD = "road"
    DRINKING_WATER = "drinking_water"
    SANITATION = "sanitation"
    EDUCATION = "education"
    HEALTH = "health"
    COMMUNITY_ASSET = "community_asset"
    PUBLIC_LIGHTING = "public_lighting"
    SPORTS = "sports"
    OTHER = "other"


class ProjectStage(str, Enum):
    """Lifecycle stage, following the recommendation-to-completion flow."""

    RECOMMENDED = "recommended"
    SANCTIONED = "sanctioned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Severity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AssessmentStatus(str, Enum):
    COMPLETE = "complete"
    INCOMPLETE = "incomplete"


class DimensionKey(str, Enum):
    FINANCIAL_ANOMALY = "financial_anomaly"
    TIMELINE_ANOMALY = "timeline_anomaly"
    DOCUMENTATION_GAPS = "documentation_gaps"
    STALE_PROGRESS = "stale_progress"


class DimensionStatus(str, Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"


class ProjectInput(BaseModel):
    """A single MPLADS work submitted for assessment."""

    model_config = ConfigDict(extra="forbid")

    project_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Work identifier, e.g. MPL-1001.",
    )
    project_name: str | None = Field(default=None, max_length=256)
    state: str | None = Field(default=None, max_length=128)
    district: str | None = Field(default=None, max_length=128)
    category: Category | None = None

    sanctioned_amount: Decimal | None = Field(
        default=None, ge=0, description="Sanctioned amount in INR."
    )
    amount_spent: Decimal | None = Field(
        default=None, ge=0, description="Expenditure reported so far, in INR."
    )
    completion_percentage: float | None = Field(
        default=None, ge=0, le=100, description="Reported physical completion, 0-100."
    )

    planned_duration_days: int | None = Field(
        default=None, gt=0, description="Planned execution window in days."
    )
    elapsed_days: int | None = Field(
        default=None, ge=0, description="Days elapsed since execution began."
    )

    project_stage: ProjectStage | None = None

    documents: list[str] | None = Field(
        default=None,
        description=(
            "Document names on record. None means the document set is unknown; "
            "an empty list means it is known to be empty."
        ),
    )

    last_progress_update: date | None = Field(
        default=None, description="Date of the most recent progress update."
    )
    days_since_last_update: int | None = Field(
        default=None,
        ge=0,
        description=(
            "Days since the last progress update. Derived from "
            "last_progress_update when only that is supplied."
        ),
    )

    @field_validator("project_id")
    @classmethod
    def _strip_project_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("project_id must not be blank")
        return cleaned

    @field_validator("project_name", "state", "district")
    @classmethod
    def _blank_to_none(cls, value: str | None) -> str | None:
        """Treat a whitespace-only text field as absent rather than as an empty value."""
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("documents")
    @classmethod
    def _clean_documents(cls, value: list[str] | None) -> list[str] | None:
        # Preserve the None/[] distinction: only entries are cleaned, never the
        # absence of the field itself.
        if value is None:
            return None
        return [item.strip() for item in value if item and item.strip()]


class ObservedValue(BaseModel):
    """One pre-formatted input value shown as the basis for a signal.

    Formatting happens here rather than in the client so that every number a
    reviewer sees comes from the same source as the score itself.
    """

    label: str
    value: str


class RiskSignal(BaseModel):
    """A single triggered rule, with the evidence a reviewer needs to check it."""

    rule_id: str
    dimension: DimensionKey
    severity: Severity
    explanation: str
    observed: list[ObservedValue] = Field(default_factory=list)
    evidence_fields: list[str] = Field(default_factory=list)


class DimensionResult(BaseModel):
    """Outcome for one of the four scoring dimensions."""

    key: DimensionKey
    label: str
    score: float | None = Field(
        default=None, description="0-100 within the dimension; null when unavailable."
    )
    weight: float
    available: bool
    status: DimensionStatus
    triggered_rules: list[str] = Field(default_factory=list)
    explanation: str
    required_fields: list[str] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)


class DataQualityWarning(BaseModel):
    """An observation about the input that does not itself contribute to the score."""

    code: str
    message: str
    fields: list[str] = Field(default_factory=list)


class RiskAssessment(BaseModel):
    """The full assessment returned for one project."""

    project_id: str
    risk_score: float | None = Field(
        default=None,
        description="0-100, rescaled over available dimension weight; null when nothing could be assessed.",
    )
    risk_level: RiskLevel | None = None
    assessment_status: AssessmentStatus
    assessment_completeness: float = Field(
        ..., ge=0, le=1, description="Share of total dimension weight that was assessable."
    )
    dimensions: list[DimensionResult]
    signals: list[RiskSignal]
    missing_fields: list[str] = Field(default_factory=list)
    data_quality_warnings: list[DataQualityWarning] = Field(default_factory=list)
    disclaimer: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class RuleDescription(BaseModel):
    """Catalogue entry describing a rule without evaluating it."""

    rule_id: str
    dimension: DimensionKey
    severity: Severity
    description: str
    required_fields: list[str]


class RuleCatalogueResponse(BaseModel):
    rules: list[RuleDescription]
    disclaimer: str
