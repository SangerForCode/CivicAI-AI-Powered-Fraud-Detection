# MPLADS Sentinel — Risk Engine & Testing Console

SIH 2026 · Problem Statement **SIH26102** · Team Smaster(s), BITS Pilani K. K. Birla Goa Campus

A prototype risk-scoring engine for MPLADS works, plus a minimal console for
exercising it. The engine converts a project record into an explainable risk
assessment: a score, four weighted dimensions, and the specific input fields
behind every triggered signal.

> **Prototype decision-support scoring. Thresholds are illustrative assumptions
> and are not official MPLADS policy. Risk signals are not findings of fraud.**

Output is routed for authorised human review. The system makes no determination
about any work, person or organisation.

---

## Layout

```
backend/     FastAPI risk-scoring engine — the single source of truth for a score
frontend/    Next.js console for entering projects and reading assessments
plan.md      Design and build plan
status.md    Current state and acceptance-criteria tracking
```

The console never recomputes a score. Even the monetary and percentage strings
shown as evidence are formatted by the engine, so a reviewer reads the same
rendering of a number that the rule reasoned about.

## Running it

Two terminals.

**Backend** (http://localhost:8000):

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000
```

**Frontend** (http://localhost:3000):

```bash
cd frontend
npm install
npm run dev
```

Point the console at a different engine with
`NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`).

### Tests

```bash
cd backend && .venv/bin/pip install -r requirements-dev.txt && .venv/bin/python -m pytest
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness, backing the console's status indicator |
| `POST` | `/risk/assess` | `ProjectInput` → `RiskAssessment` |
| `GET` | `/risk/rules` | The rule catalogue |

Interactive docs at http://localhost:8000/docs.

### Scoring model

Four weighted dimensions:

| Dimension | Weight | Rules |
|---|---|---|
| Financial Anomaly | 35% | `FIN-001` … `FIN-005` |
| Timeline Anomaly | 30% | `TIM-001` … `TIM-004` |
| Documentation Gaps | 20% | `DOC-001` … `DOC-005` |
| Stale Progress Reporting | 15% | `STL-001` … `STL-003` |

Overall bands: `<25` low, `<50` medium, `<75` high, `≥75` critical.
Every threshold lives in `backend/app/engine/constants.py`.

### Missing data

The engine's central rule: **a missing field means unknown, never zero.**

- A dimension is scored only when its inputs are present; otherwise it is
  reported `unavailable` with the fields it needs.
- The score is rescaled over the weight that was actually assessable, so an
  incomplete record is not biased toward "low risk" by unknown dimensions
  contributing zero.
- When nothing is assessable, `risk_score` is `null` — not `0`.
- `documents: null` (unknown) and `documents: []` (known to be empty) are
  different inputs and produce different assessments.
- Any shortfall sets `assessment_status: "incomplete"`, which the console
  displays prominently.

## Scope

Built: the scoring engine, the assessment API, and the console.

Deliberately excluded: authentication, database, OCR, file uploads, LLM
features, maps, citizen reporting, peer-group statistics, and graph analysis.
