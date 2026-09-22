import { STATE_BY_CODE } from "@/lib/data/states";
import { DISTRICT_SEEDS } from "@/lib/data/districts";
import {
  covidDip,
  monthFestivalIntensity,
  monsoonFactor,
  summerStreetFactor,
} from "@/lib/data/calendar";
import { haversineKm } from "@/lib/geo/project";
import type {
  CaseRecord,
  Cell,
  CrimeKind,
  District,
  MoFeature,
  MoKey,
  MonthKey,
  Typology,
  Universe,
} from "./types";
import { CRIME_KINDS, MO_KEYS, MO_VALUES, statuteFor } from "./types";
import { encodeFeature } from "./ifs";
import { jitter, mulberry32, pick, poisson, randInt, type Rng } from "./rng";

const START_YEAR = 2020;
const END_YEAR = 2025;

function buildMonths(): MonthKey[] {
  const out: MonthKey[] = [];
  let index = 0;
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    for (let month = 1; month <= 12; month++) {
      out.push({ year, month, index });
      index += 1;
    }
  }
  return out;
}

function buildDistricts(): District[] {
  return DISTRICT_SEEDS.map((d) => {
    const st = STATE_BY_CODE[d.state];
    if (!st) throw new Error(`Unknown state ${d.state}`);
    const femaleShare = st.sexRatio / (1000 + st.sexRatio);
    return {
      ...d,
      stateName: st.name,
      zone: st.zone,
      femalePopLakh: d.popLakh * femaleShare,
    };
  });
}

