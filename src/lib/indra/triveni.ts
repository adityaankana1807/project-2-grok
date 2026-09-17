import { festivalBoostForDate } from "@/lib/data/calendar";
import { haversineKm } from "@/lib/geo/project";
import type {
  CaseRecord,
  CrimeKind,
  DistrictRisk,
  LinkScore,
  ScanCluster,
  Typology,
  Universe,
} from "./types";
import { crimeCompatible } from "./types";
import { indraIfsScore, jaccardMo, tonkin2025 } from "./ifs";

/**
 * TRIVENI — Three-stream Rarity-weighted Indian Evidence Nested Inference.
 *
 * Unlike INDRA (linear blend), I-HSTMO (logistic on similarities) and ST-SAGE
 * (Tonkin+geo+time logistic), TRIVENI scores a pair as a forensic likelihood
 * ratio, mixed over Halford-style offender typologies:
 *
 *   Λ = Σ_τ π(τ | d) · (Λ_desh(τ) Λ_kaal(τ) Λ_riti Λ_patch) / D(Λ_desh, Λ_kaal)
 *
 * D is a saturating space–time dependence penalty so near-repeat Hawkes
 * excitation is not counted twice (Zhu & Xie 2022; Borg & Svensson 2022).
 *
 * Λ_riti fuses Dutta–Banik IFS (hesitancy π = FIR missingness) with the
 * Tonkin 2025 rarity metric log(1+3+3a−(b+c)). Low coverage → LR → 1.
 */

const BG_SPACE = 120;
const BG_TIME = 90;

function typologyMix(
  dKm: number,
  urban: boolean,
  corridor: boolean,
): Record<Typology, number> {
  const f = Math.exp(-dKm / 2.4);
  const m = Math.exp(-dKm / (urban ? 14 : 36));
  const c = Math.exp(-dKm / (corridor ? 48 : 95)) * (corridor ? 1.35 : 0.55);
  const s = f + m + c + 1e-9;
  return { forager: f / s, marauder: m / s, commuter: c / s };
}

function lrExp(x: number, scaleL: number, scaleU: number): number {
  const pL = Math.exp(-x / scaleL) / Math.max(scaleL, 1e-6);
  const pU = Math.exp(-x / scaleU) / Math.max(scaleU, 1e-6);
  return Math.max(1e-3, Math.min(400, pL / pU));
}

function d0(type: Typology, urban: boolean, corridor: boolean): number {
  if (type === "forager") return 1.8;
  if (type === "marauder") return urban ? 12 : 35;
  return corridor ? 52 : 88;
}

function tau0(type: Typology, festival: boolean): number {
  const base = type === "forager" ? 8 : type === "marauder" ? 14 : 24;
  return festival ? base * 1.55 : base;
}

function lrRiti(a: CaseRecord, b: CaseRecord): { lr: number; ifs: number; jaccard: number; coverage: number } {
  const ifs = indraIfsScore(a.features, b.features);
  const jaccard = jaccardMo(a.features, b.features);
  const tonkin = tonkin2025(a.features, b.features);
  let observed = 0;
  let joint = 0;
  for (let i = 0; i < a.features.length; i++) {
    const va = a.features[i]?.value ?? null;
    const vb = b.features[i]?.value ?? null;
    if (va === null && vb === null) continue;
    observed += 1;
    if (va !== null && vb !== null) joint += 1;
  }
  const coverage = observed === 0 ? 0 : joint / observed;
  const consist = Math.exp(2.1 * (ifs - 0.5));
  const distinct = Math.exp(0.85 * (tonkin - 1.4) * coverage);
  const lr = Math.max(0.05, Math.min(80, consist * distinct * (0.35 + 0.65 * coverage) + (1 - coverage)));
  return { lr, ifs, jaccard, coverage };
}

function lrPatch(a: CaseRecord, b: CaseRecord, risks: DistrictRisk[], clusters: ScanCluster[]): number {
  const ra = risks.find((r) => r.districtId === a.districtId)?.rr ?? 1;
  const rb = risks.find((r) => r.districtId === b.districtId)?.rr ?? 1;
  const conc = Math.exp(-Math.abs(Math.log(Math.max(ra, 0.05)) - Math.log(Math.max(rb, 0.05))));
  const same = clusters.some(
    (c) => c.districtIds.includes(a.districtId) && c.districtIds.includes(b.districtId),
  );
  return (same ? 2.15 : 1) * (0.55 + 0.7 * conc);
}

function copula(desh: number, kaal: number): number {
  const u = (desh / (1 + desh)) * (kaal / (1 + kaal));
  return 1 + 0.42 * u;
}

