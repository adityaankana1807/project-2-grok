# INDRA — India Nested District Risk & Association

**Project 2 Grok.** A research atlas for NCRB-calibrated crime risk, space–time clustering, near-repeat foraging, and intuitionistic-fuzzy crime linkage — built for Indian districts, festivals, and underreporting.

This is a methods lab, not an operational targeting tool. Counts are a seeded synthetic panel calibrated to public NCRB / Census / NFHS priors. They are not official police microdata.

## What it does

Six nested stages, each taken from a paper corpus on crime linkage and Indian CAW and retuned to districts:

1. **Small-area relative risk** — empirical Bayes + CAR smoother (Pooja, Guddattu & Rao 2024)
2. **Space–time scan** — Kulldorff-lite Poisson cylinders (Mathews, Binu & Guddattu 2024)
3. **India calendar prior** — Holi, Diwali, Navratri/Durga Puja, monsoon, 2020–21 dip
4. **Near-repeat forager** — Knox-style kernel + NH/SH corridor boost
5. **IFS linkage** — hesitancy-aware MO similarity vs Jaccard (Dutta & Banik 2024; Tonkin et al. 2025)
6. **ST-lite forecast** — lag-1, lag-12, neighbours, festival, monsoon

## Stack

React 19, TanStack Start / Router, Tailwind v4, Zustand, Recharts.

## Run locally

```bash
npm install
npm run dev
```

The app listens on port 8080.

```bash
npm run typecheck
npm run build
```

## Routes

| Path | View |
| --- | --- |
| `/` | District risk atlas, scan clusters, national series |
| `/algorithm` | The six-stage nest and evaluation metrics |
| `/linkage` | Rank candidates against a planted serial series |
| `/forecast` | Next-month hotspot watch list |
| `/data` | NCRB priors and CSV export |
| `/literature` | How each source paper feeds a stage |

## Data note

State CAW / murder / cyber / violent rates follow NCRB Crime in India 2022–2024. District centroids and urbanisation follow Census / NCP. Dark-figure multipliers follow NFHS-5 lifetime domestic-violence prevalence. Sixteen planted serial series sit inside the synthetic caseload so linkage AUC can be scored. Reporting is not incidence.
