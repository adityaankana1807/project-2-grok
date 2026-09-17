# TRIVENI — Typology-Conditional Likelihood Ratios for Indian Crime Linkage

**Project 2.** A forensic case-linkage platform for Indian districts: NCRB-calibrated small-area risk, space–time scan clusters, and a typology-mixed likelihood ratio under FIR missingness and the IPC → BNS flip.

This is a methods lab, not an operational targeting tool. Counts are a seeded synthetic panel calibrated to public NCRB / Census / NFHS priors. They are not official police microdata. Reporting is not incidence.

## Why a fifth algorithm

Four prior systems on the same Drive corpus still score similarities or `P(link | features)`:

| System | Repo | Fusion | Hole |
| --- | --- | --- | --- |
| ST-SAGE | `project-2-claude` | Logistic(Jaccard, Tonkin 2025, distance, time) | Marauder-only geometry |
| INDRA | `project-2-grok` (prior) | Linear nest 0.26/0.16/0.34/0.12/0.12 | Authored weights, not an LR |
| I-HSTMO-Link++ | `ihstmo-gemini-project-2` | Calibrated logistic + Louvain | Classifier, not Λ |
| I-HSTMO baseline | `ihstmoindia-biddata-project-2-codex-1` | Logit on 7 similarities | Honest, still not an LR |

**TRIVENI** scores

```
Λ = Σ_τ π(τ | d) · (Λ_desh(τ) Λ_kaal(τ) Λ_riti Λ_patch) / D
```

mixed over Halford-style `{forager, marauder, commuter}` kernels. Hollow FIRs send `Λ_riti → 1`. SAE clusters are a blocking index, not just a map colour.

## Streams

1. **Desh** — spatial LR at typology-specific `d0`
2. **Kaal** — temporal LR, festival-stretched (Holi, Diwali, Navratri/Durga Puja)
3. **Riti** — Dutta–Banik IFS × Tonkin 2025, gated by coverage
4. **Patch** — SAE relative-risk concordance × Kulldorff co-membership
5. **Copula** — saturating space–time dependence so Hawkes near-repeats are not double-counted
6. **Blocking** — 3·d0 ∪ scan cluster ∪ NH/SH corridor ∪ rare tokens ∪ IPC/BNS family

## Stack

React 19, TanStack Start / Router, Tailwind v4, Zustand, Recharts.

## Run locally

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run build
```

## Routes

| Path | View |
| --- | --- |
| `/` | District risk atlas, scan clusters, live log-Λ AUC |
| `/algorithm` | Mixture LR, streams, four-prior comparison |
| `/linkage` | Rank SAE-blocked candidates by log Λ |
| `/series` | Eighteen typed planted series |
| `/forecast` | Next-month hotspot watch list |
| `/paper` | IMRaD methods preprint with live metrics |
| `/data` | NCRB priors and CSV export |
| `/literature` | Drive corpus mapped onto TRIVENI streams |

## Data note

State CAW / murder / cyber / violent rates follow NCRB Crime in India 2022–2024. District centroids and urbanisation follow Census / NCP. Dark-figure multipliers follow NFHS-5. Eighteen planted serial series (forager / marauder / commuter) sit inside the synthetic caseload so ranking metrics can be scored. No victim, accused or FIR number is real.