function knnGraph(districts: District[], k = 6): number[][] {
  return districts.map((d, i) =>
    districts
      .map((o, j) => ({ j, km: i === j ? Infinity : haversineKm(d.lat, d.lng, o.lat, o.lng) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, k)
      .map((x) => x.j),
  );
}

function expectedRate(kind: CrimeKind, stateCode: string): number {
  const st = STATE_BY_CODE[stateCode]!;
  switch (kind) {
    case "caw":
      return st.cawRate2022 / 12;
    case "rape":
      return (st.cawRate2022 * 0.07) / 12;
    case "murder":
      return st.murderRate2022 / 12;
    case "cyber":
      return st.cyberRate2022 / 12;
    case "kidnapping":
      return (st.cawRate2022 * 0.18) / 12;
    case "burglary":
      return (st.violentRate2022 * 0.35 + 8) / 12;
    case "theft":
      return (st.violentRate2022 * 0.8 + 18) / 12;
    default:
      return 1;
  }
}

function encodeMo(values: Record<MoKey, string | null>): MoFeature[] {
  return MO_KEYS.map((key) => ({
    key,
    value: values[key],
    ifs: encodeFeature(values[key]),
  }));
}

function randomMo(rng: Rng, kind: CrimeKind, unknownRate: number): Record<MoKey, string | null> {
  const out = {} as Record<MoKey, string | null>;
  for (const key of MO_KEYS) {
    if (rng() < unknownRate) {
      out[key] = null;
      continue;
    }
    let pool = MO_VALUES[key];
    if (kind === "cyber" && (key === "entry" || key === "weapon" || key === "binding")) {
      out[key] = "none";
      continue;
    }
    if (kind === "rape" && key === "relation") {
      pool = rng() < 0.55 ? ["known", "intimate", "family"] : ["stranger"];
    }
    if (kind === "caw" && key === "relation") {
      pool = rng() < 0.62 ? ["intimate", "family"] : ["known", "stranger"];
    }
    out[key] = pick(rng, pool);
  }
  return out;
}

function jitterMo(rng: Rng, base: Record<MoKey, string | null>, pFlip: number): Record<MoKey, string | null> {
  const out = { ...base };
  for (const key of MO_KEYS) {
    if (rng() < 0.18) {
      out[key] = null;
      continue;
    }
    if (out[key] && rng() < pFlip) out[key] = pick(rng, MO_VALUES[key]);
  }
  return out;
}

/** Vernacular FIR tokens — Codex multilingual lexicon, used as traces not embeddings. */
function narrative(
  rng: Rng,
  kind: CrimeKind,
  feat: Record<MoKey, string | null>,
  district: string,
  statute: string,
): string {
  const bits: string[] = [`PS ${district}`, statute, kind];
  if (feat.weapon === "firearm") bits.push(rng() < 0.5 ? "desi katta" : "tamancha");
  if (feat.weapon === "acid") bits.push(rng() < 0.5 ? "tejab" : "acid vial");
  if (feat.disguise === "mask") bits.push("nakabjani");
  if (feat.entry === "climb") bits.push("diwar faand kar");
  if (feat.entry === "door-force") bits.push("taala tod kar");
  if (feat.transport === "motorcycle") bits.push(rng() < 0.5 ? "pulsar bike" : "two-wheeler");
  if (feat.approach === "known-lure") bits.push("reiki ke baad");
  if (feat.location) bits.push(feat.location);
  if (feat.timeBand) bits.push(feat.timeBand);
  return bits.join(" · ");
}

function makeCase(
  id: string,
  d: District,
  kind: CrimeKind,
  year: number,
  month: number,
  day: number,
  lat: number,
  lng: number,
  feat: Record<MoKey, string | null>,
  seriesId: string | null,
  typology: Typology | null,
  rng: Rng,
): CaseRecord {
  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const statute = statuteFor(kind, date);
  return {
    id,
    districtId: d.id,
    kind,
    year,
    month,
    day,
    date,
    lat,
    lng,
    features: encodeMo(feat),
    seriesId,
    urban: d.urban > 40,
    narrative: narrative(rng, kind, feat, d.name, statute),
    statute,
    typology,
  };
}

export function generateUniverse(seed = 2026): Universe {
  const rng = mulberry32(seed);
  const months = buildMonths();
  const districts = buildDistricts();
  const neighbors = knnGraph(districts);
  const cells: Cell[] = [];

  for (const d of districts) {
    for (const m of months) {
      const fest = monthFestivalIntensity(m.year, m.month);
      const mon = monsoonFactor(m.month);
      const summer = summerStreetFactor(m.month);
      const covid = covidDip(m.year, m.month);
      const yearDrift = 1 + (m.year - 2022) * 0.03;
      const counts = {} as Record<CrimeKind, number>;
      const expected = {} as Record<CrimeKind, number>;
      for (const kind of CRIME_KINDS) {
        const pop =
          kind === "caw" || kind === "rape" || kind === "kidnapping"
            ? d.femalePopLakh
            : d.popLakh;
        const rate = expectedRate(kind, d.state);
        let expo = pop * rate * yearDrift * covid;
        expo *= 0.75 + 0.5 * (d.urban / 100);
        if (kind === "caw" || kind === "rape") {
          expo *= fest * (0.7 + 0.3 * mon) * summer;
        } else if (kind === "burglary" || kind === "theft") {
          expo *= fest * (2 - mon) * 0.7;
        } else if (kind === "cyber") {
          expo *= 1 + d.urban / 120;
        }
        let lam = expo * d.riskBias;
        if (kind === "caw" || kind === "rape") {
          lam *= 1 + (950 - d.sexRatio) / 900;
          lam *= 1 + Math.min(d.density, 8000) / 25000;
        }
        if (kind === "cyber" && (d.state === "TG" || d.state === "KA")) lam *= 1.8;
        lam *= 0.85 + rng() * 0.3;
        expected[kind] = Math.max(0.05, expo);
        counts[kind] = poisson(rng, Math.max(0.05, lam));
      }
      cells.push({
        districtId: d.id,
        monthIndex: m.index,
        counts,
        expected,
        festivalBoost: fest,
        monsoon: mon,
      });
    }
  }

  const cases: CaseRecord[] = [];
  const series: Universe["series"] = [];
  const recent = cells.filter((c) => months[c.monthIndex]!.year >= 2023);
  let caseSeq = 0;
  for (const cell of recent) {
    const d = districts.find((x) => x.id === cell.districtId)!;
    const m = months[cell.monthIndex]!;
    const kindsToSample: CrimeKind[] = ["caw", "rape", "burglary", "theft"];
    for (const kind of kindsToSample) {
      const take = cell.counts[kind] > 0 && rng() < (d.riskBias > 1.2 ? 0.55 : 0.28) ? 1 : 0;
      if (take === 0) continue;
      const unknownRate = 0.12 + (STATE_BY_CODE[d.state]!.darkFigure - 1.3) * 0.08;
      const day = randInt(rng, 1, 28);
      const feat = randomMo(rng, kind, unknownRate);
      cases.push(
        makeCase(
          `C${String(++caseSeq).padStart(4, "0")}`,
          d,
          kind,
          m.year,
          m.month,
          day,
          jitter(rng, d.lat, 0.12),
          jitter(rng, d.lng, 0.12),
          feat,
          null,
          null,
          rng,
        ),
      );
    }
  }

  const serialHosts = districts.filter((d) => d.riskBias >= 1.15 && d.urban > 30);
  const types: Typology[] = ["forager", "marauder", "commuter"];
  for (let s = 0; s < 18; s++) {
    const host = serialHosts[s % serialHosts.length]!;
    const kind = pick(rng, ["caw", "rape", "burglary"] as CrimeKind[]);
    const typology = types[s % 3]!;
    const baseMo = randomMo(rng, kind, 0.05);
    const len = randInt(rng, 4, 7);
    const id = `S${String(s + 1).padStart(2, "0")}`;
    const startMonth = randInt(rng, 36, 62);
    const caseIds: string[] = [];
    let lat = host.lat;
    let lng = host.lng;
    const step =
      typology === "forager" ? 0.025 : typology === "marauder" ? 0.07 : 0.18;
    const dark = STATE_BY_CODE[host.state]!.darkFigure;
    for (let k = 0; k < len; k++) {
      const mi = Math.min(
        months.length - 1,
        startMonth + Math.floor(k * (0.55 + 0.55 * dark) * (0.7 + rng() * 0.9)),
      );
      const m = months[mi]!;
      const day = randInt(rng, 1, 28);
      if (typology === "commuter") {
        lng = jitter(rng, lng, step);
        lat = jitter(rng, lat, step * 0.35);
      } else {
        lat = jitter(rng, lat, step);
        lng = jitter(rng, lng, step);
      }
      const idc = `C${String(++caseSeq).padStart(4, "0")}`;
      cases.push(
        makeCase(
          idc,
          host,
          kind,
          m.year,
          m.month,
          day,
          lat,
          lng,
          jitterMo(rng, baseMo, typology === "forager" ? 0.08 : 0.14),
          id,
          typology,
          rng,
        ),
      );
      caseIds.push(idc);
    }
    series.push({ id, caseIds, kind, typology, versatile: false });
  }

  for (let s = 0; s < 4; s++) {
    const host = serialHosts[(s + 7) % serialHosts.length]!;
    const typology: Typology = s % 2 === 0 ? "marauder" : "commuter";
    const dark = STATE_BY_CODE[host.state]!.darkFigure;
    const startKind: CrimeKind = "burglary";
    const laterKind: CrimeKind = pick(rng, ["caw", "rape"]);
    const baseMo = randomMo(rng, startKind, 0.05);
    const len = randInt(rng, 5, 7);
    const id = `S${String(19 + s).padStart(2, "0")}`;
    const startMonth = randInt(rng, 36, 58);
    const caseIds: string[] = [];
    let lat = host.lat;
    let lng = host.lng;
    const step = typology === "commuter" ? 0.16 : 0.07;
    for (let k = 0; k < len; k++) {
      const kindNow: CrimeKind = k < 2 ? startKind : laterKind;
      const mi = Math.min(
        months.length - 1,
        startMonth + Math.floor(k * (0.7 + 0.5 * dark)),
      );
      const m = months[mi]!;
      const feat = jitterMo(rng, baseMo, 0.1);
      if (kindNow !== startKind) {
        feat.entry = rng() < 0.5 ? feat.entry : "none";
        feat.theft = rng() < 0.4 ? "none" : feat.theft;
      }
      if (typology === "commuter") {
        lng = jitter(rng, lng, step);
        lat = jitter(rng, lat, step * 0.4);
      } else {
        lat = jitter(rng, lat, step);
        lng = jitter(rng, lng, step);
      }
      const idc = `C${String(++caseSeq).padStart(4, "0")}`;
      cases.push(
        makeCase(
          idc,
          host,
          kindNow,
          m.year,
          m.month,
          randInt(rng, 1, 28),
          lat,
          lng,
          feat,
          id,
          typology,
          rng,
        ),
      );
      caseIds.push(idc);
    }
    series.push({ id, caseIds, kind: startKind, typology, versatile: true });
  }

  return { seed, months, districts, neighbors, cells, cases, series };
}

let cached: Universe | null = null;
let cachedGen = 0;
const GEN = 3;

export function getUniverse(seed = 2026): Universe {
  if (cached && cached.seed === seed && cachedGen === GEN) return cached;
  cached = generateUniverse(seed);
  cachedGen = GEN;
  return cached;
}

export function resetUniverse(): void {
  cached = null;
}
