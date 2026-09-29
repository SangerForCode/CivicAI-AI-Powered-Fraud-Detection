# MPLADS Sentinel — Risk Engine + Testing Console: Implementation Plan

## 0. Context and a correction to the brief

The brief assumes an **existing** MPLADS Sentinel risk-scoring engine with a
`POST /risk/assess` endpoint and `ProjectInput` / `RiskAssessment` schemas.

**Repository inspection result:** the repo contains exactly one file
(`MPLADS_SENTINEL_deck_text-e1837566.txt`, the SIH pitch deck text extract).
There are no commits, the remote is empty, and there is no backend, no
frontend, and no schema of any kind.

Therefore the acceptance criteria ("The real backend score is returned and
displayed") are not satisfiable against a frontend alone. This plan builds:

1. A **backend risk-scoring engine** — the single source of truth, written to
   exactly the interface the brief describes (four dimensions, rule signals,
   evidence fields, completeness handling, disclaimer).
2. A **frontend testing console** — a pure UI layer that never recomputes a
   score.

Everything else in the brief (design language, sections, restraint in
phrasing, no auth/DB/OCR/LLM/maps/uploads) is followed as written.

### Stack decision

The deck's stated architecture is **Python / FastAPI** backend and
**Next.js + Tailwind** frontend. Since there is no existing code to conform to,
we adopt the deck's stack as the repository convention.

- Backend: Python 3.14, FastAPI, Pydantic v2, uvicorn. No database.
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS v4.
- No LLM, no OCR, no auth, no persistence, no maps, no file uploads.

---

## 1. Domain model

### 1.1 `ProjectInput`

Every field except `project_id` is optional. **Missing means unknown, never
zero.** This is central: the engine must distinguish "spent ₹0" from "we do
not know what was spent", and the two produce different assessments.

| Field | Type | Notes |
|---|---|---|
| `project_id` | `str` | required, non-empty |
| `project_name` | `str?` | |
| `state` | `str?` | |
| `district` | `str?` | |
| `category` | `Category?` | enum |
| `sanctioned_amount` | `Decimal?` | ≥ 0, INR |
| `amount_spent` | `Decimal?` | ≥ 0, INR |
| `completion_percentage` | `float?` | 0–100 |
| `planned_duration_days` | `int?` | > 0 |
| `elapsed_days` | `int?` | ≥ 0 |
| `project_stage` | `ProjectStage?` | enum |
| `documents` | `list[str]?` | `None` = unknown, `[]` = known-empty |
| `days_since_last_update` | `int?` | ≥ 0 |
| `last_progress_update` | `date?` | alternative to the above |

`documents` being `None` vs `[]` matters and is preserved end to end.
`last_progress_update` is normalised into `days_since_last_update` server-side
(engine-side derivation, so the frontend does no date math that affects score).

Enums:

- `Category`: `road`, `drinking_water`, `sanitation`, `education`,
  `health`, `community_asset`, `public_lighting`, `sports`, `other`
- `ProjectStage`: `recommended`, `sanctioned`, `in_progress`, `completed`,
  `abandoned`

Validation rejects out-of-range values with HTTP 422 and a field-addressed
message the frontend surfaces inline.

### 1.2 `RiskAssessment` (response)

```jsonc
{
  "project_id": "MPL-1001",
  "risk_score": 68.4,               // 0-100, rescaled over available weight
  "risk_level": "high",             // low | medium | high | critical
  "assessment_status": "complete",  // complete | incomplete
  "assessment_completeness": 0.75,  // available weight / total weight
  "dimensions": [ Dimension, ... ], // always all four, in fixed order
  "signals": [ RiskSignal, ... ],   // severity-ordered
  "missing_fields": ["amount_spent"],
  "data_quality_warnings": [ {code, message, fields} ],
  "disclaimer": "…"
}
```

`Dimension`:

```jsonc
{
  "key": "financial_anomaly",
  "label": "Financial Anomaly",
  "score": 72.0,          // null when unavailable
  "weight": 0.35,
  "available": true,
  "status": "available",  // available | unavailable
  "triggered_rules": ["FIN-002"],
  "explanation": "…",
  "required_fields": [...],
  "missing_fields": [...]
}
```

`RiskSignal`:

```jsonc
{
  "rule_id": "FIN-002",
  "dimension": "financial_anomaly",
  "severity": "high",     // info | low | medium | high | critical
  "explanation": "Reported expenditure is substantially higher than physical completion.",
  "observed": [ {"label": "Amount spent", "value": "₹8,50,000"},
                {"label": "Completion",   "value": "40%"} ],
  "evidence_fields": ["amount_spent", "completion_percentage", "sanctioned_amount"]
}
```

`observed` is pre-formatted **by the backend** (including the Indian
lakh/crore digit grouping and the ₹ symbol) so the frontend renders strings and
never re-derives a displayed number from raw inputs.

---

## 2. Scoring engine design

### 2.1 Dimensions and weights

| Key | Label | Weight |
|---|---|---|
| `financial_anomaly` | Financial Anomaly | 0.35 |
| `timeline_anomaly` | Timeline Anomaly | 0.30 |
| `documentation_gaps` | Documentation Gaps | 0.20 |
| `stale_progress` | Stale Progress Reporting | 0.15 |

### 2.2 Availability and rescaling

A dimension is **available** only when its required inputs are present.
The final score uses only available dimensions:

```
risk_score = Σ(score_d × weight_d) / Σ(weight_d)   over available d
completeness = Σ(weight_d for available d) / 1.0
```

If completeness < 1.0 → `assessment_status = "incomplete"`.
If no dimension is available → score is `null`, level `null`, status
`incomplete`; the UI shows a "cannot assess" state rather than a zero.

This is why rescaling matters: a project with only documentation data must not
be scored as low-risk simply because the unavailable dimensions contributed 0.

### 2.3 Rules

Each rule is a pure function `(ProjectInput) -> RiskSignal | None`, declaring
its required fields. Thresholds are illustrative and defined in one constants
module so they are visibly assumptions, not policy.

**Financial (FIN)**
- `FIN-001` Expenditure exceeds sanctioned amount (`spent > sanctioned`) — critical
- `FIN-002` Expenditure substantially ahead of physical completion
  (`spend_ratio - completion/100 > 0.25`) — high
- `FIN-003` Near-full utilisation with low completion
  (`spend_ratio ≥ 0.90 and completion < 50`) — high
- `FIN-004` Completed but materially underspent
  (`stage = completed and spend_ratio < 0.60`) — medium
- `FIN-005` Expenditure recorded with zero reported completion — medium

**Timeline (TIM)**
- `TIM-001` Elapsed time exceeds planned duration, project not complete — high
- `TIM-002` Severe overrun (`elapsed > 1.5 × planned`) — critical
- `TIM-003` Time consumed well ahead of progress
  (`time_ratio - completion/100 > 0.30`) — medium
- `TIM-004` Stage is `abandoned` — high

**Documentation (DOC)** — expected document set varies by stage
- `DOC-001` Missing sanction order — high
- `DOC-002` Missing utilisation certificate for a completed work — critical
- `DOC-003` Missing completion certificate for a completed work — high
- `DOC-004` No progress/measurement documents for an in-progress work — medium
- `DOC-005` No documents recorded at all — high

**Stale reporting (STL)**
- `STL-001` No progress update in over 90 days on an active work — high
- `STL-002` No progress update in over 180 days on an active work — critical
- `STL-003` No progress update in 30–90 days on an active work — low

A dimension's score is derived from its triggered signals' severities
(saturating, so it cannot exceed 100), then thresholded into the overall level:
`< 25 low`, `< 50 medium`, `< 75 high`, `≥ 75 critical`.

### 2.4 Data-quality warnings

Non-scoring observations reported alongside, e.g. spend recorded with no
sanctioned amount, completion 100% while stage is `in_progress`,
`elapsed_days` present without `planned_duration_days`.

### 2.5 Language constraint

No rule text may say fraud, corruption, guilt, or misappropriation. All copy
frames output as *risk signals requiring human review*. This is enforced by a
test that greps the rule catalogue for a banned-term list.

---

## 3. API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | `{"status":"ok","service":"mplads-sentinel-risk-engine","version":"…"}` |
| `POST` | `/risk/assess` | `ProjectInput` → `RiskAssessment` |
| `GET` | `/risk/rules` | rule catalogue (useful for demo/inspection) |

CORS open to `localhost:3000`. No auth, no persistence.

---

## 4. Frontend

```
frontend/
  src/
    app/            layout.tsx, page.tsx, globals.css
    components/
      ApiStatus.tsx           health indicator
      ProjectForm.tsx         the form + Load Example
      FormField.tsx           label/input/error primitive
      DocumentChecklist.tsx   known docs + free-text additions
      RiskSummary.tsx         score, level, status, completeness
      DimensionBreakdown.tsx  four dimension cards
      RiskSignals.tsx         signal list with evidence chips
      DataQuality.tsx         missing fields + warnings
      Disclaimer.tsx
      EmptyState.tsx / ErrorState.tsx / Skeleton.tsx
    services/api.ts           the only place fetch() appears
    types/assessment.ts       mirrors backend schema
    lib/examples.ts           five synthetic projects
    lib/format.ts             display-only helpers, never scoring
```

### Design tokens

- Background `#F8FAFC`, surface `#FFFFFF`
- Brand `#1E3A5F` (deep institutional navy)
- Accent `#C6873B` (restrained ochre)
- Neutrals: `#E2E8F0` borders, `#64748B` secondary text, `#0F172A` primary text
- Risk levels, muted and not alarming: low `#15803D`, medium `#B45309`,
  high `#C2410C`, critical `#B91C1C` — used as text + a tinted background,
  never as a large saturated block
- Radius 10px, shadow `0 1px 2px rgba(15,23,42,.06)`, system font stack
- Responsive: two-column (form / results) ≥ 1024px, stacked below

Dark mode is out of scope — the brief specifies a light theme.

### States

Empty (before first assess) → Loading (skeleton, button disabled) →
Success → Validation errors (inline, per field) → API error (banner with the
actual failure reason and a retry). "New assessment" resets results but
keeps the form.

### Examples (Load Example menu)

1. **Normal low-risk project** — on schedule, proportionate spend, full docs
2. **High expenditure relative to completion** — the `FIN-002` case from the brief
3. **Expenditure above sanctioned amount** — `FIN-001`
4. **Delayed project** — `TIM-001`/`TIM-002` + stale reporting
5. **Incomplete-data project** — only id, name, state; demonstrates
   `assessment_status: "incomplete"` and unavailable dimensions

### Client-side validation

Only shape validation — required `project_id`, numeric ranges, percentage
bounds. **No score-affecting logic.** Empty fields are sent as omitted keys,
never as `0`.

---

## 5. Build order

1. Scaffold repo, `.gitignore`, `README.md`
2. Backend: schemas → constants → rules → dimensions → scoring → routes
3. Backend tests (pytest): each rule, rescaling, incomplete path, banned terms
4. Frontend scaffold (Next.js + Tailwind), design tokens
5. `services/api.ts` + `types/` + `ApiStatus`
6. `ProjectForm` + examples + validation
7. Result components
8. Wire the page, all states
9. Run both, verify all five examples end to end
10. Update `status.md`

## 6. Out of scope

Authentication, database, OCR, file uploads, LLM features, maps, citizen
reporting, peer-group statistics, graph/relationship analysis, dark mode.

## 7. Risks

- **Illustrative thresholds.** Mitigated by isolating them in one constants
  module and surfacing the disclaimer in both API response and UI.
- **Scope creep toward the full Sentinel product.** Mitigated by the explicit
  out-of-scope list.
- **Duplicated scoring in the UI.** Mitigated by the frontend holding no
  thresholds; even displayed numbers come pre-formatted from the backend.
