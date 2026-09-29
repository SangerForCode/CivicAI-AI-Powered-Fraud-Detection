# Status — MPLADS Sentinel Risk Engine + Testing Console

Last updated: 2026-09-29

## Overall

| Area | State |
|---|---|
| Planning | Complete |
| Backend risk engine | Complete |
| Backend tests | Complete — 49 passing |
| Frontend scaffold | Complete |
| Frontend components | Complete |
| Frontend visual redesign | Complete — curved shell, green chrome, State Emblem mark |
| End-to-end verification | Complete — all five examples scored by the live engine |

## Key finding

The repository contained **no existing backend, frontend, or schema** — only
the SIH pitch-deck text extract, with no commits and an empty remote. The brief
assumed an existing risk-scoring engine at `POST /risk/assess`, so building that
engine became part of this work. See `plan.md` §0.

## Task log

- [x] Inspect repository, git history, remote
- [x] Read pitch deck for domain grounding
- [x] Write `plan.md` and `status.md`
- [x] Backend: project scaffold + dependencies
- [x] Backend: `ProjectInput` / `RiskAssessment` schemas
- [x] Backend: rule catalogue — 17 rules across FIN / TIM / DOC / STL
- [x] Backend: dimension availability + weighted rescaling
- [x] Backend: `/health`, `/risk/assess`, `/risk/rules`
- [x] Backend: pytest suite
- [x] Frontend: Next.js 16 + Tailwind v4 scaffold, design tokens
- [x] Frontend: `services/api.ts`, `types/assessment.ts`
- [x] Frontend: `ApiStatus`
- [x] Frontend: `ProjectForm` + validation + document checklist + 5 examples
- [x] Frontend: `RiskSummary`, `DimensionBreakdown`, `RiskSignals`, `DataQuality`
- [x] Frontend: empty / loading / error states, reset and new-assessment actions
- [x] Run both services, verify all five examples end to end
- [x] README with run instructions
- [x] Redesign: sidebar shell, State Emblem mark, curved surfaces
- [x] Rule Catalogue view backed by `GET /risk/rules`

## Verification

| Check | Result |
|---|---|
| `pytest` | 49 passed |
| `npm run lint` | clean |
| `tsc --noEmit` | clean |
| `npm run build` | succeeds, page prerendered static |
| `GET /health` | `200 {"status":"ok",…}` |
| CORS preflight from `localhost:3000` | allowed |
| All five examples via live API | all return four dimensions + disclaimer |
| Rendered page scanned for prohibited language | none present |

Live engine results for the five examples:

| Example | Score | Level | Status | Signals |
|---|---|---|---|---|
| Normal low-risk project | 0.0 | low | complete | none |
| High expenditure vs completion | 24.5 | low | complete | `FIN-002` |
| Expenditure above sanction | 38.0 | medium | complete | `FIN-001`, `FIN-002`, `STL-003` |
| Delayed project | 78.5 | critical | complete | `TIM-002`, `STL-002`, `FIN-002`, `TIM-003`, `DOC-004` |
| Incomplete-data project | `null` | `null` | **incomplete** | none; 0 of 4 dimensions available |

## Acceptance criteria

| # | Criterion | State |
|---|---|---|
| 1 | Open UI, enter a synthetic project | Met |
| 2 | `Assess Risk` posts to `/risk/assess` | Met |
| 3 | Real backend score displayed | Met |
| 4 | All four dimensions visible | Met — always all four, unavailable ones included |
| 5 | Triggered rules + evidence fields visible | Met |
| 6 | Missing information explicit | Met — `DataQuality` section |
| 7 | Incomplete assessments clearly identified | Met — banner + status badge |
| 8 | `/health` connectivity shown | Met |
| 9 | Example projects cover the scenarios | Met — all five |
| 10 | No LLM / OCR / DB / auth / duplicated scoring | Met |

## Decisions

- Stack follows the deck's stated architecture: FastAPI backend, Next.js +
  Tailwind frontend. No existing convention to conform to.
- Missing input fields stay `None` end to end; they are never coerced to `0`.
- Score is rescaled over available dimension weight, so an incomplete
  assessment is not biased toward "low risk".
- Monetary and percentage strings in signal evidence are formatted by the
  backend, keeping all score-facing derivation server-side.
- Dimension scores combine signals with diminishing returns rather than summing,
  so stacking rules cannot push a dimension past 100.
- Dependency versions are pinned to releases with Python 3.14 wheels
  (pydantic 2.13.5, FastAPI 0.141.1); the originally planned pins had no wheel
  for this interpreter.

## Open question — headline level calibration

Worth a decision before the demo, flagged rather than changed unilaterally.

Because the overall score is a weighted mean across four dimensions, a strong
signal confined to one dimension is diluted in the headline level:

- *High expenditure vs completion*: Financial scores **70**, but the overall
  score is **24.5**, which bands as **Low**.
- *Expenditure above sanction*: Financial scores **100** (a critical `FIN-001`),
  but the overall score is **38.0**, banding as **Medium**.

The dimension breakdown shows the real figures, so nothing is hidden. But the
headline level arguably understates a single severe finding, which is awkward
for the exact scenarios the examples are meant to demonstrate.

Three options:

1. **Leave it.** A weighted mean is transparent and easy to defend; reviewers
   read the dimension cards.
2. **Add a floor.** The overall level is at least the level implied by the
   strongest dimension — so a critical dimension yields at least a high
   headline. Simple, but a policy choice that needs stating as an assumption.
3. **Re-weight.** Raise the financial weight, or use a max/mean blend.

This needs a product decision rather than an engineering one.
