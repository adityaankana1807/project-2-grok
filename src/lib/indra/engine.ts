import type { CrimeKind, IndraModel, Universe } from "./types";
import { getUniverse } from "./generate";
import { moransI, relativeRisk } from "./bym";
import { spaceTimeScan } from "./scan";
import { sampleEvaluationPairs } from "./triveni";
import { evaluateAssignment } from "./anvaya";
import { discoverSeries } from "./samhita";
import { forecastKind } from "./forecast";
import { evaluateForecast, evaluateLinkage } from "./evaluate";

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

const partCache = new Map<string, ReturnType<typeof discoverSeries>>();

export function runIndra(kind: CrimeKind, seed = 2026, uptoMonth?: number): IndraModel {
  const universe = getUniverse(seed);
  const origin = uptoMonth ?? universe.months.length - 4;
  const risks = relativeRisk(universe, kind, origin);
  const clusters = spaceTimeScan(universe, kind, origin);
  const forecast = forecastKind(universe, kind, origin, 3);
  const pairs = sampleEvaluationPairs(universe, risks, clusters);
  const linkage = evaluateLinkage(pairs);
  const assign = evaluateAssignment(universe, risks, clusters);
  let partition = partCache.get(`p:${seed}`);
  if (!partition) {
    partition = discoverSeries(universe, clusters);
    partCache.set(`p:${seed}`, partition);
  }
  const forecastM = evaluateForecast(forecast);
  const rr = risks.map((r) => r.rr);
  const highCount = risks.filter((r) => r.band === "high").length;
  return {
    universe,
    risks,
    clusters,
    forecast,
    partition,
    metrics: {
      linkage: {
        ...linkage,
        ...assign,
        ...partition.metrics,
        recallAt10: assign.assignHit3,
        mrr: assign.assignMrr,
      },
      forecast: forecastM,
      risk: {
        moran: moransI(rr, universe.neighbors),
        highCount,
        hotspotShare: highCount / risks.length,
      },
    },
  };
}

const modelCache = new Map<string, IndraModel>();

export function getModel(kind: CrimeKind, seed = 2026): IndraModel {
  const key = `samhita:${kind}:${seed}`;
  const hit = modelCache.get(key);
  if (hit) return hit;
  const model = runIndra(kind, seed);
  modelCache.set(key, model);
  return model;
}