import { festivalBoostForDate } from "@/lib/data/calendar";
import { STATE_BY_CODE } from "@/lib/data/states";
import { haversineKm } from "@/lib/geo/project";
import type {
  AssignmentScore,
  CaseRecord,
  CrimeKind,
  DistrictRisk,
  ScanCluster,
  SeriesRecord,
  SprtDecision,
  Typology,
  Universe,
} from "./types";
import { MO_KEYS, MO_VALUES, STATUTE, TYPOLOGY_LABEL } from "./types";
import { jaccardMo, tonkin2025 } from "./ifs";

/**
 * ANVAYA — Accumulating Narrative, Versatility And Yield Assignment.
 *
 * All four prior systems (ST-SAGE, INDRA, I-HSTMO-Link++, Codex) and TRIVENI
 * score *pairs*. Investigators ask a different question: given a growing
 * docket S and a new FIR q, should q join S?
 *
 *   BF(q → S) = P(MO_q | θ_S) / P(MO_q | θ_0)
 *             × P(d | centroid_S, τ) / P(d | 120 km)
 *             × P(Δt | τ_0 · δ_dark · 1.55_fest) / P(Δt | 140 d)
 *             × P(family_q | family_last)                         [Tonkin 2011]
 *
 * θ_S is a Dirichlet–multinomial prototype updated as the series grows.
 * Dark-figure δ (NFHS-5) dilates time so under-reported states are not
 * penalised for sparse observed gaps. SPRT stamps OPEN / HOLD / REJECT.
 */

const ALPHA = 0.4;
const LOG10 = Math.log(10);
const BG_KM = 120;
const BG_DAYS = 140;

type MoBucket = { n: number; c: Map<string, number> };
type MoTable = Record<(typeof MO_KEYS)[number], MoBucket>;

export type SeriesProto = {
  id: string;
  members: CaseRecord[];
  n: number;
  mo: MoTable;
  lat: number;
  lng: number;
  last: CaseRecord;
  typology: Typology;
  dark: number;
  versatile: boolean;
  kind: CrimeKind;
};

function emptyMo(): MoTable {
  const o = {} as MoTable;
  for (const k of MO_KEYS) o[k] = { n: 0, c: new Map() };
  return o;
}

function addMo(table: MoTable, rec: CaseRecord) {
  for (const f of rec.features) {
    if (!f.value) continue;
    const b = table[f.key];
    b.n += 1;
    b.c.set(f.value, (b.c.get(f.value) ?? 0) + 1);
  }
}

function pred(bucket: MoBucket, value: string | null, k: number): number {
  if (!value) return 1;
  return ( (bucket.c.get(value) ?? 0) + ALPHA ) / (bucket.n + ALPHA * k);
}

function darkOf(universe: Universe, rec: CaseRecord): number {
  const d = universe.districts.find((x) => x.id === rec.districtId);
  return d ? (STATE_BY_CODE[d.state]?.darkFigure ?? 1.8) : 1.8;
}

function d0(t: Typology, urban: boolean): number {
  if (t === "forager") return 1.8;
  if (t === "marauder") return urban ? 12 : 35;
  return 72;
}

function tau0(t: Typology): number {
  return t === "forager" ? 8 : t === "marauder" ? 16 : 28;
}

function lrExp(x: number, scaleL: number, scaleU: number): number {
  const pL = Math.exp(-x / scaleL) / Math.max(scaleL, 1e-6);
  const pU = Math.exp(-x / scaleU) / Math.max(scaleU, 1e-6);
  return Math.max(1e-3, Math.min(400, pL / pU));
}

/** Tonkin 2011: cross-crime family is a scored transition, not a hard block. */
export function familyLr(from: CrimeKind, to: CrimeKind): number {
  if (from === to) return 2.45;
  const a = STATUTE[from].family;
  const b = STATUTE[to].family;
  if (a === b) return 1.85;
  const pair = `${a}|${b}`;
  const rev = `${b}|${a}`;
  const table: Record<string, number> = {
    "property|violence-women": 1.38,
    "violence-women|property": 1.22,
    "property|person": 1.05,
    "violence-women|person": 1.15,
    "cyber|property": 0.62,
    "cyber|violence-women": 0.48,
    "cyber|person": 0.5,
  };
  return table[pair] ?? table[rev] ?? 0.78;
}

export function sprtOf(logBf: number): SprtDecision {
  if (logBf >= LOG10) return "open";
  if (logBf <= -LOG10) return "reject";
  return "hold";
}

export function buildBackground(universe: Universe): MoTable {
  const bg = emptyMo();
  for (const c of universe.cases) {
    if (c.seriesId) continue;
    addMo(bg, c);
  }
  return bg;
}

function addMoW(table: MoTable, rec: CaseRecord, w: number) {
  for (const f of rec.features) {
    if (!f.value) continue;
    const b = table[f.key];
    b.n += w;
    b.c.set(f.value, (b.c.get(f.value) ?? 0) + w);
  }
}

