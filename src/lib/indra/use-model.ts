import { useMemo } from "react";
import type { CrimeKind } from "./types";
import { getModel } from "./engine";
import { getUniverse } from "./generate";

/** Seeded universe is deterministic and cheap enough for SSR. */
export function useUniverse(seed = 2026) {
  return useMemo(() => getUniverse(seed), [seed]);
}

/**
 * SAMHITA + SAE atlas. Sync so first paint already has ARI and clusters.
 */
export function useModel(kind: CrimeKind, seed = 2026) {
  const model = useMemo(() => getModel(kind, seed), [kind, seed]);
  return { model, busy: false as const };
}
