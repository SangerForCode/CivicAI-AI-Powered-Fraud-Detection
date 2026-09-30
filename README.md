# MPLADS Sentinel

<div align="center">

<h2>People. Projects. Progress.</h2>

<p><strong>Explainable risk intelligence for publicly funded development works.</strong></p>

<p>
  <a href="https://mplads-sentinel-sigma.vercel.app/">Live citizen portal</a> ·
  <a href="https://mplads-sentinel-sigma.vercel.app/officer">Officer dashboard</a> ·
  <a href="https://mplads-sentinel-backend.onrender.com/docs">API documentation</a>
</p>

<p><img alt="BITS Pilani SIH 2026 Internal Hackathon Winner" src="https://img.shields.io/badge/BITS%20Pilani-SIH%202026%20Internal%20Hackathon%20Winner-D4A017?style=for-the-badge"></p>

<p><strong>🏆 Winner — BITS Pilani Internal Hackathon for SIH 2026</strong><br>
Problem Statement <strong>SIH26102</strong> · Team Smasters · BITS Pilani, K. K. Birla Goa Campus</p>

<table align="center">
  <thead><tr><th>Backend</th><th>Frontend</th></tr></thead>
  <tbody>
    <tr>
      <td>Ayush Sanger<br>Ayush Jayprakash Singh</td>
      <td>Ayush Sanger<br>Ronak Dhawan</td>
    </tr>
  </tbody>
</table>

</div>

<p align="center">
  <a href="https://mplads-sentinel-sigma.vercel.app/"><img src="docs/previews/citizen-portal-live.png" alt="Live MPLADS Sentinel citizen portal preview" width="100%"></a>
</p>
<p align="center"><sub>Live prototype preview · all displayed works and locations are synthetic demonstration data.</sub></p>

### SIH concept boards

<h4>Citizen portal concept</h4>
<p align="center">
  <img src="docs/previews/civicai-citizen-concept.jpg" alt="CivicAI citizen portal concept board" width="100%">
</p>
<p align="center"><sub>Landing page, works map, and sample work details · concept artwork, not the live interface.</sub></p>

<br>

<h4>Officer analytics concept</h4>
<p align="center">
  <img src="docs/previews/civicai-officer-concept.jpg" alt="CivicAI officer analytics concept board" width="100%">
</p>
<p align="center"><sub>Dashboard, risk distribution, and review queue · concept artwork with illustrative sample data.</sub></p>

> The concept art's “AI-powered fraud detection” wording is not an implementation claim. The running engine is deterministic, and risk flags are review signals—not findings of fraud.

A transparency platform for works funded under the Members of Parliament Local Area
Development Scheme. It does two things and joins them together: it runs a rule-based
check over each work's official record to surface the ones whose paperwork does not
add up, and it gives the people living beside those works a way to say what is
actually there.

> **Prototype decision-support scoring. Thresholds are illustrative assumptions and
> are not official MPLADS policy. Risk signals are not findings of fraud.**
>
> **All works, locations, agencies, representatives and citizen reports in this
> repository are synthetic demonstration data.** They do not describe any real
> MPLADS work or person. The scoring engine is real and runs on every record shown.

---

## The two portals

| | Citizen | Officer |
|---|---|---|
| Feel | Simple, public, transparent | Dense, analytical, operational |
| Shows | Works near you, their progress, their documents | A prioritised review queue with evidence |
| Does | Lets you report what you see on the ground | Lets you investigate one work end to end |

<p align="center">
  <img src="docs/previews/officer-dashboard-live.png" alt="Live MPLADS Sentinel officer dashboard with KPI cards and India risk map" width="100%">
</p>
<p align="center"><sub>Live officer dashboard preview · KPI deltas are illustrative; all work records are synthetic demo data.</sub></p>

### System flow

```mermaid
flowchart LR
    Citizen[Citizen] -->|Browse works / submit observation| CitizenPortal[Citizen portal · Next.js]
    Officer[Officer reviewer] -->|Review queue / inspect evidence| OfficerPortal[Officer portal · Next.js]
    CitizenPortal -->|JSON requests| API[FastAPI portal API]
    OfficerPortal -->|JSON requests| API
    API --> Catalogue[Seeded synthetic works catalogue]
    API --> Reports[In-memory citizen reports]
    API --> Engine[Deterministic scoring engine · 17 rules · 4 dimensions]
    Engine --> Assessment[Explainable score · risk band · rule signals · missing-data status]
    Assessment --> CitizenPortal
    Assessment --> OfficerPortal
```

The backend is the scoring source of truth. The frontend renders its assessments and does not recalculate scores. Citizen reports are routed for human review and do not change a work's risk score.

### Routes

