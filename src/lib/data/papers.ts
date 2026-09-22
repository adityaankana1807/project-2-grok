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
    feeds: "Patch — BYM / SAE relative risk; blocking index",
    summary:
      "NCRB 2020–2022, 640 districts. Besag–York–Mollié spatial SAE with INLA. National CAW rate 57 → 67 per lakh women. Delhi 145, Nagaland 5. Hotspots in Rajasthan, Madhya Pradesh, Haryana, Telangana, Odisha. Sex ratio and density associated with risk.",
  },
  {
    title: "Detecting spatial and spatio-temporal clusters of rape in India, 2011–2020",
    authors: "Mathews, Binu & Guddattu",
    year: "2024",
    feeds: "Patch — Kulldorff space–time scan",
    summary:
      "Discrete Poisson scan, 100 km windows, 3-year cylinders. Primary clusters persist in Central, North and North-Eastern zones. 37 districts (5.8%) sat in spatial clusters every year. Nirbhaya 2012 reporting shock in the north.",
  },
  {
    title: "A novel generalized similarity measure under intuitionistic fuzzy environment and its applications to criminal investigation",
    authors: "Dutta & Banik (Dibrugarh University)",
    year: "2024",
    feeds: "Prototype — IFS missingness",
    summary:
      "Membership, non-membership and hesitancy for incomplete crime-scene evidence. Fixes Chen/Ye/Hong–Kim failures on hesitancy and signed differences. Applied to crime linkage clustering and psychological profiling. ANVAYA reads π as missingness: hollow FIRs shrink the MO channel toward 1 rather than voting.",
  },
  {
    title: "Building the statistical evidence base for crime linkage decision-support tools with sexual offences",
    authors: "Tonkin, Lemeire, Woodhams et al.",
    year: "2025",
    feeds: "Prototype — distinctiveness diagnostic",
    summary:
      "10,918 UK stranger sexual offences, 35 algorithms. A new behavioural similarity metric beat Jaccard (AUC 0.95). Four-quartiles ranking: 95% of linked pairs in the top 100. Collapsing MO variables did not help. ANVAYA keeps the metric as a distinctiveness diagnostic beside Dirichlet predictive odds — not as the assignment score.",
  },
  {
    title: "Spatiotemporal-textual point processes for crime linkage detection",
    authors: "Zhu & Xie",
    year: "2022",
    feeds: "Time — dark-dilated kernel",
    summary:
      "Joint space–time–text intensity for linking events without DNA. ANVAYA keeps the geo-temporal kernel around a series centroid, replaces text with a Dirichlet MO prototype, and dilates time by the NFHS dark figure so Hawkes-style near-repeats are not the only clock.",
  },
  {
    title: "All burglaries are not the same: predicting near-repeat burglaries using modus operandi",
    authors: "Borg & Svensson",
    year: "2022",
    feeds: "Prototype vs near-repeat",
    summary:
      "Near-repeat burglaries are stylized and city-specific. MO (entry, target, goods, traces) predicts whether a scene belongs to a repeat chain (F1 ≈ 0.82). Distinct from same-offender labels — ANVAYA’s prototype is the same-offender object; SAE co-membership is only a fifth channel.",
  },
  {
    title: "Linking foraging domestic burglary: crimes committed within police-identified optimal forager patches",
    authors: "Halford",
    year: "2023",
    feeds: "Geo — typology scales",
    summary:
      "Offenders forage locally after a successful strike. ST-SAGE planted marauder-only jitter; TRIVENI mixed three typologies inside a pairwise Λ. ANVAYA plants all three plus four versatile series, and uses typology only to set the centroid kernel — the score is a join, not a mixture over pairs.",
  },
  {
    title: "A descriptive analysis of the temporal and geographical proximities seen within UK series of sex offences",
    authors: "Woodhams et al.",
    year: "2021",
    feeds: "Geo / Time — length-scales",
    summary:
      "Serial sexual offences cluster more tightly in time and space than chance. Calibrates marauder d0 (12 km urban / 35 km rural) and τ0; forager and commuter scales are India-specific additions.",
  },
  {
    title: "A test of case linkage principles with solved and unsolved serial rapes",
    authors: "Woodhams & Labuschagne",
    year: "2012",
    feeds: "Prototype — consistency",
    summary:
      "Behavioural consistency and distinctiveness hold for both solved and unsolved series — the statistical warrant for linking without DNA.",
  },
  {
    title: "Hybrid ST-ResNet and LSTM approach for precise crime hotspot prediction",
    authors: "Shahmoradi, Alesheikh, Jafari & Lotfata",
    year: "2025",
    feeds: "Forecast — ST-lite cousin",
    summary:
      "ST-ResNet plus LSTM with calendar and proximity features. Hit rate > 88% at 500 m in Chicago. ANVAYA uses a closed-form ST-lite (lags, neighbours, festival, monsoon) as a watch-list, kept off the linkage score.",
  },
  {
    title: "Deep learning for crime forecasting: the role of mobility at fine-grained spatiotemporal scales",
    authors: "Albors-Zumel et al.",
    year: "2025",
    feeds: "Patch — ambient population",
    summary:
      "Ambient (not just resident) population drives urban risk. ANVAYA proxies this with urbanisation and festival crowding on the atlas, not inside the join Bayes factor.",
  },
  {
    title: "Crime prediction with graph neural networks and multivariate normal distributions",
    authors: "Tekin & Kozat",
    year: "2022",
    feeds: "Patch — neighbour graph",
    summary:
      "Districts as a spatial graph. ANVAYA’s CAR smoother is a linear GNN layer on k-nearest districts for SAE risk, not for assignment.",
  },
  {
    title: "Urban theft prediction via LLM-empowered spatiotemporal transformer",
    authors: "Tang et al.",
    year: "2026",
    feeds: "Compared, not copied",
    summary:
      "Heavy transformer stack. ANVAYA deliberately stays closed-form and inspectable for investigative use.",
  },
  {
    title: "Spatio-temporal crime hotspots and the ambient population",
    authors: "Malleson & Andresen",
    year: "2015",
    feeds: "Patch — exposure",
    summary:
      "Hotspots shift with ambient population. Expected counts use female population for CAW/rape and total population otherwise.",
  },
  {
    title: "Towards spatio-temporal crime events prediction",
    authors: "Wang et al.",
    year: "2017",
    feeds: "Forecast",
    summary: "Event-level prediction framing used for ANVAYA’s next-month district forecasts — kept off the join score.",
  },
  {
    title: "Spatio-temporal Crime Analysis and Forecasting on Twitter Data Using Machine Learning Algorithms",
    authors: "Vivek & Prathap",
    year: "2023",
    feeds: "Not used operationally",
    summary: "Social-media nowcasting. Kept as literature context; ANVAYA does not scrape Twitter.",
  },
  {
    title: "Unsupervised identification of crime problems from police free-text data",
    authors: "Birks et al.",
    year: "2020",
    feeds: "Prototype — missingness",
    summary: "Narrative FIRs are incomplete. Encoded as IFS hesitancy π rather than dropped rows. Rare vernacular tokens (desi katta, nakabjani) enter blocking, not a neural encoder.",
  },
  {
    title: "The feasibility of using crime scene behaviour to detect versatile serial offenders",
    authors: "Tonkin & Woodhams",
    year: "2017",
    feeds: "Prototype — consistency across crime types; scored, not blocked",
    summary: "Empirical test that versatile serial offenders still leave a usable behavioural signature. ANVAYA scores family transitions rather than blocking them — four planted burglary→CAW series are the test TRIVENI’s family block would drop.",
  },
  {
    title: "Tonkin, Woodhams, Bull, Bond & Palmer (2011)",
    authors: "Tonkin et al.",
    year: "2011",
    feeds: "Family — inter-crime distance and cross-crime transitions",
    summary: "Foundational crime-linkage distances (geo, temporal, MO) and the case for linking across crime types. ANVAYA scores P(family_q | family_last) instead of blocking on statute family.",
  },
  {
    title: "Criminal networks and spatial density",
    authors: "Oatley et al.",
    year: "2005",
    feeds: "Geo — corridors",
    summary: "Offending density follows network structure. ANVAYA’s corridor-aware centroid is the India analogue; the join itself is prototype + dark-dilated time.",
  },
  {
    title: "Design and Analysis of Machine Learning Algorithms (crime applications)",
    authors: "Alghamdi & AlDalain",
    year: "2024",
    feeds: "Baselines",
    summary: "Reference for why ANVAYA reports Hit@1, Hit@3 and MRR on series assignment rather than pairwise accuracy.",
  },
  {
    title: "Spatio temporal crime analysis",
    authors: "Bandekar & Vijayalakshmi",
    year: "2020",
    feeds: "Context — Indian ST analysis",
    summary: "Indian city-scale ST crime analysis. Grounds the choice of district as the forecasting unit rather than a Chicago-style grid.",
  },
];
