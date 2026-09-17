export const PAPER = {
  title:
    "TRIVENI: Typology-Conditional Likelihood Ratios for Indian Crime Linkage under FIR Missingness",
  authors: "Aditya Ankana",
  venue: "Methods preprint · Project 2 · 2026",
  abstract: `Crime linkage decision-support in India cannot be a UK ViCLAS model with the labels swapped. First Information Reports are incomplete, statutes shifted from the IPC to the Bharatiya Nyaya Sanhita on 1 July 2024, reporting is a dark-figure process (NFHS-5), and offenders mix forager, marauder and commuter geometries along NH/SH corridors. Prior systems built for this project — ST-SAGE (graph forecast + Tonkin similarity), INDRA (linear nested score), I-HSTMO-Link++ (logistic multi-modal) and the Codex I-HSTMO baseline (adaptive kernels + lexical BM25) — all score pairs as similarities or as P(link | features). Forensic science scores evidence as a likelihood ratio. TRIVENI does that. A pair is mixed over Halford-style typologies; each typology has its own spatial and temporal scale; modus operandi is a product of Dutta–Banik intuitionistic-fuzzy consistency (hesitancy π = missingness) and the Tonkin 2025 rarity metric; SAE scan co-membership is a fourth channel; a saturating copula stops space and time being counted twice as a Hawkes near-repeat. Candidate generation is SAE-gated blocking, not N². On an NCRB-calibrated synthetic panel with planted forager/marauder/commuter series, TRIVENI dominates Jaccard on ranking metrics while remaining closed-form and inspectable in a browser.`,
  keywords: [
    "crime linkage",
    "likelihood ratio",
    "India",
    "modus operandi",
    "intuitionistic fuzzy sets",
    "small-area estimation",
    "offender typology",
    "BNS 2023",
  ],
};