/** Build a series prototype, optionally decaying older MO counts (half-life in days). */
export function protoFromCases(
  id: string,
  members: CaseRecord[],
  universe: Universe,
  opts?: {
    asOf?: string;
    halfLife?: number;
    typology?: Typology;
    versatile?: boolean;
    kind?: CrimeKind;
  },
): SeriesProto {
  const mo = emptyMo();
  let lat = 0;
  let lng = 0;
  let dark = 0;
  let wsum = 0;
  const sorted = members.slice().sort((a, b) => a.date.localeCompare(b.date));
  const asOf = opts?.asOf ?? sorted[sorted.length - 1]?.date ?? "2025-12-31";
  const hl = opts?.halfLife ?? Infinity;
  for (const m of sorted) {
    const days = Math.max(0, (Date.parse(asOf) - Date.parse(m.date)) / 86400000);
    const w = Number.isFinite(hl) ? Math.exp(-days / Math.max(hl, 1)) : 1;
    addMoW(mo, m, w);
    lat += m.lat * w;
    lng += m.lng * w;
    dark += darkOf(universe, m) * w;
    wsum += w;
  }
  const n = Math.max(wsum, 1e-6);
  const last = sorted[sorted.length - 1]!;
  const families = new Set(sorted.map((m) => STATUTE[m.kind].family));
  const typs = sorted.map((m) => m.typology).filter((t): t is Typology => t !== null);
  return {
    id,
    members: sorted,
    n: sorted.length,
    mo,
    lat: lat / n,
    lng: lng / n,
    last,
    typology: opts?.typology ?? typs[typs.length - 1] ?? "marauder",
    dark: dark / n,
    versatile: opts?.versatile ?? families.size > 1,
    kind: opts?.kind ?? last.kind,
  };
}

export function buildProto(
  series: SeriesRecord,
  members: CaseRecord[],
  universe: Universe,
): SeriesProto {
  return protoFromCases(series.id, members, universe, {
    typology: series.typology,
    versatile: series.versatile,
    kind: series.kind,
  });
}

export function allProtos(universe: Universe, omitId?: string): SeriesProto[] {
  const out: SeriesProto[] = [];
  for (const s of universe.series) {
    const members = s.caseIds
      .map((id) => universe.cases.find((c) => c.id === id))
      .filter((c): c is CaseRecord => !!c && c.id !== omitId);
    if (members.length === 0) continue;
    out.push(buildProto(s, members, universe));
  }
  return out;
}

export function scoreJoin(
  q: CaseRecord,
  proto: SeriesProto,
  bg: MoTable,
  universe: Universe,
  clusters: ScanCluster[],
): AssignmentScore {
  let logMo = 0;
  let obs = 0;
  let consist = 0;
  for (const key of MO_KEYS) {
    const v = q.features.find((f) => f.key === key)?.value ?? null;
    const k = MO_VALUES[key].length;
    const pS = pred(proto.mo[key], v, k);
    const p0 = pred(bg[key], v, k);
    if (v) {
      obs += 1;
      logMo += Math.log(Math.max(pS / p0, 1e-4));
      consist += pS;
    }
  }
  const coverage = obs / MO_KEYS.length;
  const mo = Math.exp(logMo * (0.35 + 0.65 * coverage));

  const d = haversineKm(q.lat, q.lng, proto.lat, proto.lng);
  const geo = lrExp(d, d0(proto.typology, q.urban || proto.last.urban), BG_KM);

  const days = Math.abs(Date.parse(q.date) - Date.parse(proto.last.date)) / 86400000;
  const fa = festivalBoostForDate(q.date);
  const fb = festivalBoostForDate(proto.last.date);
  const fest = fa && fb && fa.name === fb.name;
  const tau = tau0(proto.typology) * proto.dark * (fest ? 1.55 : 1);
  const time = lrExp(days, tau, BG_DAYS);

  const family = familyLr(proto.last.kind, q.kind);

  const same = clusters.some(
    (c) =>
      c.districtIds.includes(q.districtId) &&
      c.districtIds.includes(proto.last.districtId),
  );
  const patch = same ? 1.85 : 1;

  const modeFeats = proto.last.features.map((f) => {
    const b = proto.mo[f.key];
    let best: string | null = null;
    let n = -1;
    for (const [val, cnt] of b.c) {
      if (cnt > n) {
        n = cnt;
        best = val;
      }
    }
    return { ...f, value: best };
  });
  const distinctiveness = tonkin2025(q.features, modeFeats);

  const logBf = Math.log(mo) + Math.log(geo) + Math.log(time) + Math.log(family) + Math.log(patch);
  return {
    queryId: q.id,
    seriesId: proto.id,
    logBf,
    mo,
    geo,
    time,
    family,
    patch,
    consistency: obs ? consist / obs : 0.5,
    distinctiveness,
    coverage,
    dark: proto.dark,
    sprt: sprtOf(logBf),
    trueSeries: q.seriesId === proto.id,
  };
}

