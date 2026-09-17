import type { CrimeKind, IndraModel, Universe } from "./types";
import { getUniverse } from "./generate";
import { moransI, relativeRisk } from "./bym";
import { spaceTimeScan } from "./scan";
import { sampleEvaluationPairs } from "./linkage";
import { forecastKind } from "./forecast";
import { evaluateForecast, evaluateLinkage } from "./evaluate";

export function runIndra(kind: CrimeKind, seed = 2026, uptoMonth?: number): IndraModel {
  const universe = getUniverse(seed);
  const origin = uptoMonth ?? universe.months.length - 4;
  const risks = relativeRisk(universe, kind, origin);
  const clusters = spaceTimeScan(universe, kind, origin);
  const forecast = forecastKind(universe, kind, origin, 3);
  const pairs = sampleEvaluationPairs(universe, risks);
  const linkage = evaluateLinkage(pairs);
  const forecastM = evaluateForecast(forecast);
  const rr = risks.map((r) => r.rr);
  const highCount = risks.filter((r) => r.band === "high").length;
  return {
    universe,
    risks,
    clusters,
    forecast,
    metrics: {
      linkage,
      forecast: forecastM,
      risk: {
        moran: moransI(rr, universe.neighbors),
        highCount,
        hotspotShare: highCount / risks.length,
      },
    },
  };
}

const modelCache = new Map<string, IndraModel>(); // keyed by kind:seed

export function getModel(kind: CrimeKind, seed = 2026): IndraModel {
  const key = `${kind}:${seed}`;
  const hit = modelCache.get(key);
  if (hit) return hit;
  const model = runIndra(kind, seed);
  modelCache.set(key, model);
  return model;
}

/** First-paint atlas slice — risk + scan only, no linkage eval. */
export function atlasView(universe: Universe, kind: CrimeKind, origin: number) {
  const risks = relativeRisk(universe, kind, origin);
  const clusters = spaceTimeScan(universe, kind, origin);
  const rr = risks.map((r) => r.rr);
  const highCount = risks.filter((r) => r.band === "high").length;
  return {
    risks,
    clusters,
    moran: moransI(rr, universe.neighbors),
    highCount,
  };
}

export function nationalObserved(universe: Universe, kind: CrimeKind, monthIndex: number): number {
  let s = 0;
  for (const c of universe.cells) {
    if (c.monthIndex === monthIndex) s += c.counts[kind];
  }
  return s;
}

export function seriesForDistrict(
  universe: Universe,
  districtId: string,
  kind: CrimeKind,
): { monthIndex: number; count: number; expected: number; festival: number }[] {
  return universe.cells
    .filter((c) => c.districtId === districtId)
    .map((c) => ({
      monthIndex: c.monthIndex,
      count: c.counts[kind],
      expected: c.expected[kind],
      festival: c.festivalBoost,
    }));
}
