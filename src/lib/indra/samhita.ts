import type {
  CaseRecord,
  DiscoverStep,
  PartitionResult,
  ScanCluster,
  Universe,
} from "./types";
import { scoreJoin, protoFromCases, buildBackground, familyLr } from "./anvaya";

/**
 * SAMHITA — Sequential Allocation of Modus, Hazard and Infinite Table Assignment.
 *
 * ST-SAGE, INDRA, I-HSTMO-Link++, Codex, TRIVENI and ANVAYA all assume the
 * series either (a) is a pair to be scored or (b) already exists as a docket.
 * An investigating officer is compiling a caseload: each new FIR either sits
 * at an existing table or opens a new one. That is a Chinese-restaurant
 * process whose likelihood is ANVAYA's join Bayes factor, whose occupancy is
 * inflated by the NFHS-5 dark figure, and whose MO prototype forgets with a
 * 140-day half-life so versatility is a random walk, not a family block.
 *
 *   P(join S | q) ∝ n_S · δ̄_S · BF(q → S_decayed)
 *   P(new     | q) ∝ α
 *
 * Evaluation is a partition (ARI, recovered series), not Hit@1 assignment
 * and not pairwise AUC.
 */

export const SAMHITA_CONC = 1.85;
export const SAMHITA_HALF_LIFE = 140;
const CONC = SAMHITA_CONC;
const HALF_LIFE = SAMHITA_HALF_LIFE;
const N_SINGLETONS = 80;
const LOG10 = Math.log(10);

function goldLabel(c: CaseRecord): string {
  return c.seriesId ?? `s:${c.id}`;
}

function combinations2(n: number): number {
  return n < 2 ? 0 : (n * (n - 1)) / 2;
}

export function adjustedRand(gold: string[], pred: string[]): number {
  const n = gold.length;
  if (n < 2) return 1;
  const gMap = new Map<string, number>();
  const pMap = new Map<string, number>();
  const cell = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const g = gold[i]!;
    const p = pred[i]!;
    gMap.set(g, (gMap.get(g) ?? 0) + 1);
    pMap.set(p, (pMap.get(p) ?? 0) + 1);
    const k = `${g}\0${p}`;
    cell.set(k, (cell.get(k) ?? 0) + 1);
  }
  let sumij = 0;
  for (const v of cell.values()) sumij += combinations2(v);
  let sumi = 0;
  for (const v of gMap.values()) sumi += combinations2(v);
  let sumj = 0;
  for (const v of pMap.values()) sumj += combinations2(v);
  const tot = combinations2(n);
  if (tot === 0) return 1;
  const exp = (sumi * sumj) / tot;
  const max = 0.5 * (sumi + sumj);
  const den = max - exp;
  if (Math.abs(den) < 1e-12) return 1;
  return (sumij - exp) / den;
}

