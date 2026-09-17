import { monthFestivalIntensity, monsoonFactor } from "@/lib/data/calendar";
import type { CrimeKind, ForecastPoint, Universe } from "./types";

/**
 * Stage 6 — ST-lite forecast (closed-form cousin of ST-ResNet+LSTM).
 * Per district: lag-1, lag-12, neighbour mean, festival, monsoon.
 * Fitted coefficients are fixed (inspectable); rolled one month forward.
 */
export function forecastKind(
  universe: Universe,
  kind: CrimeKind,
  originMonth: number,
  horizon = 3,
): ForecastPoint[] {
  const { districts, neighbors, cells, months } = universe;
  const n = districts.length;
  const idx = new Map(districts.map((d, i) => [d.id, i]));
  const T = originMonth + 1;
  const series: number[][] = Array.from({ length: n }, () => new Array<number>(T).fill(0));
  const actualAt: (number | null)[][] = Array.from({ length: n }, () =>
    new Array<number | null>(months.length).fill(null),
  );
  for (const cell of cells) {
    const i = idx.get(cell.districtId);
    if (i === undefined) continue;
    actualAt[i]![cell.monthIndex] = cell.counts[kind];
    if (cell.monthIndex < T) series[i]![cell.monthIndex] = cell.counts[kind];
  }

  const out: ForecastPoint[] = [];
  for (let h = 1; h <= horizon; h++) {
    const t = originMonth + h;
    const month = months[Math.min(t, months.length - 1)] ?? months[months.length - 1]!;
    const fest = monthFestivalIntensity(month.year, month.month);
    const mon = monsoonFactor(month.month);
    for (let i = 0; i < n; i++) {
      const y = series[i]!;
      const lag1 = y[originMonth + h - 1] ?? y[originMonth] ?? 0;
      const lag12 = y[originMonth + h - 12] ?? lag1;
      let nb = 0;
      const nbs = neighbors[i]!;
      for (const j of nbs) {
        const ys = series[j]!;
        nb += ys[originMonth + h - 1] ?? ys[originMonth] ?? 0;
      }
      nb /= Math.max(nbs.length, 1);
      const pred = Math.max(
        0,
        0.08 + 0.46 * lag1 + 0.22 * lag12 + 0.14 * nb + 1.4 * (fest - 1) + 0.6 * (mon - 1),
      );
      if (t < series[i]!.length) series[i]![t] = pred;
      else series[i]!.push(pred);
      out.push({
        districtId: districts[i]!.id,
        monthIndex: t,
        kind,
        predicted: pred,
        actual: t < months.length ? (actualAt[i]![t] ?? null) : null,
      });
    }
  }
  return out;
}