export function assignQuery(
  q: CaseRecord,
  universe: Universe,
  clusters: ScanCluster[] = [],
  omitSelf = true,
): AssignmentScore[] {
  const bg = buildBackground(universe);
  const protos = allProtos(universe, omitSelf ? q.id : undefined);
  const scores = protos.map((p) => scoreJoin(q, p, bg, universe, clusters));
  scores.sort((a, b) => b.logBf - a.logBf);
  return scores;
}

export function evaluateAssignment(
  universe: Universe,
  _risks: DistrictRisk[],
  clusters: ScanCluster[],
): {
  assignHit1: number;
  assignHit3: number;
  assignMrr: number;
  jaccardHit1: number;
  nQueries: number;
  versatileHit1: number;
} {
  const bg = buildBackground(universe);
  let hit1 = 0;
  let hit3 = 0;
  let mrr = 0;
  let jac1 = 0;
  let n = 0;
  let vN = 0;
  let vHit = 0;

  for (const s of universe.series) {
    const members = s.caseIds
      .map((id) => universe.cases.find((c) => c.id === id))
      .filter((c): c is CaseRecord => !!c)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (members.length < 3) continue;
    const q = members[members.length - 1]!;
    const rest = members.slice(0, -1);
    const proto = buildProto(s, rest, universe);
    const others = allProtos(universe, q.id).filter((p) => p.id !== s.id);
    const ranked = [proto, ...others].map((p) => scoreJoin(q, p, bg, universe, clusters));
    ranked.sort((a, b) => b.logBf - a.logBf);
    const idx = ranked.findIndex((r) => r.seriesId === s.id);
    n += 1;
    if (idx === 0) hit1 += 1;
    if (idx >= 0 && idx < 3) hit3 += 1;
    if (idx >= 0) mrr += 1 / (idx + 1);

    const jacRanked = [s, ...universe.series.filter((x) => x.id !== s.id)].map((ser) => {
      const mem = ser.caseIds
        .map((id) => universe.cases.find((c) => c.id === id))
        .filter((c): c is CaseRecord => !!c && c.id !== q.id);
      const jac =
        mem.reduce((a, m) => a + jaccardMo(q.features, m.features), 0) / Math.max(mem.length, 1);
      return { id: ser.id, jac };
    });
    jacRanked.sort((a, b) => b.jac - a.jac);
    if (jacRanked[0]?.id === s.id) jac1 += 1;

    if (s.versatile) {
      const switchIdx = members.findIndex((c, i) => i > 0 && c.kind !== members[0]!.kind);
      if (switchIdx > 0) {
        const qSwitch = members[switchIdx]!;
        const protoS = buildProto(s, members.slice(0, switchIdx), universe);
        const othersS = allProtos(universe, qSwitch.id).filter((p) => p.id !== s.id);
        const rankedS = [protoS, ...othersS]
          .map((p) => scoreJoin(qSwitch, p, bg, universe, clusters))
          .sort((a, b) => b.logBf - a.logBf);
        vN += 1;
        if (rankedS[0]?.seriesId === s.id) vHit += 1;
      }
    }
  }

  return {
    assignHit1: n ? hit1 / n : 0,
    assignHit3: n ? hit3 / n : 0,
    assignMrr: n ? mrr / n : 0,
    jaccardHit1: n ? jac1 / n : 0,
    nQueries: n,
    versatileHit1: vN ? vHit / vN : 0,
  };
}

export type SprtPoint = {
  caseId: string;
  date: string;
  logOdds: number;
  decision: SprtDecision;
  kind: CrimeKind;
};

export function sprtPath(series: SeriesRecord, universe: Universe, clusters: ScanCluster[]): SprtPoint[] {
  const members = series.caseIds
    .map((id) => universe.cases.find((c) => c.id === id))
    .filter((c): c is CaseRecord => !!c)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (members.length === 0) return [];
  const bg = buildBackground(universe);
  const path: SprtPoint[] = [
    { caseId: members[0]!.id, date: members[0]!.date, logOdds: 0, decision: "hold", kind: members[0]!.kind },
  ];
  let logOdds = 0;
  for (let i = 1; i < members.length; i++) {
    const proto = buildProto(series, members.slice(0, i), universe);
    const sc = scoreJoin(members[i]!, proto, bg, universe, clusters);
    logOdds += sc.logBf;
    path.push({
      caseId: members[i]!.id,
      date: members[i]!.date,
      logOdds,
      decision: sprtOf(logOdds),
      kind: members[i]!.kind,
    });
  }
  return path;
}

export function explainAssignment(s: AssignmentScore, typology: Typology): string {
  const bits = [`${TYPOLOGY_LABEL[typology]} docket`, `log BF ${s.logBf.toFixed(2)}`, s.sprt.toUpperCase()];
  if (s.family > 1.5) bits.push("same-family");
  else if (s.family > 1.1) bits.push("cross-crime supports (Tonkin 2011)");
  else bits.push("family penalty");
  if (s.time > 2) bits.push("dark-dilated time supports");
  if (s.coverage < 0.45) bits.push("hollow FIR → MO shrunk");
  return bits.join(" · ");
}

export const SPRT_LABEL: Record<SprtDecision, string> = {
  open: "Open docket",
  hold: "Hold — more evidence",
  reject: "Reject join",
};