export function discoveryPool(universe: Universe): CaseRecord[] {
  const planted = universe.cases.filter((c) => c.seriesId);
  const hosts = new Set(planted.map((c) => c.districtId));
  const near = universe.cases
    .filter((c) => !c.seriesId && hosts.has(c.districtId))
    .sort((a, b) => a.id.localeCompare(b.id));
  const far = universe.cases
    .filter((c) => !c.seriesId && !hosts.has(c.districtId))
    .sort((a, b) => a.id.localeCompare(b.id));
  const sings = [...near, ...far].slice(0, N_SINGLETONS);
  return [...planted, ...sings].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

type Live = { id: string; members: CaseRecord[] };

function allocate(
  pool: CaseRecord[],
  universe: Universe,
  clusters: ScanCluster[],
  mode: "samhita" | "greedy",
): { steps: DiscoverStep[]; tables: Live[] } {
  const bg = buildBackground(universe);
  const tables: Live[] = [];
  const steps: DiscoverStep[] = [];
  let seq = 0;

  for (const q of pool) {
    const logNew = Math.log(CONC);
    let bestI = -1;
    let bestLog = -Infinity;
    let bestBf = 0;
    let bestDark = 1.8;

    for (let i = 0; i < tables.length; i++) {
      const t = tables[i]!;
      const proto = protoFromCases(t.id, t.members, universe, {
        asOf: q.date,
        halfLife: mode === "samhita" ? HALF_LIFE : Infinity,
      });
      const sc = scoreJoin(q, proto, bg, universe, clusters);
      const nEff =
        mode === "samhita" ? t.members.length * proto.dark : t.members.length;
      const logPost = Math.log(Math.max(nEff, 1e-3)) + sc.logBf;
      if (logPost > bestLog) {
        bestLog = logPost;
        bestI = i;
        bestBf = sc.logBf;
        bestDark = proto.dark;
      }
    }

    const joinWins =
      mode === "samhita"
        ? bestI >= 0 && bestLog > logNew
        : bestI >= 0 && bestBf >= LOG10;

    let tableId: string;
    let action: DiscoverStep["action"];
    if (joinWins && bestI >= 0) {
      tables[bestI]!.members.push(q);
      tableId = tables[bestI]!.id;
      action = "join";
    } else {
      seq += 1;
      tableId = `T${String(seq).padStart(2, "0")}`;
      tables.push({ id: tableId, members: [q] });
      action = "new";
    }

    steps.push({
      caseId: q.id,
      date: q.date,
      tableId,
      action,
      logPost: bestI >= 0 ? bestLog : logNew,
      logNew,
      logBf: bestBf,
      nTables: tables.length,
      trueSeries: q.seriesId,
      dark: bestDark,
      family: tables.length > 1 ? familyLr(q.kind, q.kind) : 1,
    });
  }

  return { steps, tables };
}

function partitionMetrics(
  pool: CaseRecord[],
  tables: Live[],
  nSeriesTruth: number,
): {
  ari: number;
  singletonPrecision: number;
  recoveredSeries: number;
  overSeg: number;
  underSeg: number;
  nTables: number;
} {
  const labelOf = new Map<string, string>();
  for (const t of tables) {
    for (const m of t.members) labelOf.set(m.id, t.id);
  }
  const gold = pool.map(goldLabel);
  const pred = pool.map((c) => labelOf.get(c.id) ?? `x:${c.id}`);
  const ari = adjustedRand(gold, pred);

  const size1 = tables.filter((t) => t.members.length === 1);
  let singOk = 0;
  for (const t of size1) {
    if (!t.members[0]!.seriesId) singOk += 1;
  }
  const singletonPrecision = size1.length ? singOk / size1.length : 1;

  const byGold = new Map<string, CaseRecord[]>();
  for (const c of pool) {
    if (!c.seriesId) continue;
    const list = byGold.get(c.seriesId) ?? [];
    list.push(c);
    byGold.set(c.seriesId, list);
  }

  let recovered = 0;
  let over = 0;
  for (const members of byGold.values()) {
    const tabCounts = new Map<string, number>();
    for (const m of members) {
      const tid = labelOf.get(m.id);
      if (!tid) continue;
      tabCounts.set(tid, (tabCounts.get(tid) ?? 0) + 1);
    }
    const sized = [...tabCounts.entries()].filter(([tid]) => {
      const t = tables.find((x) => x.id === tid);
      return (t?.members.length ?? 0) >= 2;
    });
    if (sized.length >= 2) over += 1;
    let best = 0;
    let bestId = "";
    for (const [tid, n] of tabCounts) {
      if (n > best) {
        best = n;
        bestId = tid;
      }
    }
    const table = tables.find((t) => t.id === bestId);
    const purity = table && table.members.length ? best / table.members.length : 0;
    const recall = members.length ? best / members.length : 0;
    if (purity >= 0.7 && recall >= 0.5 && (table?.members.length ?? 0) >= 2) recovered += 1;
  }

  let under = 0;
  const multi = tables.filter((t) => t.members.length >= 2);
  for (const t of multi) {
    const series = new Set(t.members.map((m) => m.seriesId).filter(Boolean));
    if (series.size >= 2) under += 1;
  }

  return {
    ari,
    singletonPrecision,
    recoveredSeries: nSeriesTruth ? recovered / nSeriesTruth : 0,
    overSeg: nSeriesTruth ? over / nSeriesTruth : 0,
    underSeg: multi.length ? under / multi.length : 0,
    nTables: tables.length,
  };
}

export function discoverSeries(
  universe: Universe,
  clusters: ScanCluster[] = [],
): PartitionResult {
  const pool = discoveryPool(universe);
  const samhita = allocate(pool, universe, clusters, "samhita");
  const greedy = allocate(pool, universe, clusters, "greedy");
  const nSeriesTruth = universe.series.length;
  const m = partitionMetrics(pool, samhita.tables, nSeriesTruth);
  const g = partitionMetrics(pool, greedy.tables, nSeriesTruth);

  const labels: Record<string, string> = {};
  for (const t of samhita.tables) {
    for (const mem of t.members) labels[mem.id] = t.id;
  }

  return {
    steps: samhita.steps,
    tables: samhita.tables.map((t) => ({
      id: t.id,
      caseIds: t.members.map((m) => m.id),
    })),
    labels,
    metrics: {
      ari: m.ari,
      greedyAri: g.ari,
      singletonPrecision: m.singletonPrecision,
      recoveredSeries: m.recoveredSeries,
      nTables: m.nTables,
      nPool: pool.length,
      nSeriesTruth,
      overSeg: m.overSeg,
      underSeg: m.underSeg,
    },
  };
}

export function explainStep(step: DiscoverStep): string {
  if (step.action === "new") {
    return `Opened ${step.tableId} · log P(new)=${step.logNew.toFixed(2)} beat join ${step.logPost.toFixed(2)}`;
  }
  return `Joined ${step.tableId} · log-post ${step.logPost.toFixed(2)} vs new ${step.logNew.toFixed(2)} · BF ${step.logBf.toFixed(2)} · δ ${step.dark.toFixed(2)}`;
}