export const SECTIONS: { id: string; kicker: string; title: string; body: string[] }[] = [
  {
    id: "gap",
    kicker: "01 · Why a fifth algorithm",
    title: "Four prior systems, one forensic hole",
    body: [
      "ST-SAGE (Claude, project-2-claude) operationalises Pooja et al. (2024) SAE on a real district graph and replaces raster ST-ResNet with graph convolution. Its linkage layer is logistic in Jaccard, Tonkin 2025, distance and time. The README is honest that marauder-only jitter made geography too strong — and the generator never left that geometry. Held-out linkage AUC on that synthetic set is near-ceiling because space is a near-sufficient statistic.",
      "INDRA (this workspace, earlier) nested six stages into a linear blend 0.26 geo + 0.16 time + 0.34 IFS + 0.12 risk + 0.12 forager. That is a ranking score, not a likelihood ratio. Weights were authored, not identified. Festival stretch and IFS hesitancy were the India-specific gains. It still used one marauder-ish kernel for every pair.",
      "I-HSTMO-Link++ (Gemini, ihstmo-gemini-project-2) is the most complete stack: IPC↔BNS, multilingual BM25, Bayes log-odds MO with O_ijk masking, marked Hawkes, Louvain series graphs, 9,999 synthetic FIRs. The fusion is still P(link | Z) from a calibrated logistic. That is a classifier, not a forensic LR. Hawkes H* and space–time kernels can double-count the same near-repeat mark.",
      "The Codex I-HSTMO baseline (ihstmoindia-biddata-project-2-codex-1) is the most epistemically careful: offender-disjoint splits, adaptive EB scales, explicit “this is not a fitted Hawkes process”, coverage flags, no transferred UK ViCLAS numbers. Fusion remains a linear logit on seven similarities. Missing MO is a feature, not an LR that goes to 1.",
      "None of the four (i) mix offender typologies inside the score, (ii) report Λ = P(E | linked)/P(E | unlinked), (iii) send low-coverage FIRs to LR = 1 rather than to a similarity of 0 or 1, or (iv) use SAE clusters as a blocking index for big-data retrieval. TRIVENI is built for those four gaps.",
    ],
  },
  {
    id: "model",
    kicker: "02 · The model",
    title: "Three streams, a mixture, a copula",
    body: [
      "Let a pair of cases (i, j) have great-circle distance d km, day gap Δt, MO vectors with IFS triples (μ, ν, π), and district SAE relative risks r_i, r_j. An offender typology τ ∈ {forager, marauder, commuter} (Halford 2023; Borg & Svensson 2022) has spatial scale d0(τ) and temporal scale τ0(τ). Urban marauders use d0 = 12 km; rural marauders 35 km; foragers 1.8 km; commuters 52 km on an NH/SH corridor and 88 km off it.",
      "Soft typology weights π(τ | d) are a normalised triple of exponentials in d, with a corridor boost on the commuter component. This is the opposite of ST-SAGE’s marauder-only jitter: a 60 km pair is allowed to be a commuter rather than forced into a failed marauder kernel.",
      "Each channel is a likelihood ratio of exponential densities against a wide Indian background (120 km, 90 days): Λ_desh(τ) = p(d | linked, τ) / p(d | unlinked), and likewise Λ_kaal(τ) with festival-stretched τ0 (Holi, Diwali, Navratri/Durga Puja × 1.55). Festival stretch is unique to Indian calendars; UK series models have no equivalent.",
      "Λ_riti is the product of an IFS consistency term exp(2.1 (S_IFS − 0.5)) and a Tonkin 2025 distinctiveness term. Coverage — the share of MO fields jointly observed — gates the product. If both FIRs are hollow (high π), Λ_riti → 1: the pair is uninformative, not a match and not a mismatch. That is the forensic reading of Dutta & Banik (2024) hesitancy, which Jaccard cannot express.",
      "Λ_patch multiplies SAE risk concordance exp(−|log r_i − log r_j|) by 2.15 if both districts sit in the same Kulldorff-lite cylinder (Mathews, Binu & Guddattu 2024). Serials concentrate in persistent high-RR belts (Delhi–Gurugram–Alwar in the CAW literature).",
      "Space and time are not independent: near-repeats are a Hawkes mark. A saturating Frank-style penalty D = 1 + 0.42 · σ(Λ_desh)σ(Λ_kaal) stops the product double-counting that mark. The fused score is Λ = Σ_τ π(τ|d) · (Λ_desh Λ_kaal Λ_riti Λ_patch) / D.",
    ],
  },
  {
    id: "bigdata",
    kicker: "03 · Big data without N²",
    title: "SAE-gated blocking",
    body: [
      "A national FIR store cannot score every pair. TRIVENI retrieves candidates as the union of (a) 3·d0 spatial neighbours, (b) co-members of an SAE/scan cluster, (c) NH/SH corridor mates, (d) inverted-index hits on rare tokens (acid, desi katta/tamancha, climb, nakab, known-lure), (e) IPC↔BNS family-compatible cross-crime (Tonkin et al. 2011). The pool is capped at 160. This is the operational reading of I-HSTMO’s multi-stage retrieval, with SAE clusters as the India-specific index the other systems lacked.",
      "Statutes flip on 1 July 2024. TRIVENI stores both IPC and BNS labels and blocks on family (violence-women, property, person, cyber), so a June 2024 IPC 376 still retrieves a July 2024 BNS 64. That is Gemini’s crosswalk, used as a blocking key rather than as a learned embedding.",
    ],
  },
  {
    id: "data",
    kicker: "04 · Data",
    title: "What is real, what is planted",
    body: [
      "State CAW, murder, cyber and violent rates follow NCRB Crime in India 2022–2024 (Tables 3A.1, 2A.1, 9A.1, 1C.1). District centroids, density and urbanisation follow Census / NCP. Sex ratio, female literacy and dark-figure multipliers follow NFHS-5 (Kerala ≈ 1.35, Bihar ≈ 3.2). Festival and monsoon calendars are year-specific.",
      "The district–month panel and the caseload are seeded synthetic (mulberry32, seed 2026). Eighteen planted series are typed as forager, marauder or commuter with matching jitter, so typology recovery is a testable claim rather than a label glued on after the fact. Vernacular tokens (desi katta, tamancha, nakabjani, taala tod kar, pulsar bike, reiki) are fixtures from the Codex multilingual lexicon, not a claim of representative language coverage.",
      "No victim, accused or FIR number is real. Reporting is not incidence. TRIVENI is a methods lab.",
    ],
  },
  {
    id: "eval",
    kicker: "05 · Evaluation",
    title: "What we measure, and what we do not",
    body: [
      "Pair metrics: ROC AUC and AUPRC of log Λ against Jaccard, IFS-only and geo-only, on all planted linked pairs plus a 12× unlinked sample. Ranking metrics follow Tonkin et al. (2025): top-100 precision, median first rank, Recall@10 and MRR on query-wise historical retrieval. These are not the same denominator as “95 linked pairs in the top 100”.",
      "We do not claim transfer from UK ViCLAS, a calibrated real-offender probability, a fitted Hawkes process, a neural multilingual encoder, or CCTNS/ICJS access. Those absences are inherited from the Codex baseline on purpose. A likelihood ratio on synthetic series is a ranking instrument, not a court exhibit.",
    ],
  },
  {
    id: "ethics",
    kicker: "06 · Limits",
    title: "Decision support, not targeting",
    body: [
      "Dark-figure SAE describes under-reporting; it does not licence treating a high-RR district as a high-offending district. Festival stretch describes calendar crowding, not communal targeting. Cross-crime family blocking is a retrieval convenience, not a statement that every theft is a burglary.",
      "TRIVENI emits log Λ, typology mix, coverage and an explanation of which stream moved. It does not emit a binary “same offender” flag. A human investigator stays in the loop. DPDPA 2023 and CCTNS governance apply to any future deployment; this repository contains none of that data.",
    ],
  },
];

