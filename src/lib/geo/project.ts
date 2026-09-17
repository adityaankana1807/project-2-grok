/** Equirectangular projection tuned to the Indian landmass. */

export const LNG_MIN = 68.0;
export const LNG_MAX = 97.6;
export const LAT_MIN = 6.5;
export const LAT_MAX = 37.2;

export function project(lat: number, lng: number): { x: number; y: number } {
  const x = (lng - LNG_MIN) / (LNG_MAX - LNG_MIN);
  const y = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN);
  return { x, y };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Simplified India mainland outline as [lat, lng] rings, same CRS as districts. */
export const INDIA_MAIN: [number, number][] = [
  [35.05, 77.55],
  [34.15, 78.95],
  [32.55, 78.85],
  [31.45, 79.15],
  [30.35, 80.85],
  [29.75, 80.95],
  [28.55, 84.05],
  [27.35, 88.05],
  [27.15, 88.85],
  [27.85, 88.55],
  [28.25, 88.95],
  [27.85, 96.15],
  [27.25, 97.15],
  [26.15, 96.35],
  [24.85, 94.85],
  [24.15, 94.25],
  [22.95, 93.35],
  [22.15, 92.95],
  [23.15, 91.85],
  [24.55, 92.35],
  [25.15, 92.55],
  [26.05, 90.55],
  [25.95, 89.85],
  [26.55, 89.75],
  [26.25, 88.25],
  [25.15, 88.05],
  [24.45, 88.25],
  [22.95, 88.75],
  [21.55, 88.25],
  [21.25, 86.95],
  [19.85, 86.55],
  [19.15, 84.85],
  [17.65, 83.25],
  [16.55, 82.25],
  [15.35, 80.15],
  [13.85, 80.25],
  [13.05, 80.3],
  [11.75, 79.85],
  [10.35, 80.05],
  [9.25, 79.15],
  [8.45, 77.95],
  [8.08, 77.55],
  [8.35, 76.95],
  [8.9, 76.55],
  [10.15, 76.15],
  [11.15, 75.75],
  [12.05, 75.15],
  [13.35, 74.75],
  [14.85, 74.15],
  [15.85, 73.65],
  [16.95, 73.25],
  [18.95, 72.8],
  [20.05, 72.65],
  [20.75, 70.85],
  [21.55, 69.55],
  [22.35, 68.95],
  [23.55, 68.15],
  [24.45, 71.15],
  [25.65, 70.25],
  [26.85, 69.85],
  [27.95, 70.55],
  [29.55, 73.05],
  [30.95, 74.35],
  [32.05, 74.65],
  [32.85, 74.55],
  [34.05, 73.95],
  [34.85, 74.35],
  [35.45, 75.55],
  [36.05, 76.25],
  [35.55, 77.15],
  [35.05, 77.55],
];

export const ANDAMAN: [number, number][] = [
  [13.65, 93.05],
  [12.85, 92.95],
  [11.65, 92.75],
  [10.75, 92.55],
  [8.3, 93.5],
  [7.0, 93.85],
  [6.75, 93.95],
  [7.2, 93.7],
  [8.5, 93.35],
  [10.9, 92.7],
  [11.8, 92.95],
  [13.4, 93.2],
  [13.65, 93.05],
];

export const LAKSHADWEEP: [number, number][] = [
  [11.7, 72.65],
  [10.55, 72.55],
  [10.0, 72.6],
  [10.15, 72.7],
  [10.7, 72.75],
  [11.7, 72.65],
];

export function ringToPath(ring: [number, number][], w: number, h: number): string {
  return ring
    .map((pt, i) => {
      const { x, y } = project(pt[0], pt[1]);
      const cmd = i === 0 ? "M" : "L";
      return `${cmd}${x * w},${y * h}`;
    })
    .join(" ") + " Z";
}
