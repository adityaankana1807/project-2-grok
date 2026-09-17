/** India-specific temporal priors: festivals, monsoon, summer. */

export type Festival = {
  name: string;
  /** Inclusive [start, end] as Date ISO yyyy-mm-dd */
  start: string;
  end: string;
  boost: {
    caw: number;
    rape: number;
    burglary: number;
    theft: number;
    murder: number;
    cyber: number;
    kidnapping: number;
  };
};

const B = (caw = 1, rape = 1, burglary = 1, theft = 1, murder = 1, cyber = 1, kidnapping = 1) => ({
  caw, rape, burglary, theft, murder, cyber, kidnapping,
});

export const FESTIVALS: Festival[] = [
  // Holi
  { name: "Holi", start: "2019-03-20", end: "2019-03-22", boost: B(1.35, 1.28, 1.1, 1.15, 1.05, 1.0, 1.1) },
  { name: "Holi", start: "2020-03-09", end: "2020-03-11", boost: B(1.35, 1.28, 1.1, 1.15, 1.05, 1.0, 1.1) },
  { name: "Holi", start: "2021-03-28", end: "2021-03-30", boost: B(1.35, 1.28, 1.1, 1.15, 1.05, 1.0, 1.1) },
  { name: "Holi", start: "2022-03-17", end: "2022-03-19", boost: B(1.35, 1.28, 1.1, 1.15, 1.05, 1.0, 1.1) },
  { name: "Holi", start: "2023-03-07", end: "2023-03-09", boost: B(1.35, 1.28, 1.1, 1.15, 1.05, 1.0, 1.1) },
  { name: "Holi", start: "2024-03-24", end: "2024-03-26", boost: B(1.35, 1.28, 1.1, 1.15, 1.05, 1.0, 1.1) },
  { name: "Holi", start: "2025-03-13", end: "2025-03-15", boost: B(1.35, 1.28, 1.1, 1.15, 1.05, 1.0, 1.1) },
  // Diwali window (property + crowding)
  { name: "Diwali", start: "2019-10-25", end: "2019-10-29", boost: B(1.12, 1.08, 1.55, 1.6, 1.0, 1.25, 1.1) },
  { name: "Diwali", start: "2020-11-12", end: "2020-11-16", boost: B(1.12, 1.08, 1.55, 1.6, 1.0, 1.25, 1.1) },
  { name: "Diwali", start: "2021-11-02", end: "2021-11-06", boost: B(1.12, 1.08, 1.55, 1.6, 1.0, 1.25, 1.1) },
  { name: "Diwali", start: "2022-10-22", end: "2022-10-26", boost: B(1.12, 1.08, 1.55, 1.6, 1.0, 1.25, 1.1) },
  { name: "Diwali", start: "2023-11-10", end: "2023-11-14", boost: B(1.12, 1.08, 1.55, 1.6, 1.0, 1.25, 1.1) },
  { name: "Diwali", start: "2024-10-29", end: "2024-11-02", boost: B(1.12, 1.08, 1.55, 1.6, 1.0, 1.25, 1.1) },
  { name: "Diwali", start: "2025-10-18", end: "2025-10-22", boost: B(1.12, 1.08, 1.55, 1.6, 1.0, 1.25, 1.1) },
  // Navratri / Durga Puja
  { name: "Navratri / Durga Puja", start: "2019-09-29", end: "2019-10-08", boost: B(1.22, 1.18, 1.2, 1.25, 1.0, 1.05, 1.15) },
  { name: "Navratri / Durga Puja", start: "2020-10-17", end: "2020-10-26", boost: B(1.22, 1.18, 1.2, 1.25, 1.0, 1.05, 1.15) },
  { name: "Navratri / Durga Puja", start: "2021-10-07", end: "2021-10-15", boost: B(1.22, 1.18, 1.2, 1.25, 1.0, 1.05, 1.15) },
  { name: "Navratri / Durga Puja", start: "2022-09-26", end: "2022-10-05", boost: B(1.22, 1.18, 1.2, 1.25, 1.0, 1.05, 1.15) },
  { name: "Navratri / Durga Puja", start: "2023-10-15", end: "2023-10-24", boost: B(1.22, 1.18, 1.2, 1.25, 1.0, 1.05, 1.15) },
  { name: "Navratri / Durga Puja", start: "2024-10-03", end: "2024-10-12", boost: B(1.22, 1.18, 1.2, 1.25, 1.0, 1.05, 1.15) },
  { name: "Navratri / Durga Puja", start: "2025-09-22", end: "2025-10-02", boost: B(1.22, 1.18, 1.2, 1.25, 1.0, 1.05, 1.15) },
  // Fixed national days
  ...[2019, 2020, 2021, 2022, 2023, 2024, 2025].flatMap((y) => [
    { name: "Republic Day", start: `${y}-01-26`, end: `${y}-01-26`, boost: B(1.05, 1.0, 1.1, 1.15, 1.0, 1.0, 1.05) },
    { name: "Independence Day", start: `${y}-08-15`, end: `${y}-08-15`, boost: B(1.08, 1.05, 1.12, 1.15, 1.0, 1.0, 1.08) },
    { name: "New Year", start: `${y}-12-31`, end: `${y + 1}-01-01`, boost: B(1.18, 1.15, 1.25, 1.3, 1.05, 1.1, 1.12) },
  ]),
];

export function monsoonFactor(month: number): number {
  // Jun–Sep. Indoor CAW/DV up; street crime slightly down (Sekhri & Storeygard).
  if (month >= 6 && month <= 9) return 1.12;
  return 1;
}

export function summerStreetFactor(month: number): number {
  // Apr–Jun outdoor sexual offences (Mathews et al.).
  if (month >= 4 && month <= 6) return 1.16;
  return 1;
}

export function covidDip(year: number, month: number): number {
  if (year === 2020 && month >= 4 && month <= 8) return 0.62;
  if (year === 2021 && month >= 4 && month <= 6) return 0.78;
  return 1;
}

export function festivalBoostForDate(iso: string): { name: string; factor: Record<string, number> } | null {
  for (const f of FESTIVALS) {
    if (iso >= f.start && iso <= f.end) return { name: f.name, factor: f.boost };
  }
  return null;
}

export function monthFestivalIntensity(year: number, month: number): number {
  const pad = String(month).padStart(2, "0");
  const start = `${year}-${pad}-01`;
  const end = `${year}-${pad}-28`;
  let max = 1;
  for (const f of FESTIVALS) {
    if (f.end >= start && f.start <= end) {
      const m = (f.boost.caw + f.boost.theft + f.boost.burglary) / 3;
      if (m > max) max = m;
    }
  }
  return max;
}
