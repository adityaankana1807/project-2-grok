import type { CrimeKind, DistrictRisk, Universe } from "./types";

/**
 * Stage 1 — nested empirical-Bayes relative risk (BYM-lite).
 *
 * Direct SIRs are noisy in small districts (Pooja et al. 2024). We shrink
 * toward a population-weighted mean, then run a few CAR iterations on the
 * k-nearest neighbour graph — a linear stand-in for the Besag–York–Mollié
 * spatial + unstructured pair, runnable in the browser.
 */
export function relativeRisk(
  universe: Universe,
  kind: CrimeKind,
  uptoMonth: number,
): DistrictRisk[] {
  const { districts, neighbors, cells } = universe;
  const n = districts.length;
  const idx = new Map(districts.map((d, i) => [d.id, i]));
  const observed = new Array<number>(n).fill(0);
  const expected = new Array<number>(n).fill(0);

  const from = Math.max(0, uptoMonth - 11);
  for (const cell of cells) {
    if (cell.monthIndex < from || cell.monthIndex > uptoMonth) continue;
    const i = idx.get(cell.districtId);
    if (i === undefined) continue;
    observed[i] += cell.counts[kind];
    expected[i] += cell.expected[kind];
  }

  const sir = observed.map((o, i) => o / Math.max(expected[i], 0.05));
  const totO = observed.reduce((a, b) => a + b, 0);
  const totE = expected.reduce((a, b) => a + b, 0);
  const mu = totE > 0 ? totO / totE : 1;

  let v = 0;
  let w = 0;
  for (let i = 0; i < n; i++) {
    const wi = expected[i]!;
    v += wi * (sir[i]! - mu) ** 2;
    w += wi;
  }
  const variance = w > 0 ? v / w : 0;
  const meanE = totE / n;
  const k = mu / Math.max(variance - mu / Math.max(meanE, 0.1), 1e-4);

  let rr = sir.map((s, i) => {
    const m = expected[i]! / (expected[i]! + k);
    return m * s + (1 - m) * mu;
  });

  for (let iter = 0; iter < 4; iter++) {
    const next = rr.slice();
    for (let i = 0; i < n; i++) {
      const nbs = neighbors[i]!;
      let u = 0;
      for (const j of nbs) u += rr[j]!;
      u /= Math.max(nbs.length, 1);
      next[i] = 0.62 * rr[i]! + 0.38 * u;
    }
    rr = next;
  }

  const meanR = rr.reduce((a, b) => a + b, 0) / n;
  if (meanR > 0) rr = rr.map((r) => r / meanR);

  const persist = persistence(universe, kind, uptoMonth, idx);

  return districts.map((d, i) => {
    const r = rr[i]!;
    const stDark = darkFigure(d.state);
    return {
      districtId: d.id,
      kind,
      observed: observed[i]!,
      expected: expected[i]!,
      sir: sir[i]!,
      rr: r,
      rrDark: r * stDark,
      band: r > 1.1 ? "high" : r < 0.9 ? "low" : "mid",
      persistence: persist[i]!,
      nearRepeat: 0,
    };
  });
}

function darkFigure(state: string): number {
  const map: Record<string, number> = {
    BR: 3.2, UP: 2.7, GJ: 2.6, JH: 2.8, AS: 2.4, JK: 2.3, NL: 2.3,
    WB: 2.2, CG: 2.2, AP: 2.1, OD: 2.1, MN: 2.1, PB: 2.0, MP: 2.0, DN: 2.0,
    KA: 1.9, MH: 1.9, AR: 1.9, UK: 1.9, TR: 1.9, HR: 1.8, SK: 1.8, LA: 1.8,
    HP: 1.7, RJ: 1.7, TN: 1.7, CH: 1.6, TG: 1.6, MZ: 1.6, PY: 1.6, DL: 1.55,
    GA: 1.5, AN: 1.5, LD: 1.4, KL: 1.35,
  };
  return map[state] ?? 2;
}

function persistence(
  universe: Universe,
  kind: CrimeKind,
  upto: number,
  idx: Map<string, number>,
): number[] {
  const { districts, cells } = universe;
  const years = new Set<number>();
  for (const m of universe.months) {
    if (m.index <= upto) years.add(m.year);
  }
  const yearList = [...years];
  const hits = districts.map(() => 0);
  for (const y of yearList) {
    const monthSet = new Set(
      universe.months.filter((m) => m.year === y).map((m) => m.index),
    );
    const o = districts.map(() => 0);
    const e = districts.map(() => 0);
    for (const cell of cells) {
      if (!monthSet.has(cell.monthIndex)) continue;
      const i = idx.get(cell.districtId);
      if (i === undefined) continue;
      o[i] += cell.counts[kind];
      e[i] += cell.expected[kind];
    }
    for (let i = 0; i < districts.length; i++) {
      if (o[i]! / Math.max(e[i]!, 0.1) > 1.15) hits[i]! += 1;
    }
  }
  return hits.map((h) => h / Math.max(yearList.length, 1));
}

export function moransI(rr: number[], neighbors: number[][]): number {
  const n = rr.length;
  const mean = rr.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  let wsum = 0;
  for (let i = 0; i < n; i++) {
    const di = rr[i]! - mean;
    den += di * di;
    for (const j of neighbors[i]!) {
      num += di * (rr[j]! - mean);
      wsum += 1;
    }
  }
  if (den === 0 || wsum === 0) return 0;
  const i = (n / wsum) * (num / den);
  return Math.max(-1, Math.min(1, i));
}
