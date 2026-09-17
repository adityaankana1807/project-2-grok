import type { EvalMetrics, ForecastPoint, LinkScore } from "./types";

function auc(scores: { y: number; p: number }[]): number {
  const pos = scores.filter((s) => s.y === 1).sort((a, b) => a.p - b.p);
  const neg = scores.filter((s) => s.y === 0).sort((a, b) => a.p - b.p);
  if (pos.length === 0 || neg.length === 0) return 0.5;
  let rank = 0;
  let i = 0;
  let j = 0;
  const all = scores.slice().sort((a, b) => a.p - b.p);
  // Mann–Whitney
  let u = 0;
  for (const p of pos) {
    let nLess = 0;
    for (const n of neg) if (n.p < p.p) nLess += 1;
    else if (n.p === p.p) nLess += 0.5;
    u += nLess;
  }
  void rank;
  void i;
  void j;
  void all;
  return u / (pos.length * neg.length);
}

function auprc(scores: { y: number; p: number }[]): number {
  const sorted = scores.slice().sort((a, b) => b.p - a.p);
  const P = scores.filter((s) => s.y === 1).length;
  if (P === 0) return 0;
  let tp = 0;
  let fp = 0;
  let prev = 1;
  let area = 0;
  let lastRec = 0;
  for (const s of sorted) {
    if (s.y === 1) tp += 1;
    else fp += 1;
    const rec = tp / P;
    const prec = tp / (tp + fp);
    area += (rec - lastRec) * prec;
    lastRec = rec;
    prev = prec;
  }
  void prev;
  return area;
}

export function evaluateLinkage(pairs: LinkScore[]): EvalMetrics["linkage"] {
  const rows = pairs.map((p) => ({
    y: p.linked ? 1 : 0,
    indra: p.indra,
    jaccard: p.jaccard,
    ifs: p.ifs,
    geo: p.geo,
  }));
  const nLinked = rows.filter((r) => r.y === 1).length;
  const nUnlinked = rows.length - nLinked;

  const byIndra = pairs.slice().sort((a, b) => b.indra - a.indra);
  const byJac = pairs.slice().sort((a, b) => b.jaccard - a.jaccard);
  const top100Indra = byIndra.slice(0, 100).filter((p) => p.linked).length / Math.min(100, byIndra.length);
  const top100Jaccard = byJac.slice(0, 100).filter((p) => p.linked).length / Math.min(100, byJac.length);

  function medianFirstRank(key: "indra" | "jaccard"): number {
    const series = new Set(pairs.filter((p) => p.linked).map((p) => p.a + "|" + p.b));
    void series;
    // For each linked pair endpoint, rank of first true link
    const left = new Map<string, LinkScore[]>();
    for (const p of pairs) {
      const list = left.get(p.a) ?? [];
      list.push(p);
      left.set(p.a, list);
    }
    const ranks: number[] = [];
    for (const list of left.values()) {
      list.sort((a, b) => b[key] - a[key]);
      const idx = list.findIndex((x) => x.linked);
      if (idx >= 0) ranks.push(idx + 1);
    }
    if (ranks.length === 0) return 0;
    ranks.sort((a, b) => a - b);
    return ranks[Math.floor(ranks.length / 2)]!;
  }

  return {
    indraAuc: auc(rows.map((r) => ({ y: r.y, p: r.indra }))),
    jaccardAuc: auc(rows.map((r) => ({ y: r.y, p: r.jaccard }))),
    ifsAuc: auc(rows.map((r) => ({ y: r.y, p: r.ifs }))),
    geoAuc: auc(rows.map((r) => ({ y: r.y, p: r.geo }))),
    indraAuprc: auprc(rows.map((r) => ({ y: r.y, p: r.indra }))),
    jaccardAuprc: auprc(rows.map((r) => ({ y: r.y, p: r.jaccard }))),
    top100Indra,
    top100Jaccard,
    medianFirstRankIndra: medianFirstRank("indra"),
    medianFirstRankJaccard: medianFirstRank("jaccard"),
    nLinked,
    nUnlinked,
  };
}

export function evaluateForecast(points: ForecastPoint[]): EvalMetrics["forecast"] {
  const comparable = points.filter((p) => p.actual !== null);
  if (comparable.length === 0) return { mae: 0, hitRate: 0, naiveMae: 0 };
  let mae = 0;
  let naiveMae = 0;
  for (const p of comparable) {
    mae += Math.abs(p.predicted - (p.actual ?? 0));
    naiveMae += Math.abs((p.actual ?? 0) - 0); // vs zero is weak; use mean later
  }
  mae /= comparable.length;
  const meanAct =
    comparable.reduce((a, p) => a + (p.actual ?? 0), 0) / comparable.length;
  naiveMae =
    comparable.reduce((a, p) => a + Math.abs((p.actual ?? 0) - meanAct), 0) /
    comparable.length;

  // Hit rate: share of true top-decile districts recovered in predicted top-decile
  const byMonth = new Map<number, ForecastPoint[]>();
  for (const p of comparable) {
    const list = byMonth.get(p.monthIndex) ?? [];
    list.push(p);
    byMonth.set(p.monthIndex, list);
  }
  let hit = 0;
  let tot = 0;
  for (const list of byMonth.values()) {
    const k = Math.max(1, Math.round(list.length * 0.1));
    const trueTop = new Set(
      list
        .slice()
        .sort((a, b) => (b.actual ?? 0) - (a.actual ?? 0))
        .slice(0, k)
        .map((p) => p.districtId),
    );
    const predTop = list
      .slice()
      .sort((a, b) => b.predicted - a.predicted)
      .slice(0, k);
    for (const p of predTop) if (trueTop.has(p.districtId)) hit += 1;
    tot += k;
  }
  return { mae, hitRate: tot ? hit / tot : 0, naiveMae };
}
