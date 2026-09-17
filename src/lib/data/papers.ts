export type Paper = {
  title: string;
  authors: string;
  year: string;
  feeds: string;
  summary: string;
};

export const PAPERS: Paper[] = [
  {
    title: "Crime against women in India: district-level risk estimation using small area estimation",
    authors: "Pooja, Guddattu & Rao",
    year: "2024",
    feeds: "Stage 1 — BYM / SAE relative risk",
    summary:
      "NCRB 2020–2022, 640 districts. Besag–York–Mollié spatial SAE with INLA. National CAW rate 57 → 67 per lakh women. Delhi 145, Nagaland 5. Hotspots in Rajasthan, Madhya Pradesh, Haryana, Telangana, Odisha. Sex ratio and density associated with risk.",
  },
  {
    title: "Detecting spatial and spatio-temporal clusters of rape in India, 2011–2020",
    authors: "Mathews, Binu & Guddattu",
    year: "2024",
    feeds: "Stage 2 — Kulldorff space–time scan",
    summary:
      "Discrete Poisson scan, 100 km windows, 3-year cylinders. Primary clusters persist in Central, North and North-Eastern zones. 37 districts (5.8%) sat in spatial clusters every year. Nirbhaya 2012 reporting shock in the north.",
  },
  {
    title: "A novel generalized similarity measure under intuitionistic fuzzy environment and its applications to criminal investigation",
    authors: "Dutta & Banik (Dibrugarh University)",
    year: "2024",
    feeds: "Stage 5 — IFS linkage under FIR uncertainty",
    summary:
      "Membership, non-membership and hesitancy for incomplete crime-scene evidence. Fixes Chen/Ye/Hong–Kim failures on hesitancy and signed differences. Applied to crime linkage clustering and psychological profiling.",
  },
  {
    title: "Building the statistical evidence base for crime linkage decision-support tools with sexual offences",
    authors: "Tonkin, Lemeire, Woodhams et al.",
    year: "2025",
    feeds: "Stage 5 — behavioural similarity beyond Jaccard",
    summary:
      "10,918 UK stranger sexual offences, 35 algorithms. A new behavioural similarity metric beat Jaccard (AUC 0.95). Four-quartiles ranking: 95% of linked pairs in the top 100. Collapsing MO variables did not help.",
  },
  {
    title: "Spatiotemporal-textual point processes for crime linkage detection",
    authors: "Zhu & Xie",
    year: "2022",
    feeds: "Stage 5 — geo-temporal point-process kernel",
    summary:
      "Joint space–time–text intensity for linking events without DNA. INDRA uses the geo-temporal kernel and replaces the text channel with IFS-encoded MO.",
  },
  {
    title: "All burglaries are not the same: predicting near-repeat burglaries using modus operandi",
    authors: "Borg & Svensson",
    year: "2022",
    feeds: "Stage 4 — near-repeat / forager + MO",
    summary:
      "Near-repeat burglaries are stylized and city-specific. MO (entry, target, goods, traces) predicts whether a scene belongs to a repeat chain (F1 ≈ 0.82).",
  },
  {
    title: "Linking foraging domestic burglary: crimes committed within police-identified optimal forager patches",
    authors: "Forager-patch study",
    year: "2012+",
    feeds: "Stage 4 — optimal-forager decay kernel",
    summary:
      "Offenders forage locally after a successful strike. INDRA adds a highway-corridor boost for India NH/SH commuting belts.",
  },
  {
    title: "A descriptive analysis of the temporal and geographical proximities seen within UK series of sex offences",
    authors: "UK series proximity study",
    year: "—",
    feeds: "Stage 5 — spatial and temporal length-scales",
    summary:
      "Serial sexual offences cluster more tightly in time and space than chance. Calibrates INDRA d0 (12 km urban / 35 km rural) and τ (10 days, stretched in festivals).",
  },
  {
    title: "A test of case linkage principles with solved and unsolved serial rapes",
    authors: "Woodhams / linkage principles",
    year: "—",
    feeds: "Stage 5 — consistency and distinctiveness",
    summary:
      "Behavioural consistency and distinctiveness hold for both solved and unsolved series — the statistical warrant for linking without DNA.",
  },
  {
    title: "Hybrid ST-ResNet and LSTM approach for precise crime hotspot prediction",
    authors: "Shahmoradi, Alesheikh, Jafari & Lotfata",
    year: "2025",
    feeds: "Stage 6 — spatio-temporal forecast",
    summary:
      "ST-ResNet plus LSTM with calendar and proximity features. Hit rate > 88% at 500 m in Chicago. INDRA uses a closed-form ST-lite (lags, neighbours, festival, monsoon, forager) that runs in the browser.",
  },
  {
    title: "Deep learning for crime forecasting: the role of mobility at fine-grained spatiotemporal scales",
    authors: "Mobility–crime DL",
    year: "—",
    feeds: "Stage 6 — ambient population",
    summary:
      "Ambient (not just resident) population drives urban risk. INDRA proxies this with urbanisation and festival crowding.",
  },
  {
    title: "Crime prediction with graph neural networks and multivariate normal distributions",
    authors: "GNN crime prediction",
    year: "—",
    feeds: "Stage 1 — neighbour graph",
    summary:
      "Districts as a spatial graph. INDRA’s CAR smoother is a linear GNN layer on k-nearest districts.",
  },
  {
    title: "Urban theft prediction via LLM-empowered spatiotemporal transformer",
    authors: "LLM-ST transformer",
    year: "—",
    feeds: "Compared, not copied",
    summary:
      "Heavy transformer stack. INDRA deliberately stays closed-form and inspectable for investigative use.",
  },
  {
    title: "Spatio-temporal crime hotspots and the ambient population",
    authors: "Ambient-population hotspots",
    year: "—",
    feeds: "Stage 2 — exposure",
    summary:
      "Hotspots shift with ambient population. Expected counts in INDRA use female population for CAW/rape and total population otherwise.",
  },
  {
    title: "Towards spatio-temporal crime events prediction",
    authors: "ST event prediction",
    year: "—",
    feeds: "Stage 6",
    summary: "Event-level prediction framing used for INDRA’s next-month district forecasts.",
  },
  {
    title: "Spatio-temporal Crime Analysis and Forecasting on Twitter Data Using Machine Learning Algorithms",
    authors: "Twitter ST-ML",
    year: "—",
    feeds: "Not used operationally",
    summary: "Social-media nowcasting. Kept as literature context; INDRA does not scrape Twitter.",
  },
  {
    title: "Unsupervised identification of crime problems from police free-text data",
    authors: "Free-text crime problems",
    year: "—",
    feeds: "Stage 5 — missingness / hesitancy",
    summary: "Narrative FIRs are incomplete. Encoded as IFS hesitancy π rather than dropped rows.",
  },
  {
    title: "The feasibility of using crime scene behaviour to detect versatile serial offenders",
    authors: "Behavioural consistency / distinctiveness",
    year: "—",
    feeds: "Stage 5 — assumptions",
    summary: "Empirical test that versatile serial offenders still leave a usable behavioural signature.",
  },
  {
    title: "Tonkin, Woodhams, Bull, Bond & Palmer (2011)",
    authors: "Tonkin et al.",
    year: "2011",
    feeds: "Stage 5 — inter-crime distance",
    summary: "Foundational crime-linkage distances (geo, temporal, MO) that INDRA nests under an IFS layer.",
  },
  {
    title: "Criminal networks and spatial density",
    authors: "Network–space",
    year: "—",
    feeds: "Stage 4 — corridors",
    summary: "Offending density follows network structure. INDRA’s highway boost is the India analogue.",
  },
  {
    title: "Design and Analysis of Machine Learning Algorithms (crime applications)",
    authors: "ML survey",
    year: "—",
    feeds: "Baselines",
    summary: "Reference for why INDRA reports AUC, AUPRC and top-k ranks rather than accuracy.",
  },
];
