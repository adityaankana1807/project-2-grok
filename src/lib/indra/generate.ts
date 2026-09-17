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
  Universe,
} from "./types";
import { CRIME_KINDS, MO_KEYS, MO_VALUES } from "./types";
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
        // Offset (SAE expected): population × state rate × calendar/exposure.
        // District residual (riskBias, sex ratio, density) stays in λ so RR
        // isolates the hotspot structure instead of lighting up every cell.
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
      cases.push({
        id: `C${String(++caseSeq).padStart(4, "0")}`,
        districtId: d.id,
        kind,
        year: m.year,
        month: m.month,
        day,
        date: `${m.year}-${String(m.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        lat: jitter(rng, d.lat, 0.12),
        lng: jitter(rng, d.lng, 0.12),
        features: encodeMo(feat),
        seriesId: null,
        urban: d.urban > 40,
      });
    }
  }

  const serialHosts = districts.filter((d) => d.riskBias >= 1.15 && d.urban > 30);
  for (let s = 0; s < 16; s++) {
    const host = serialHosts[s % serialHosts.length]!;
    const kind = pick(rng, ["caw", "rape", "burglary"] as CrimeKind[]);
    const baseMo = randomMo(rng, kind, 0.05);
    const len = randInt(rng, 4, 7);
    const id = `S${String(s + 1).padStart(2, "0")}`;
    const startMonth = randInt(rng, 36, 62);
    const caseIds: string[] = [];
    let lat = host.lat;
    let lng = host.lng;
    for (let k = 0; k < len; k++) {
      const mi = Math.min(months.length - 1, startMonth + Math.floor(k * (rng() * 1.4)));
      const m = months[mi]!;
      const day = randInt(rng, 1, 28);
      lat = jitter(rng, lat, host.urban > 60 ? 0.04 : 0.08);
      lng = jitter(rng, lng, host.urban > 60 ? 0.04 : 0.08);
      const idc = `C${String(++caseSeq).padStart(4, "0")}`;
      cases.push({
        id: idc,
        districtId: host.id,
        kind,
        year: m.year,
        month: m.month,
        day,
        date: `${m.year}-${String(m.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        lat,
        lng,
        features: encodeMo(jitterMo(rng, baseMo, 0.12)),
        seriesId: id,
        urban: host.urban > 40,
      });
      caseIds.push(idc);
    }
    series.push({ id, caseIds, kind });
  }

  return { seed, months, districts, neighbors, cells, cases, series };
}

let cached: Universe | null = null;

export function getUniverse(seed = 2026): Universe {
  if (cached && cached.seed === seed) return cached;
  cached = generateUniverse(seed);
  return cached;
}

export function resetUniverse(): void {
  cached = null;
}