| Path | What it is |
|---|---|
| `/` | Citizen home — hero, public counters, recent works |
| `/explore` | Works explorer with filters and search |
| `/map` | Citizen map view |
| `/works/{id}` | A work's public record, its timeline, and the report form |
| `/about` | What the platform does, and what it will not do |
| `/officer` | Officer dashboard — KPIs, risk map, distribution, queue |
| `/officer/works` | The full works queue, filterable and sortable |
| `/officer/works/{id}` | Project investigation workspace |
| `/officer/map` | Analytical risk map with state shading |
| `/officer/documents` | Document register across the highest-risk works |
| `/officer/reports` | Citizen report inbox |
| `/officer/rules` | The engine's rule catalogue |
| `/officer/console` | Raw engine console — submit a record, read the assessment |

---

## Layout

```
backend/
  app/engine/     The risk-scoring engine — the single source of truth for a score
  app/portal/     The works catalogue, citizen reports and assisted analysis
  tests/          104 tests
frontend/         Next.js app serving both portals
```

The frontend never recomputes a score. Monetary amounts, percentages, dates and
durations all arrive pre-formatted from the backend, so a reviewer reads the same
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
npm ci
npm run dev
```

Point the frontend at a different engine with `NEXT_PUBLIC_API_BASE_URL`
(default `http://localhost:8000`).

### Tests

```bash
cd backend && .venv/bin/pip install -r requirements-dev.txt && .venv/bin/python -m pytest
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness, backing the connectivity indicator |
| `POST` | `/risk/assess` | `ProjectInput` → `RiskAssessment` |
| `GET` | `/risk/rules` | The rule catalogue |
| `GET` | `/works` | Filterable, sortable, paginated works list |
| `GET` | `/works/map` | Marker set for the map views |
| `GET` | `/works/{id}` | Full record including the live assessment |
| `GET` | `/works/{id}/analysis` | Assisted analysis for one work |
| `GET`/`POST` | `/works/{id}/reports` | Citizen reports on a work |
| `GET` | `/reports/recent` | The officer's report inbox |
| `GET` | `/dashboard/summary` | Officer KPIs and aggregates |
| `GET` | `/citizen/stats` | Public counters |
| `GET` | `/filters` | Filter options, derived from the catalogue |

Interactive docs at http://localhost:8000/docs.

### Scoring model

Four weighted dimensions, seventeen rules:

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

- A dimension is scored only when its inputs are present; otherwise it is reported
  `unavailable` with the fields it needs.
- The score is rescaled over the weight that was actually assessable, so an
  incomplete record is not biased toward "low risk".
- When nothing is assessable, `risk_score` is `null` — not `0`.
- `documents: null` (unknown) and `documents: []` (known empty) are different inputs.
- Any shortfall sets `assessment_status: "incomplete"`, shown prominently in both
  portals.

### Assisted analysis

The "Assisted Analysis" panel on the investigation page is **deterministic and has no
model behind it** — no LLM, no trained classifier. `backend/app/portal/intelligence.py`
composes prose from the rules that already fired and the citizen reports already on
file, and reports two traceable figures:

- **Citizen corroboration** — how far independent observations line up with what the
  rules flagged.
- **Record confidence** — the share of scoring weight the record allowed us to assess.

It never changes a score. The module says so in its own footer rather than leaving the
reader to assume.

### Demo data

`backend/app/portal/catalogue.py` generates 1,420 works from a fixed seed against the
current date, then scores every one through `assess()`. Dashboard counts are real
aggregates over those outputs, not hardcoded numbers. Risk is not assigned: each record
is built with a plausible shape and the engine decides what it is. Roughly 87% land in
the low band, which is the point — a demo that flags everything would misrepresent
MPLADS.

The representative field is always a placeholder (`… (demo record)`). Attaching a risk
score to a real person's name is a claim this system has no basis to make.

### The emblem

`frontend/public/emblem-of-india.svg` is the State Emblem of India. Its use is
restricted under the State Emblem of India (Prohibition of Improper Use) Act, 2005 —
appropriate for a government platform, but check the position before using this mark
outside a hackathon submission.

## Live demo and deployment

The current public demo is deployed as a **Vercel frontend + Render API**:

| Service | URL |
|---|---|
| Citizen portal | <https://mplads-sentinel-sigma.vercel.app/> |
| Officer dashboard | <https://mplads-sentinel-sigma.vercel.app/officer> |
| Backend health | <https://mplads-sentinel-backend.onrender.com/health> |
| Interactive API docs | <https://mplads-sentinel-backend.onrender.com/docs> |

`render.yaml` defines the Render backend. The checked-in `frontend/netlify.toml` is an alternative Netlify frontend configuration; the deployed frontend linked above is on Vercel. For another deployment, set `NEXT_PUBLIC_API_BASE_URL` to the backend origin and configure the backend's `SENTINEL_CORS_ORIGINS` to the exact frontend origin.

## Scope

Built: the scoring engine, the works catalogue, both portals, citizen reporting, the
maps, the document register and the assisted-analysis layer.

Deliberately excluded: authentication, a real database, OCR, file uploads, LLM features,
peer-group statistics and graph analysis. Citizen reports live in memory and reset when
the service restarts.
