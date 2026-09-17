import { haversineKm } from "@/lib/geo/project";
import type { CrimeKind, ScanCluster, Universe } from "./types";

/**
 * Stage 2 — Kulldorff-lite space–time scan (Mathews, Binu & Guddattu 2024).
 * Circular spatial windows (80 / 180 km) × 3-month cylinders on a Poisson
 * discrete model. LLR is the classical Kulldorff statistic.
 */
export function spaceTimeScan(
  universe: Universe,
  kind: CrimeKind,
  uptoMonth: number,
): ScanCluster[] {
  const { districts, cells } = universe;
  const radii = [80, 180];
  const startMin = Math.max(0, uptoMonth - 23);
  const clusters: Omit<ScanCluster, "id" | "primary">[] = [];
  const idx = new Map(districts.map((d, i) => [d.id, i]));

  const membersAt = radii.map((radius) =>
    districts.map((center) => {
      const members: number[] = [];
      for (let j = 0; j < districts.length; j++) {
        const d = districts[j]!;
        if (haversineKm(center.lat, center.lng, d.lat, d.lng) <= radius) members.push(j);
      }
      return members;
    }),
  );

  for (let ri = 0; ri < radii.length; ri++) {
    const radius = radii[ri]!;
    const membersFor = membersAt[ri]!;
    for (let t1 = startMin; t1 <= uptoMonth - 2; t1 += 2) {
      const t2 = Math.min(uptoMonth, t1 + 2);
      const obs = new Array<number>(districts.length).fill(0);
      const exp = new Array<number>(districts.length).fill(0);
      for (const cell of cells) {
        if (cell.monthIndex < t1 || cell.monthIndex > t2) continue;
        const i = idx.get(cell.districtId);
        if (i === undefined) continue;
        obs[i] += cell.counts[kind];
        exp[i] += cell.expected[kind];
      }
      const Otot = obs.reduce((a, b) => a + b, 0);
      const Etot = exp.reduce((a, b) => a + b, 0);
      if (Otot < 8 || Etot <= 0) continue;

      for (let c = 0; c < districts.length; c++) {
        const members = membersFor[c]!;
        if (members.length < 2) continue;
        let Oin = 0;
        let Ein = 0;
        for (const j of members) {
          Oin += obs[j]!;
          Ein += exp[j]!;
        }
        if (Oin <= Ein || Ein < 0.5) continue;
        const Oout = Otot - Oin;
        const Eout = Math.max(Etot - Ein, 1e-6);
        const llr =
          Oin * Math.log(Oin / Ein) +
          (Oout > 0 ? Oout * Math.log(Oout / Eout) : 0) -
          Otot * Math.log(Otot / Etot);
        if (llr < 8) continue;
        clusters.push({
          kind,
          centerId: districts[c]!.id,
          districtIds: members.map((j) => districts[j]!.id),
          radiusKm: radius,
          startMonth: t1,
          endMonth: t2,
          llr,
          observed: Oin,
          expected: Ein,
        });
      }
    }
  }

  clusters.sort((a, b) => b.llr - a.llr);
  const kept: ScanCluster[] = [];
  const used = new Set<string>();
  for (const c of clusters) {
    const key = c.districtIds.slice().sort().join("|") + `@${c.startMonth}`;
    if (used.has(key)) continue;
    if (kept.some((k) => k.centerId === c.centerId)) continue;
    const overlap = kept.some(
      (k) =>
        k.radiusKm === c.radiusKm &&
        intersection(k.districtIds, c.districtIds).length >
          0.6 * Math.min(k.districtIds.length, c.districtIds.length) &&
        !(c.endMonth < k.startMonth || c.startMonth > k.endMonth),
    );
    if (overlap) continue;
    used.add(key);
    kept.push({
      ...c,
      id: `K${kept.length + 1}`,
      primary: kept.length === 0,
    });
    if (kept.length >= 12) break;
  }
  return kept;
}

function intersection(a: string[], b: string[]): string[] {
  const s = new Set(b);
  return a.filter((x) => s.has(x));
}

export function monthLabel(months: Universe["months"], index: number): string {
  const m = months[index];
  if (!m) return "—";
  return `${String(m.month).padStart(2, "0")}/${m.year}`;
}