export function scorePair(
  a: CaseRecord,
  b: CaseRecord,
  risks: DistrictRisk[],
  clusters: ScanCluster[] = [],
): LinkScore {
  if (a.id === b.id) {
    return blankScore(a, b, true);
  }

  const d = haversineKm(a.lat, a.lng, b.lat, b.lng);
  const days = Math.abs(Date.parse(a.date) - Date.parse(b.date)) / 86400000;
  const fa = festivalBoostForDate(a.date);
  const fb = festivalBoostForDate(b.date);
  const festival = fa && fb && fa.name === fb.name ? 1.55 : 1;
  const corridor = Math.abs(a.lng - b.lng) < 0.35 || Math.abs(a.lat - b.lat) < 0.25;
  const mix = typologyMix(d, a.urban || b.urban, corridor);
  const riti = lrRiti(a, b);
  const patch = lrPatch(a, b, risks, clusters);

  let lambda = 0;
  const types: Typology[] = ["forager", "marauder", "commuter"];
  let deshW = 0;
  let kaalW = 0;
  for (const t of types) {
    const desh = lrExp(d, d0(t, a.urban || b.urban, corridor), BG_SPACE);
    const kaal = lrExp(days, tau0(t, festival > 1), BG_TIME);
    const dep = copula(desh, kaal);
    lambda += mix[t] * ((desh * kaal * riti.lr * patch) / dep);
    deshW += mix[t] * desh;
    kaalW += mix[t] * kaal;
  }

  const logLr = Math.log(Math.max(lambda, 1e-6));
  const geo = Math.exp(-d / (a.urban || b.urban ? 12 : 35));
  const time = Math.exp(-days / (10 * festival));

  return {
    a: a.id,
    b: b.id,
    geo,
    time,
    ifs: riti.ifs,
    jaccard: riti.jaccard,
    risk: patch,
    forager: mix.forager,
    festival,
    indra: logLr,
    desh: deshW,
    kaal: kaalW,
    riti: riti.lr,
    patch,
    lambda,
    logLr,
    mix,
    linked: a.seriesId !== null && a.seriesId === b.seriesId,
  };
}

function blankScore(a: CaseRecord, b: CaseRecord, linked: boolean): LinkScore {
  return {
    a: a.id,
    b: b.id,
    geo: 1,
    time: 1,
    ifs: 1,
    jaccard: 1,
    risk: 1,
    forager: 1,
    festival: 1,
    indra: 8,
    desh: 8,
    kaal: 8,
    riti: 8,
    patch: 1,
    lambda: 400,
    logLr: 8,
    mix: { forager: 1, marauder: 0, commuter: 0 },
    linked,
  };
}

/** Big-data blocking: SAE cluster ∪ corridor ∪ 3·d0 ∪ rarity tokens. Caps O(N²). */
export function blockCandidates(
  target: CaseRecord,
  universe: Universe,
  clusters: ScanCluster[],
): CaseRecord[] {
  const t0 = Date.parse(target.date);
  const clusterMate = new Set<string>();
  for (const c of clusters) {
    if (c.districtIds.includes(target.districtId)) {
      for (const id of c.districtIds) clusterMate.add(id);
    }
  }
  const tokens = rarityTokens(target);
  const out: CaseRecord[] = [];
  for (const c of universe.cases) {
    if (c.id === target.id) continue;
    if (!crimeCompatible(target.kind, c.kind)) continue;
    const days = Math.abs(Date.parse(c.date) - t0) / 86400000;
    if (days > 140) continue;
    const d = haversineKm(target.lat, target.lng, c.lat, c.lng);
    const corridor = Math.abs(target.lng - c.lng) < 0.35 || Math.abs(target.lat - c.lat) < 0.25;
    const near = d <= (target.urban || c.urban ? 36 : 105);
    const patch = clusterMate.has(c.districtId);
    const tokenHit = tokens.length > 0 && rarityTokens(c).some((t) => tokens.includes(t));
    if (near || patch || corridor || tokenHit) out.push(c);
    if (out.length >= 160) break;
  }
  return out;
}

function rarityTokens(c: CaseRecord): string[] {
  const hits: string[] = [];
  for (const f of c.features) {
    if (f.value && ["firearm", "acid", "climb", "mask", "known-lure", "rope"].includes(f.value)) {
      hits.push(f.value);
    }
  }
  return hits;
}

export function rankAgainst(
  target: CaseRecord,
  universe: Universe,
  risks: DistrictRisk[],
  clusters: ScanCluster[] = [],
): LinkScore[] {
  const pool = blockCandidates(target, universe, clusters);
  const scores = pool.map((c) => scorePair(target, c, risks, clusters));
  scores.sort((a, b) => b.logLr - a.logLr);
  return scores;
}

export function sampleEvaluationPairs(
  universe: Universe,
  risks: DistrictRisk[],
  clusters: ScanCluster[] = [],
): LinkScore[] {
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
        linked.push(scorePair(group[i]!, group[j]!, risks, clusters));
      }
    }
  }
  const unlinked: LinkScore[] = [];
  const pool = universe.cases;
  let s = 7;
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
    unlinked.push(scorePair(a, b, risks, clusters));
  }
  return [...linked, ...unlinked];
}

export function displayProb(logLr: number): number {
  return 1 / (1 + Math.exp(-logLr / 2.4));
}

export function saturateLr(v: number): number {
  return v / (1 + Math.max(v, 0));
}

export function explainScore(s: LinkScore): string {
  const lean = (Object.entries(s.mix) as [Typology, number][])
    .sort((a, b) => b[1] - a[1])[0]!;
  const bits = [`${lean[0]} ${(lean[1] * 100).toFixed(0)}%`];
  if (s.desh > 3) bits.push("space supports");
  else if (s.desh < 0.7) bits.push("space against");
  if (s.kaal > 3) bits.push("time supports");
  if (s.riti > 3) bits.push("MO distinctive");
  if (s.riti < 1.15) bits.push("hollow FIR → riti ≈ 1");
  if (s.patch > 1.8) bits.push("same SAE cluster");
  bits.push(`Λ ${s.lambda.toFixed(2)}`);
  return bits.join(" · ");
}

export type CrimeKindAlias = CrimeKind;
