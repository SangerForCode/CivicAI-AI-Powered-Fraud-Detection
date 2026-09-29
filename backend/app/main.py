"""FastAPI application exposing the MPLADS Sentinel risk-scoring engine.

The engine is the single source of truth for a risk score. Clients submit a
project and render what comes back; they do not recompute any part of it.
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.engine import constants as C
from app.engine.scoring import assess, rule_catalogue
from app.schemas import (
    HealthResponse,
    ProjectInput,
    RiskAssessment,
    RuleCatalogueResponse,
    RuleDescription,
)

app = FastAPI(
    title="MPLADS Sentinel — Risk Scoring Engine",
    description=(
        "Prototype decision-support risk scoring for MPLADS works. "
        "Outputs are risk signals for authorised human review, not findings of fraud."
    ),
    version=C.SERVICE_VERSION,
)

_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
_allowed_origins = [
    origin.strip()
    for origin in os.getenv("SENTINEL_CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    """Liveness probe used by the console's connectivity indicator."""
    return HealthResponse(status="ok", service=C.SERVICE_NAME, version=C.SERVICE_VERSION)


@app.post("/risk/assess", response_model=RiskAssessment, tags=["risk"])
def assess_project(project: ProjectInput) -> RiskAssessment:
    """Score a single project and return the full, explainable assessment."""
    return assess(project)


@app.get("/risk/rules", response_model=RuleCatalogueResponse, tags=["risk"])
def list_rules() -> RuleCatalogueResponse:
    """The rule catalogue, so a reviewer can inspect what the engine checks."""
    return RuleCatalogueResponse(
        rules=[
            RuleDescription(
                rule_id=rule.rule_id,
                dimension=rule.dimension,
                severity=rule.severity,
                description=rule.description,
                required_fields=list(rule.required_fields),
            )
            for rule in rule_catalogue()
        ],
        disclaimer=C.DISCLAIMER,
    )
