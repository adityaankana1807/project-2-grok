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
    feeds: "Riti — IFS linkage under FIR uncertainty",
    summary:
      "Membership, non-membership and hesitancy for incomplete crime-scene evidence. Fixes Chen/Ye/Hong–Kim failures on hesitancy and signed differences. Applied to crime linkage clustering and psychological profiling. TRIVENI reads π as missingness and sends hollow FIRs to LR = 1.",
  },
  {
    title: "Building the statistical evidence base for crime linkage decision-support tools with sexual offences",
    authors: "Tonkin, Lemeire, Woodhams et al.",
    year: "2025",
    feeds: "Riti — behavioural similarity beyond Jaccard; ranking metrics",
    summary:
      "10,918 UK stranger sexual offences, 35 algorithms. A new behavioural similarity metric beat Jaccard (AUC 0.95). Four-quartiles ranking: 95% of linked pairs in the top 100. Collapsing MO variables did not help. TRIVENI uses the metric as a distinctiveness LR, not as a transferred probability.",
  },
  {
    title: "Spatiotemporal-textual point processes for crime linkage detection",
    authors: "Zhu & Xie",
    year: "2022",
    feeds: "Kaal / copula — space–time dependence",
    summary:
      "Joint space–time–text intensity for linking events without DNA. TRIVENI keeps the geo-temporal kernel, replaces text with IFS-encoded MO, and puts a copula on space×time so Hawkes near-repeats are not counted twice.",
  },
  {
    title: "All burglaries are not the same: predicting near-repeat burglaries using modus operandi",
    authors: "Borg & Svensson",
    year: "2022",
    feeds: "Desh / Kaal — near-repeat vs same-offender",
    summary:
      "Near-repeat burglaries are stylized and city-specific. MO (entry, target, goods, traces) predicts whether a scene belongs to a repeat chain (F1 ≈ 0.82). Distinct from same-offender labels — TRIVENI’s copula is the explicit correction.",
  },
  {
    title: "Linking foraging domestic burglary: crimes committed within police-identified optimal forager patches",
    authors: "Halford",
    year: "2023",
    feeds: "Mixture — forager / marauder / commuter kernels",
    summary:
      "Offenders forage locally after a successful strike. ST-SAGE planted marauder-only jitter; TRIVENI plants all three typologies and mixes kernels inside Λ.",
  },
  {
    title: "A descriptive analysis of the temporal and geographical proximities seen within UK series of sex offences",
    authors: "Woodhams et al.",
    year: "2021",
    feeds: "Desh / Kaal — spatial and temporal length-scales",
    summary:
      "Serial sexual offences cluster more tightly in time and space than chance. Calibrates marauder d0 (12 km urban / 35 km rural) and τ0; forager and commuter scales are India-specific additions.",
  },
  {
    title: "A test of case linkage principles with solved and unsolved serial rapes",
    authors: "Woodhams & Labuschagne",
    year: "2012",
    feeds: "Riti — consistency and distinctiveness",
    summary:
      "Behavioural consistency and distinctiveness hold for both solved and unsolved series — the statistical warrant for linking without DNA.",
  },
  {
    title: "Hybrid ST-ResNet and LSTM approach for precise crime hotspot prediction",
    authors: "Shahmoradi, Alesheikh, Jafari & Lotfata",
    year: "2025",
    feeds: "Forecast — ST-lite cousin",
    summary:
      "ST-ResNet plus LSTM with calendar and proximity features. Hit rate > 88% at 500 m in Chicago. TRIVENI uses a closed-form ST-lite (lags, neighbours, festival, monsoon) that runs in the browser.",
  },
  {
    title: "Deep learning for crime forecasting: the role of mobility at fine-grained spatiotemporal scales",
    authors: "Albors-Zumel et al.",
    year: "2025",
    feeds: "Patch — ambient population",
    summary:
      "Ambient (not just resident) population drives urban risk. TRIVENI proxies this with urbanisation and festival crowding.",
  },
  {
    title: "Crime prediction with graph neural networks and multivariate normal distributions",
    authors: "Tekin & Kozat",
    year: "2022",
    feeds: "Patch — neighbour graph",
    summary:
      "Districts as a spatial graph. TRIVENI’s CAR smoother is a linear GNN layer on k-nearest districts.",
  },
  {
    title: "Urban theft prediction via LLM-empowered spatiotemporal transformer",
    authors: "Tang et al.",
    year: "2026",
    feeds: "Compared, not copied",
    summary:
      "Heavy transformer stack. TRIVENI deliberately stays closed-form and inspectable for investigative use.",
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
    summary: "Event-level prediction framing used for TRIVENI’s next-month district forecasts.",
  },
  {
    title: "Spatio-temporal Crime Analysis and Forecasting on Twitter Data Using Machine Learning Algorithms",
    authors: "Vivek & Prathap",
    year: "2023",
    feeds: "Not used operationally",
    summary: "Social-media nowcasting. Kept as literature context; TRIVENI does not scrape Twitter.",
  },
  {
    title: "Unsupervised identification of crime problems from police free-text data",
    authors: "Birks et al.",
    year: "2020",
    feeds: "Riti — missingness / hesitancy; rarity tokens",
    summary: "Narrative FIRs are incomplete. Encoded as IFS hesitancy π rather than dropped rows. Rare vernacular tokens (desi katta, nakabjani) enter blocking, not a neural encoder.",
  },
  {
    title: "The feasibility of using crime scene behaviour to detect versatile serial offenders",
    authors: "Tonkin & Woodhams",
    year: "2017",
    feeds: "Riti — assumptions; cross-crime family",
    summary: "Empirical test that versatile serial offenders still leave a usable behavioural signature. Warrants IPC/BNS family blocking.",
  },
  {
    title: "Tonkin, Woodhams, Bull, Bond & Palmer (2011)",
    authors: "Tonkin et al.",
    year: "2011",
    feeds: "Blocking — inter-crime distance and cross-crime",
    summary: "Foundational crime-linkage distances (geo, temporal, MO) and the case for linking across crime types. TRIVENI blocks on statute family, not on identical heads.",
  },
  {
    title: "Criminal networks and spatial density",
    authors: "Oatley et al.",
    year: "2005",
    feeds: "Desh — NH/SH corridors",
    summary: "Offending density follows network structure. TRIVENI’s corridor boost is the India analogue of that network.",
  },
  {
    title: "Design and Analysis of Machine Learning Algorithms (crime applications)",
    authors: "Alghamdi & AlDalain",
    year: "2024",
    feeds: "Baselines",
    summary: "Reference for why TRIVENI reports AUC, AUPRC, Recall@10 and MRR rather than accuracy.",
  },
  {
    title: "Spatio temporal crime analysis",
    authors: "Bandekar & Vijayalakshmi",
    year: "2020",
    feeds: "Context — Indian ST analysis",
    summary: "Indian city-scale ST crime analysis. Grounds the choice of district as the forecasting unit rather than a Chicago-style grid.",
  },
];
