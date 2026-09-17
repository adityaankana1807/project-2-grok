import { festivalBoostForDate } from "@/lib/data/calendar";
import { haversineKm } from "@/lib/geo/project";
import type { CaseRecord, DistrictRisk, LinkScore, Universe } from "./types";
import { indraIfsScore, jaccardMo } from "./ifs";

const W = {
  geo: 0.26,
  time: 0.16,
  ifs: 0.34,
  risk: 0.12,
  forager: 0.12,
};

/**
 * Stage 4+5 — INDRA nested linkage score.
 *
 * L(i,j) = w_g S_geo + w_t S_time · festMod + w_m S_IFS + w_r S_risk + w_f S_forager
 *
 * S_geo  = exp(−d / d0), d0 = 12 km urban / 35 km rural (UK series proximity, retuned)
 * S_time = exp(−Δt / τ), τ = 10 days, ×1.55 if both fall in the same Indian festival
 * S_IFS  = Dutta–Banik-style generalised IFS similarity (hesitancy-aware)
 * S_risk = shared SAE risk band (serials concentrate in high-RR patches)
 * S_forager = near-repeat kernel (boost + forager papers)
 */
export function scorePair(
  a: CaseRecord,
  b: CaseRecord,
  risks: DistrictRisk[],
): LinkScore {
  if (a.id === b.id) {
    return {
      a: a.id, b: b.id, geo: 1, time: 1, ifs: 1, jaccard: 1, risk: 1, forager: 1, festival: 1, indra: 1,
      linked: a.seriesId !== null && a.seriesId === b.seriesId,
    };
  }

  const d = haversineKm(a.lat, a.lng, b.lat, b.lng);
  const d0 = a.urban || b.urban ? 12 : 35;
  const geo = Math.exp(-d / d0);

  const da = Date.parse(a.date);
  const db = Date.parse(b.date);
  const days = Math.abs(da - db) / 86400000;
  let tau = 10;
  const fa = festivalBoostForDate(a.date);
  const fb = festivalBoostForDate(b.date);
  const festival = fa && fb && fa.name === fb.name ? 1.55 : 1;
  tau *= festival;
  const time = Math.exp(-days / tau);

  const ifs = indraIfsScore(a.features, b.features);
  const jaccard = jaccardMo(a.features, b.features);

  const ra = risks.find((r) => r.districtId === a.districtId)?.rr ?? 1;
  const rb = risks.find((r) => r.districtId === b.districtId)?.rr ?? 1;
  const risk = Math.exp(-Math.abs(Math.log(Math.max(ra, 0.05)) - Math.log(Math.max(rb, 0.05))));

  const forager = foragerKernel(a, b);

  const indra =
    W.geo * geo +
    W.time * time +
    W.ifs * ifs +
    W.risk * risk +
    W.forager * forager;

  return {
    a: a.id,
    b: b.id,
    geo,
    time,
    ifs,
    jaccard,
    risk,
    forager,
    festival,
    indra,
    linked: a.seriesId !== null && a.seriesId === b.seriesId && a.seriesId === b.seriesId,
  };
}

function foragerKernel(a: CaseRecord, b: CaseRecord): number {
  const d = haversineKm(a.lat, a.lng, b.lat, b.lng);
  const days = Math.abs(Date.parse(a.date) - Date.parse(b.date)) / 86400000;
  const spatial = d < 4 ? Math.exp(-d / 1.6) : Math.exp(-d / 18);
  const temporal = days < 21 ? Math.exp(-days / 8) : Math.exp(-days / 40);
  const corridor = Math.abs(a.lng - b.lng) < 0.35 || Math.abs(a.lat - b.lat) < 0.25 ? 1.12 : 1;
  return Math.min(1, spatial * temporal * corridor);
}

export function rankAgainst(
  target: CaseRecord,
  universe: Universe,
  risks: DistrictRisk[],
): LinkScore[] {
  const scores = universe.cases
    .filter((c) => c.id !== target.id && c.kind === target.kind)
    .map((c) => scorePair(target, c, risks));
  scores.sort((a, b) => b.indra - a.indra);
  return scores;
}

export function sampleEvaluationPairs(universe: Universe, risks: DistrictRisk[]): LinkScore[] {
  const bySeries = new Map<string, CaseRecord[]>();
  for (const c of universe.cases) {
    if (!c.seriesId) continue;
    const list = bySeries.get(c.seriesId) ?? [];
    list.push(c);
    bySeries.set(c.seriesId, list);
  }
  const linked: LinkScore[] = [];
  for (const group of bySeries.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
      linked.push(scorePair(group[i]!, group[j]!, risks));
      }
    }
  }
  const unlinked: LinkScore[] = [];
  const pool = universe.cases;
  const rngSeed = 7;
  let s = rngSeed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const targetU = Math.min(900, linked.length * 12);
  let guard = 0;
  while (unlinked.length < targetU && guard < targetU * 8) {
    guard += 1;
    const i = Math.floor(rnd() * pool.length);
    const j = Math.floor(rnd() * pool.length);
    if (i === j) continue;
    const a = pool[i]!;
    const b = pool[j]!;
    if (a.seriesId && a.seriesId === b.seriesId) continue;
    unlinked.push(scorePair(a, b, risks));
  }
  return [...linked, ...unlinked];
}
