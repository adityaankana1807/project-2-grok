import type { IfsTriple, MoFeature, MoKey } from "./types";
import { MO_KEYS } from "./types";

/**
 * Encode a modus-operandi observation as an intuitionistic fuzzy set.
 * Indian FIR / NCRB case records are routinely incomplete — unknown is not
 * “absent”. Hesitancy π carries that missingness (Dutta & Banik 2024).
 */
export function encodeFeature(value: string | null): IfsTriple {
  if (value === null) {
    return { mu: 0.22, nu: 0.22, pi: 0.56 };
  }
  return { mu: 0.84, nu: 0.06, pi: 0.1 };
}

/**
 * Dutta–Banik generalized IFS similarity.
 * S = (2 − |Δμ| − |Δν|) / (2 + |Δπ|)  ·  (1 − 0.25 |Δs|)
 */
export function ifsSimilarity(a: IfsTriple, b: IfsTriple): number {
  const dMu = Math.abs(a.mu - b.mu);
  const dNu = Math.abs(a.nu - b.nu);
  const dPi = Math.abs(a.pi - b.pi);
  const base = (2 - dMu - dNu) / (2 + dPi);
  const sa = a.mu - a.nu;
  const sb = b.mu - b.nu;
  const signed = 1 - 0.25 * Math.abs(sa - sb);
  return clamp01(base * signed);
}

/** Jaccard on observed (non-null) values only. Double-unknowns do not inflate. */
export function jaccardMo(a: MoFeature[], b: MoFeature[]): number {
  let inter = 0;
  let union = 0;
  for (const key of MO_KEYS) {
    const va = a.find((f) => f.key === key)?.value ?? null;
    const vb = b.find((f) => f.key === key)?.value ?? null;
    if (va === null && vb === null) continue;
    union += 1;
    if (va !== null && vb !== null && va === vb) inter += 1;
  }
  return union === 0 ? 0 : inter / union;
}

/**
 * Tonkin et al. 2025 low-base-rate metric: log(1 + 3 + 3a − (b+c)).
 * Joint presence of rare behaviours is up-weighted 3× vs Jaccard.
 */
export function tonkin2025(a: MoFeature[], b: MoFeature[]): number {
  let both = 0;
  let only = 0;
  for (const key of MO_KEYS) {
    const va = a.find((f) => f.key === key)?.value ?? null;
    const vb = b.find((f) => f.key === key)?.value ?? null;
    if (va === null || vb === null) continue;
    if (va === vb && va !== "none") both += 1;
    else only += 1;
  }
  const inner = 1 + 3 + 3 * both - only;
  return Math.log(Math.max(inner, 1e-6));
}

export function indraIfsScore(a: MoFeature[], b: MoFeature[]): number {
  let num = 0;
  let den = 0;
  for (const key of MO_KEYS) {
    const fa = a.find((f) => f.key === key);
    const fb = b.find((f) => f.key === key);
    if (!fa || !fb) continue;
    const w = rarityWeight(key, fa.value, fb.value);
    num += w * ifsSimilarity(fa.ifs, fb.ifs) * valueAgreement(fa, fb);
    den += w;
  }
  return den === 0 ? 0 : num / den;
}

function valueAgreement(fa: MoFeature, fb: MoFeature): number {
  if (fa.value === null || fb.value === null) return 0.72;
  return fa.value === fb.value ? 1 : 0.35;
}

function rarityWeight(key: MoKey, va: string | null, vb: string | null): number {
  const rare: Partial<Record<MoKey, string[]>> = {
    weapon: ["firearm", "acid"],
    approach: ["known-lure"],
    entry: ["climb"],
    disguise: ["mask"],
    binding: ["rope"],
  };
  const list = rare[key] ?? [];
  const hit = (va && list.includes(va)) || (vb && list.includes(vb));
  return hit ? 1.65 : 1;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
