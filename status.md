# Status — MPLADS Sentinel

Last updated: 2026-09-30

## Overall

| Area | State |
|---|---|
| Risk engine (17 rules, 4 dimensions) | Complete |
| Portal layer (catalogue, reports, analysis) | Complete |
| Backend tests | Complete — 104 passing |
| Citizen portal (5 routes) | Complete |
| Officer portal (7 routes) | Complete |
| India map, charts, timeline | Complete |
| Mobile responsiveness | Complete — verified at 390px |
| Deployment configs | Complete — Render + Netlify committed, not yet connected |

## Verification

| Check | Result |
|---|---|
| `pytest` | 104 passed |
| `npm run lint` | clean |
| `tsc --noEmit` | clean |
| `npm run build` | 14 routes, succeeds |
| All 13 routes over HTTP | 200 |
| Citizen report → officer inbox | Verified end to end; score unchanged by the report |
| Corroboration discriminates | Report matching a flagged dimension scores >0; non-matching scores 0 |
| Screenshots at 1440px and 390px | Reviewed for every major page |

## Design decisions

- **Palette and curvature follow the brief**: `#075C4B` primary, `#063F35` sidebar,
  `#1B8A6B` accent, 8–12px radii. Risk colour is reserved for risk.
- **The India map is projected, not drawn.** State outlines are baked from district
  GeoJSON into `frontend/src/lib/india-map.json` (95 KB, RDP-simplified) in an
  equirectangular projection with a 23°N standard parallel. `project()` applies the
  same transform to markers, so a pin cannot drift from its coastline.
- **Works are scattered within their district**, ±0.36°. Placing every work at the
  district headquarters made a map of 500 works render as 54 dots.
- **Troubled archetypes compound across dimensions.** A single-dimension problem is
  diluted by the weighted mean (see the calibration note below), and in reality a work
  in difficulty is rarely late *only*. This resolved the earlier open question without
  touching the engine.
- **No model behind the analysis panel.** Deterministic composition from rule output
  and citizen reports; labelled as such in the UI and in `intelligence.py`.
- **The emblem is the official State Emblem artwork**, served from
  `frontend/public/emblem-of-india.svg` rather than inlined — it is detailed line art
  and one cached request beats repeating it in every page. It is inverted on the dark
  sidebar, since the source is black line work.

## Resolved — headline level calibration

Previously flagged: a weighted mean diluted a strong single-dimension signal, so a
work with a critical `FIN-001` banded only Medium overall.

Resolved in the demo catalogue rather than the engine. Compounding the troubled
archetypes across dimensions produces a distribution that exercises every band:

| Band | Share |
|---|---|
| Low | 87.5% |
| Medium | 7.9% |
| High | 3.1% |
| Critical | 1.5% |

The engine's weighting is unchanged and remains defensible: a work that is only
financially odd *should* rank below one that is financially odd, overdue, undocumented
and silent.

## Known limits

- Citizen reports are in-memory and reset on restart. No database, by scope.
- `/officer/documents` expands the 24 highest-risk works rather than the whole
  register; there is no bulk document endpoint. The page says so.
- Month-over-month KPI deltas are fixed illustrative values, labelled in the UI. The
  counts themselves are live aggregates.
- Map markers sit at an approximate point within the district, not a surveyed site.
