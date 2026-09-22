export const PAPER = {
  title:
    "ANVAYA: Sequential Series Assignment for Indian Crime Linkage under Dark-Figure Time Dilation and Cross-Crime Versatility",
  authors: "Aditya Ankana",
  venue: "Methods preprint · Project 2 · 2026",
  abstract: `Crime linkage in the literature — and in every prior system built on this corpus — scores a pair. ST-SAGE, INDRA, I-HSTMO-Link++, the Codex I-HSTMO baseline and TRIVENI all ask P(link(i,j) | features) or Λ(i,j). An investigating officer asks something else: given a growing docket S and a new FIR q, should q join S? ANVAYA is a sequential Bayesian assignment. A series is a Dirichlet–multinomial prototype θ_S over modus-operandi fields, a running spatial centroid, a last-event clock and a crime-family Markov state. The Bayes factor BF(q → S) is the predictive MO odds against a singleton background, a typology-scaled spatial kernel, a temporal kernel dilated by the NFHS-5 dark figure of the host state, and a Tonkin (2011) family-transition weight. Hollow FIRs shrink the MO channel toward 1. A Wald sequential probability-ratio test stamps OPEN / HOLD / REJECT rather than dumping a ranked pair list. Evaluation is leave-one-out last-case assignment (Hit@1, Hit@3, MRR) against a Jaccard series baseline — a different denominator from pairwise AUC. Four planted versatile series switch burglary → CAW/rape, the class TRIVENI’s family-blocking would drop. ANVAYA is a methods lab on an NCRB-calibrated synthetic panel. It is not a court exhibit.`,
  keywords: [
    "crime linkage",
    "sequential Bayes",
    "series assignment",
    "India",
    "dark figure",
    "cross-crime",
    "BNS 2023",
    "SPRT",
  ],
};

