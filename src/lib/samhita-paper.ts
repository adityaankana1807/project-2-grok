export const PAPER = {
  title:
    "SAMHITA: Infinite-Table Series Discovery for Indian Crime Linkage under Dark-Figure Occupancy and Modus Drift",
  authors: "Aditya Ankana",
  venue: "Methods preprint · Project 2 · 2026",
  abstract: `Every prior system on this corpus scores a pair or a join to a known docket. ST-SAGE, INDRA, I-HSTMO-Link++, the Codex I-HSTMO baseline and TRIVENI ask P(link(i,j) | features) or Λ(i,j). ANVAYA asks whether FIR q should join series S — but S is given. An investigating officer compiling a caseload does not have planted series. Each new FIR either sits at an existing table or opens a new one. SAMHITA is that Chinese-restaurant process. The likelihood of a seat is ANVAYA’s join Bayes factor computed on a decayed Dirichlet prototype (140-day MO half-life, so versatility is a random walk rather than a family table). Occupancy is inflated by the NFHS-5 dark figure of the host state, so a thin Bihar table is not treated as a singleton Kerala table. The new-table option has concentration α = 1.85. Evaluation is a partition of a mixed pool (22 planted series plus 80 geographically matched singletons): Adjusted Rand Index against a greedy SPRT partitioner that ANVAYA would have used. SAMHITA is a methods lab on an NCRB-calibrated synthetic panel. It is not a court exhibit.`,
  keywords: [
    "crime linkage",
    "Chinese restaurant process",
    "series discovery",
    "India",
    "dark figure",
    "modus drift",
    "BNS 2023",
    "partition",
  ],
};

export const SECTIONS: { id: string; kicker: string; title: string; body: string[] }[] = [
  {
    id: "gap",
    kicker: "01 · Why a seventh algorithm",
    title: "Six scorers, no compiler",
    body: [
      "ST-SAGE (Claude) operationalises Pooja et al. SAE on a real district graph and links with logistic(Jaccard, Tonkin 2025, distance, time). Marauder-only jitter made geography almost a sufficient statistic.",
      "INDRA nested six stages into a linear blend. TRIVENI mixed a forensic likelihood ratio over forager / marauder / commuter kernels. I-HSTMO-Link++ (Gemini) fused IPC↔BNS, BM25, O_ijk, Hawkes and Louvain — Louvain is post-hoc clustering of a pair graph, not an online compiler. The Codex baseline is a logit on seven similarities.",
      "ANVAYA finally asked the officer’s question — should q join S? — but S had to exist. Leave-one-out last-FIR Hit@1 is assignment to a gold docket. Real caseloads start empty.",
      "None of the six (i) maintain an unknown number of tables with a new-table option, (ii) inflate occupancy by the NFHS dark figure so under-reporting does not over-open dockets, (iii) let MO drift so a burglary→CAW series is a random walk on the simplex rather than a special family weight, or (iv) report Adjusted Rand Index on a mixed pool of series and singletons. SAMHITA is built for those four gaps.",
    ],
  },
  {
    id: "model",
    kicker: "02 · The model",
    title: "A caseload is a Chinese restaurant, not a pair and not a docket",
    body: [
      "FIRs arrive in date order. After k − 1 allocations the restaurant has tables T_1, …, T_m. FIR q sits at T with probability proportional to n_T · δ̄_T · BF(q → T), or opens a new table with probability proportional to α. BF is ANVAYA’s product of Dirichlet–multinomial MO odds, typology-scaled geo, dark-dilated time and Tonkin 2011 family weight — but the prototype is decayed: each past member’s MO counts are weighted exp(−Δt / 140 d). Versatility is continuous.",
      "δ̄_T is the mean NFHS-5 dark figure of the table’s host districts (Kerala 1.35, Bihar 3.2). Under-reporting thins observed members; a CRP that used raw n would over-open tables in high-δ states. Occupancy inflation is the India-specific correction ANVAYA never made: ANVAYA dilated the clock, SAMHITA inflates the table.",
      "MAP allocation, not sampling: join if log(n δ̄) + log BF > log α, else new. α = 1.85. Hollow FIRs shrink BF toward 1 and therefore tend to open rather than contaminate a table — the opposite of a similarity that treats missing as match.",
      "The greedy foil is ANVAYA’s SPRT used as a partitioner: join the best table if log BF ≥ log 10, else new. That ignores occupancy and drift. Louvain-on-pairs (Gemini) is a third foil, not computed here because it needs a full pair graph; ARI against greedy SPRT is the honest sequential baseline.",
    ],
  },
  {
    id: "eval",
    kicker: "03 · Evaluation",
    title: "A mixed pool, not a gold docket",
    body: [
      "The discovery pool is every planted series member plus 80 singletons drawn first from the same host districts (hard negatives) then from elsewhere. Gold labels are series ids, each singleton its own cluster. Predicted labels are table ids after a single chronological pass. Headline: Adjusted Rand Index. Complements: series recovery (purity ≥ 0.7 and recall ≥ 0.5), singleton precision, over-segmentation (one series split across two size-≥2 tables), under-segmentation (one table eating two series).",
      "Twenty-two series: eighteen typed plus four versatile burglary→CAW/rape with dark-stretched gaps. State rates follow NCRB 2022–24. No victim or FIR number is real.",
    ],
  },
  {
    id: "ethics",
    kicker: "04 · Limits",
    title: "A table is not a gang",
    body: [
      "Opening T17 means the CRP preferred a new table on synthetic FIRs, not that a new offender exists. Occupancy inflation describes under-reporting; it does not licence treating a high-δ district as a high-offending district. Drift half-life is authored, not fitted on CCTNS.",
      "SAMHITA emits log-posterior, join/new, δ̄ and ARI. A human investigator stays in the loop. DPDPA 2023 applies to any future deployment; this repository contains none of that data.",
    ],
  },
];

