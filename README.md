# SAMHITA — Infinite-Table Series Discovery for Indian Crime Linkage

**Project 2.** A forensic case-linkage platform for Indian districts: NCRB-calibrated small-area risk, space–time scan clusters, and a Chinese-restaurant compiler that opens or joins series tables under FIR missingness, MO drift, and the IPC → BNS flip.

This is a methods lab, not an operational targeting tool. Counts are a seeded synthetic panel calibrated to public NCRB / Census / NFHS priors. They are not official police microdata. Reporting is not incidence.

## Why a seventh algorithm

Six prior systems on the same Drive corpus still score a pair or join a *known* docket:

| System | Repo | Fusion | Hole |
| --- | --- | --- | --- |
| ST-SAGE | `project-2-claude` | Logistic(Jaccard, Tonkin 2025, distance, time) | Pair; marauder-only |
| INDRA | `project-2-grok` (prior) | Linear nest 0.26/0.16/0.34/0.12/0.12 | Pair similarities |
| I-HSTMO-Link++ | `ihstmo-gemini-project-2` | Calibrated logistic + Louvain | Louvain is post-hoc on pairs |
| I-HSTMO baseline | `ihstmoindia-biddata-project-2-codex-1` | Logit on 7 similarities | Honest pair ranker |
| TRIVENI | `project-2-grok` (prior) | Typology-mixture pairwise LR | Family block drops versatile serials |
| ANVAYA | `project-2-grok` (prior) | Sequential BF + SPRT | Assignment to a gold docket |

**SAMHITA** (संहिता — compiled collection) scores

```
P(join T) ∝ n_T · δ̄_T · BF(q → T_decayed)
P(new)    ∝ α
```

MAP: join if `log n_eff + log BF > log α`, else open. Occupancy is inflated by the NFHS-5 dark figure. MO counts decay with a 140-day half-life. Evaluation is Adjusted Rand Index on a mixed pool, not Hit@1.

## Channels

1. **Compiler** — Chinese-restaurant process, concentration α = 1.85
2. **Occupancy** — `n_eff = n · δ̄` so Bihar tables are not over-opened
3. **Drift** — Dirichlet weights `exp(−Δt / 140 d)` so burglary→CAW is a walk
4. **Join BF** — Dirichlet–multinomial MO × typology geo × dark-dilated time × Tonkin 2011 family
5. **Partition** — ARI, series recovery, singleton precision, over/under-segmentation

## Stack

React 19, TanStack Start / Router, Tailwind v4, Zustand, Recharts.

## Routes

| Path | View |
| --- | --- |
| `/` | District risk atlas, live partition ARI |
| `/algorithm` | CRP, occupancy, drift, seven-system table |
| `/linkage` | Chronological stream: join or open |
| `/series` | Twenty-two planted series with captured tables |
| `/forecast` | Next-month hotspot watch list |
| `/paper` | IMRaD methods preprint with live ARI |
| `/data` | NCRB priors and CSV export |
| `/literature` | Drive corpus mapped onto SAMHITA channels |

## Data note

State CAW / murder / cyber / violent rates follow NCRB Crime in India 2022–2024. District centroids and urbanisation follow Census / NCP. Dark-figure multipliers follow NFHS-5. Twenty-two planted serial series sit inside the synthetic caseload with 80 matched singletons so partition metrics can be scored. No victim, accused or FIR number is real.