export const SECTIONS: { id: string; kicker: string; title: string; body: string[] }[] = [
  {
    id: "gap",
    kicker: "01 · Why a sixth algorithm",
    title: "Five pair scorers, one sequential hole",
    body: [
      "ST-SAGE (Claude) operationalises Pooja et al. SAE on a real district graph and links with logistic(Jaccard, Tonkin 2025, distance, time). Its own README records that marauder-only jitter made geography almost a sufficient statistic.",
      "INDRA nested six stages into a linear blend. TRIVENI, which replaced it in this repository, mixed a forensic likelihood ratio over forager / marauder / commuter kernels and gated IFS × Tonkin by FIR coverage. That is the right likelihood for a pair. It is still a pair.",
      "I-HSTMO-Link++ (Gemini) is the most complete multimodal stack — IPC↔BNS, BM25, O_ijk masking, Hawkes, Louvain. Fusion remains P(link | Z) from a calibrated logistic. The Codex baseline is the most epistemically careful and still a logit on seven similarities.",
      "None of the five (i) maintain a series prototype that updates as cases accrue, (ii) dilate time by the NFHS dark figure so Bihar gaps are not scored as Kerala gaps, (iii) treat cross-crime as a Tonkin 2011 transition rather than a hard family block, or (iv) emit an SPRT decision instead of a ranked list. ANVAYA is built for those four gaps.",
    ],
  },
  {
    id: "model",
    kicker: "02 · The model",
    title: "A docket is a conjugate prototype, not a pair",
    body: [
      "Let S = {c_1, …, c_{k−1}} be a docket ordered by date and q a candidate FIR. Each MO field of S is a Dirichlet–multinomial with pseudo-count α = 0.4 against a singleton background θ_0 estimated from unlinked cases. The predictive odds P(value_q | θ_S) / P(value_q | θ_0) are multiplied across jointly observed fields and then raised to (0.35 + 0.65 c), where c is coverage. Hollow FIRs do not vote.",
      "Space is an exponential kernel at Halford typology scale around the running centroid of S, not around a single index offence — foragers 1.8 km, urban marauders 12 km, commuters 72 km. Time is exponential with τ_eff = τ_0(τ) · δ_state · 1.55_festival. δ_state is the NFHS-5 dark-figure multiplier (Kerala 1.35, Bihar 3.2). Under-reporting stretches observed inter-event times; a kernel that ignores δ treats a Bihar series as broken.",
      "Family is not a block. Tonkin, Woodhams, Bull, Bond & Palmer (2011) showed that inter-crime distance and temporal proximity discriminate linked pairs across violent, sexual and property crime. ANVAYA scores P(family_q | family_last) with same-kind 2.45, same-family 1.85, property↔violence-women 1.38 (the versatile burglary–CAW pattern), and a cyber penalty. TRIVENI’s IPC/BNS family block would have dropped those pairs before scoring.",
      "The fused increment is log BF = log Λ_MO + log Λ_geo + log Λ_time + log Λ_family + log Λ_patch. A saturating SAE-cluster boost (1.85) is a fifth channel, not a retrieval-only index. Wald SPRT: log BF ≥ log 10 opens a docket; ≤ −log 10 rejects; otherwise hold.",
    ],
  },
  {
    id: "eval",
    kicker: "03 · Evaluation",
    title: "Leave the last FIR out",
    body: [
      "For every planted series of length ≥ 3, the last case is held out, the prototype is built from the rest, and the held-out FIR is ranked against every other docket. Hit@1, Hit@3 and MRR are query-wise series-assignment metrics. Jaccard Hit@1 is the same task with mean Jaccard-to-members as the score. Versatile Hit@1 is a harder query: the first crime-type switch (burglary → CAW/rape) scored against a prototype that has only seen property offences — the class a family block never retrieves. This is not Tonkin et al. (2025)’s “95 linked pairs in the top 100”, and it is not pairwise AUC.",
      "Twenty-two series: eighteen typed (forager / marauder / commuter) plus four versatile burglary→CAW/rape series with dark-stretched gaps. State rates follow NCRB 2022–24. No victim or FIR number is real.",
    ],
  },
  {
    id: "ethics",
    kicker: "04 · Limits",
    title: "A stamp is not a charge-sheet",
    body: [
      "OPEN means the sequential odds exceed 10:1 on synthetic series, not that the same person is in custody. Dark-figure dilation describes under-reporting; it does not licence treating a high-δ district as a high-offending district. Cross-crime weights are authored from Tonkin 2011, not fitted on Indian CCTNS.",
      "ANVAYA emits log BF, consistency, distinctiveness, coverage, δ and an SPRT stamp. A human investigator stays in the loop. DPDPA 2023 applies to any future deployment; this repository contains none of that data.",
    ],
  },
];

export const EQUATIONS = [
  {
    name: "Join Bayes factor",
    tex: "BF(q → S) = [Π_f P(x_f | θ_S)/P(x_f | θ_0)]^{0.35+0.65 c} · Λ_geo · Λ_time(δ) · Λ_family · Λ_patch",
  },
  {
    name: "Dark-dilated time",
    tex: "Λ_time = Exp(Δt; τ_0(τ)·δ_NFHS·1.55_fest) / Exp(Δt; 140 d)",
  },
  {
    name: "Predictive MO",
    tex: "P(x | θ) = (n_{x} + α) / (n + α K),   α = 0.4",
  },
  {
    name: "SPRT",
    tex: "open if log BF ≥ log 10,   reject if log BF ≤ −log 10,   else hold",
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
    gap: "Pair similarities; dark figure not in the clock",
  },
  {
    name: "I-HSTMO-Link++",
    repo: "ihstmo-gemini-project-2",
    fusion: "Calibrated logistic + Louvain",
    india: "IPC↔BNS, BM25, O_ijk, Hawkes",
    gap: "Classifier; Louvain is post-hoc clustering of pairs",
  },
  {
    name: "I-HSTMO baseline",
    repo: "ihstmoindia-biddata-project-2-codex-1",
    fusion: "Logit on 7 similarities, EB scales",
    india: "Lexicon, offender-disjoint splits",
    gap: "Honest pair ranker; Hawkes is a feature",
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
    repo: "this platform",
    fusion: "Sequential BF to a growing prototype + SPRT",
    india: "Dark-dilated clock, Tonkin 2011 family transitions",
    gap: "Synthetic series only; no neural text; no CCTNS",
  },
];
