import { create } from "zustand";
import type { CrimeKind } from "./indra/types";

type AppState = {
  kind: CrimeKind;
  monthIndex: number;
  selectedDistrictId: string | null;
  selectedCaseId: string | null;
  viewMode: "rr" | "sir" | "dark";
  seed: number;
  setKind: (k: CrimeKind) => void;
  setMonth: (i: number) => void;
  selectDistrict: (id: string | null) => void;
  selectCase: (id: string | null) => void;
  setViewMode: (m: AppState["viewMode"]) => void;
};

export const useApp = create<AppState>((set) => ({
  kind: "caw",
  monthIndex: 68, // ~ Aug 2025 if 2020-01 = 0 → 72 months, last full is 71. 68 is late 2025
  selectedDistrictId: null,
  selectedCaseId: null,
  viewMode: "rr",
  seed: 2026,
  setKind: (kind) => set({ kind, selectedDistrictId: null, selectedCaseId: null }),
  setMonth: (monthIndex) => set({ monthIndex }),
  selectDistrict: (selectedDistrictId) => set({ selectedDistrictId }),
  selectCase: (selectedCaseId) => set({ selectedCaseId }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
