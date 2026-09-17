export type Zone =
  | "Northern"
  | "North Eastern"
  | "Central"
  | "Eastern"
  | "Western"
  | "Southern";

export type CrimeKind =
  | "caw"
  | "rape"
  | "burglary"
  | "theft"
  | "murder"
  | "cyber"
  | "kidnapping";

export const CRIME_LABEL: Record<CrimeKind, string> = {
  caw: "Crime against women",
  rape: "Rape",
  burglary: "Burglary",
  theft: "Theft",
  murder: "Murder",
  cyber: "Cybercrime",
  kidnapping: "Kidnapping",
};

export const CRIME_KINDS: CrimeKind[] = [
  "caw",
  "rape",
  "burglary",
  "theft",
  "murder",
  "cyber",
  "kidnapping",
];

export type MoKey =
  | "approach"
  | "location"
  | "timeBand"
  | "weapon"
  | "relation"
  | "entry"
  | "binding"
  | "theft"
  | "transport"
  | "verbal"
  | "disguise";

export const MO_KEYS: MoKey[] = [
  "approach",
  "location",
  "timeBand",
  "weapon",
  "relation",
  "entry",
  "binding",
  "theft",
  "transport",
  "verbal",
  "disguise",
];

export const MO_LABEL: Record<MoKey, string> = {
  approach: "Approach",
  location: "Scene",
  timeBand: "Time band",
  weapon: "Weapon",
  relation: "Victim relation",
  entry: "Entry",
  binding: "Restraint",
  theft: "Property taken",
  transport: "Transport",
  verbal: "Verbal theme",
  disguise: "Disguise",
};

export const MO_VALUES: Record<MoKey, string[]> = {
  approach: ["blitz", "con", "surprise", "known-lure"],
  location: ["residence", "public", "transport", "workplace", "isolated"],
  timeBand: ["dawn", "day", "evening", "night"],
  weapon: ["none", "knife", "blunt", "firearm", "acid"],
  relation: ["stranger", "known", "intimate", "family"],
  entry: ["none", "window", "door-force", "unlocked", "climb"],
  binding: ["none", "cloth", "rope"],
  theft: ["none", "cash", "jewellery", "phone"],
  transport: ["foot", "motorcycle", "car", "auto"],
  verbal: ["silence", "threat", "apology"],
  disguise: ["none", "mask", "helmet"],
};

/** Intuitionistic fuzzy triple: membership, non-membership, hesitancy. */
export type IfsTriple = { mu: number; nu: number; pi: number };

export type MoFeature = {
  key: MoKey;
  value: string | null;
  ifs: IfsTriple;
};

export type StateRecord = {
  code: string;
  name: string;
  zone: Zone;
  femalePopLakh2022: number;
  popLakh2022: number;
  caw2022: number;
  caw2023: number;
  cawRate2022: number;
  murderRate2022: number;
  cyberRate2022: number;
  violentRate2022: number;
  sexRatio: number;
  femaleLiteracy: number;
  urbanPct: number;
  darkFigure: number;
};

export type DistrictSeed = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  popLakh: number;
  sexRatio: number;
  femLit: number;
  density: number;
  urban: number;
  /** Relative intensity vs state mean — from SAE hotspot literature. */
  riskBias: number;
};

export type District = DistrictSeed & {
  stateName: string;
  zone: Zone;
  femalePopLakh: number;
};

export type MonthKey = { year: number; month: number; index: number };

export type Cell = {
  districtId: string;
  monthIndex: number;
  counts: Record<CrimeKind, number>;
  expected: Record<CrimeKind, number>;
  festivalBoost: number;
  monsoon: number;
};

export type CaseRecord = {
  id: string;
  districtId: string;
  kind: CrimeKind;
  year: number;
  month: number;
  day: number;
  date: string;
  lat: number;
  lng: number;
  features: MoFeature[];
  seriesId: string | null;
  urban: boolean;
};

export type DistrictRisk = {
  districtId: string;
  kind: CrimeKind;
  observed: number;
  expected: number;
  sir: number;
  rr: number;
  rrDark: number;
  band: "high" | "mid" | "low";
  persistence: number;
  nearRepeat: number;
};

export type ScanCluster = {
  id: string;
  kind: CrimeKind;
  centerId: string;
  districtIds: string[];
  radiusKm: number;
  startMonth: number;
  endMonth: number;
  llr: number;
  observed: number;
  expected: number;
  primary: boolean;
};

export type LinkScore = {
  a: string;
  b: string;
  geo: number;
  time: number;
  ifs: number;
  jaccard: number;
  risk: number;
  forager: number;
  festival: number;
  indra: number;
  linked: boolean;
};

export type PairBreakdown = LinkScore & {
  caseA: CaseRecord;
  caseB: CaseRecord;
};

export type ForecastPoint = {
  districtId: string;
  monthIndex: number;
  kind: CrimeKind;
  predicted: number;
  actual: number | null;
};

export type EvalMetrics = {
  linkage: {
    indraAuc: number;
    jaccardAuc: number;
    ifsAuc: number;
    geoAuc: number;
    indraAuprc: number;
    jaccardAuprc: number;
    top100Indra: number;
    top100Jaccard: number;
    medianFirstRankIndra: number;
    medianFirstRankJaccard: number;
    nLinked: number;
    nUnlinked: number;
  };
  forecast: {
    mae: number;
    hitRate: number;
    naiveMae: number;
  };
  risk: {
    moran: number;
    highCount: number;
    hotspotShare: number;
  };
};

export type Universe = {
  seed: number;
  months: MonthKey[];
  districts: District[];
  neighbors: number[][];
  cells: Cell[];
  cases: CaseRecord[];
  series: { id: string; caseIds: string[]; kind: CrimeKind }[];
};

export type IndraModel = {
  universe: Universe;
  risks: DistrictRisk[];
  clusters: ScanCluster[];
  forecast: ForecastPoint[];
  metrics: EvalMetrics;
};