export const EQUATIONS = [
  {
    name: "Mixture LR",
    tex: "Λ(i,j) = Σ_τ π(τ | d) · [Λ_desh(τ) Λ_kaal(τ) Λ_riti Λ_patch] / D(Λ_desh, Λ_kaal)",
  },
  {
    name: "Desh / Kaal",
    tex: "Λ_desh(τ) = Exp(d; d0(τ)) / Exp(d; 120 km),   Λ_kaal(τ) = Exp(Δt; τ0(τ)·1.55_fest) / Exp(Δt; 90 d)",
  },
  {
    name: "Riti",
    tex: "Λ_riti = e^{2.1(S_IFS − 0.5)} · e^{0.85 (T_2025 − 1.4) c} · (0.35 + 0.65 c) + (1 − c)",
  },
  {
    name: "Copula penalty",
    tex: "D = 1 + 0.42 · σ(Λ_desh) σ(Λ_kaal),   σ(x) = x/(1+x)",
  },
];

export const PRIOR_SYSTEMS = [
  {
    name: "ST-SAGE",
    repo: "project-2-claude",
    fusion: "Logistic(Jaccard, Tonkin 2025, distance, time)",
    india: "Real NCRB 2001 CAW + Census graph; GNN forecast",
    gap: "Marauder-only geometry; no IFS; no festival; no LR",
  },
  {
    name: "INDRA",
    repo: "project-2-grok (prior)",
    fusion: "Linear nest 0.26 / 0.16 / 0.34 / 0.12 / 0.12",
    india: "Festival τ, NFHS dark figure, BYM SAE, IFS",
    gap: "Authored weights; one kernel; scores similarities not Λ",
  },
  {
    name: "I-HSTMO-Link++",
    repo: "ihstmo-gemini-project-2",
    fusion: "Calibrated logistic on 9 features + Louvain",
    india: "IPC↔BNS, multilingual BM25, O_ijk masking, Hawkes",
    gap: "Classifier not LR; no typology mixture; no SAE blocking",
  },
  {
    name: "I-HSTMO baseline",
    repo: "ihstmoindia-biddata-project-2-codex-1",
    fusion: "Logit on 7 similarities, EB adaptive scales",
    india: "Lexicon, PIB cyber panel, offender-disjoint splits",
    gap: "Honest but not LR; Hawkes is a feature not a process",
  },
  {
    name: "TRIVENI",
    repo: "this platform",
    fusion: "Typology-mixture likelihood ratio + copula + SAE block",
    india: "All of the above, plus forager / marauder / commuter kernels",
    gap: "Synthetic series only; no neural text; no CCTNS",
  },
];

export const STREAMS = [
  {
    id: "desh",
    title: "Desh — space as an LR",
    source: "Halford 2023 · Woodhams et al. 2021 · Tonkin 2011",
    body: "Exponential densities at typology-specific d0 against a 120 km Indian background. A 60 km pair is a commuter, not a failed marauder.",
    formula: "Λ_desh(τ) = Exp(d; d0(τ)) / Exp(d; 120 km)",
  },
  {
    id: "kaal",
    title: "Kaal — time, stretched by the calendar",
    source: "Unique to Indian festivals · Zhu & Xie 2022",
    body: "Holi, Diwali and Navratri/Durga Puja stretch τ0 by 1.55. UK series models have no equivalent. Monsoon modulates generation, not the LR.",
    formula: "Λ_kaal(τ) = Exp(Δt; τ0(τ)·1.55_fest) / Exp(Δt; 90 d)",
  },
  {
    id: "riti",
    title: "Riti — IFS × Tonkin, gated by coverage",
    source: "Dutta & Banik 2024 · Tonkin et al. 2025",
    body: "Consistency from IFS similarity; distinctiveness from log(1+3+3a−(b+c)). Hollow FIRs (high π) send Λ_riti → 1, not Jaccard 0 or 1.",
    formula: "Λ_riti = e^{2.1(S−0.5)} · e^{0.85(T−1.4)c} · (0.35+0.65c) + (1−c)",
  },
  {
    id: "patch",
    title: "Patch — SAE belt as a fourth channel",
    source: "Pooja et al. 2024 · Mathews et al. 2024",
    body: "Relative-risk concordance times a 2.15 boost if both districts sit in the same Kulldorff-lite cylinder. Serials concentrate in persistent high-RR belts.",
    formula: "Λ_patch = (2.15 if same cylinder else 1) · exp(−|log r_i − log r_j|)",
  },
];