export const EQUATIONS = [
  {
    name: "Chinese-restaurant seat",
    tex: "P(z_q = T | rest) ∝ n_T · δ̄_T · BF(q → T_decayed),   P(z_q = new) ∝ α",
  },
  {
    name: "Dark-figure occupancy",
    tex: "n_eff = n_T · δ̄_T,   δ̄ from NFHS-5 of the table’s districts",
  },
  {
    name: "MO drift",
    tex: "w_i = exp(−Δt_i / 140 d),   n_x = Σ_i w_i 1[x_i = x]",
  },
  {
    name: "MAP rule",
    tex: "join T if log n_eff + log BF > log α,   else open,   α = 1.85",
  },
];

export const PRIOR_SYSTEMS = [
  {
    name: "ST-SAGE",
    repo: "project-2-claude",
    fusion: "Logistic(Jaccard, Tonkin 2025, distance, time)",
    india: "Real NCRB 2001 CAW + Census graph",
    gap: "Pair scorer; marauder-only geometry",
  },
  {
    name: "INDRA",
    repo: "project-2-grok (prior)",
    fusion: "Linear nest 0.26/0.16/0.34/0.12/0.12",
    india: "Festival τ, NFHS dark figure as SAE, IFS",
    gap: "Pair similarities; no compiler",
  },
  {
    name: "I-HSTMO-Link++",
    repo: "ihstmo-gemini-project-2",
    fusion: "Calibrated logistic + Louvain",
    india: "IPC↔BNS, BM25, O_ijk, Hawkes",
    gap: "Louvain clusters a pair graph after the fact",
  },
  {
    name: "I-HSTMO baseline",
    repo: "ihstmoindia-biddata-project-2-codex-1",
    fusion: "Logit on 7 similarities, EB scales",
    india: "Lexicon, offender-disjoint splits",
    gap: "Honest pair ranker",
  },
  {
    name: "TRIVENI",
    repo: "project-2-grok (prior)",
    fusion: "Typology-mixture pairwise LR + copula",
    india: "IFS×Tonkin gated coverage, SAE blocking",
    gap: "Still a pair; family block drops versatile serials",
  },
  {
    name: "ANVAYA",
    repo: "project-2-grok (prior)",
    fusion: "Sequential BF to a growing prototype + SPRT",
    india: "Dark-dilated clock, Tonkin 2011 family transitions",
    gap: "Assignment to a known docket; no new-table option",
  },
  {
    name: "SAMHITA",
    repo: "this platform",
    fusion: "CRP / infinite tables + decayed BF + δ occupancy",
    india: "Dark-figure table size, MO drift, mixed-pool ARI",
    gap: "Synthetic pool only; α and half-life authored",
  },
];
