import { useMemo } from "react";
import { ANDAMAN, INDIA_MAIN, LAKSHADWEEP, project, ringToPath } from "@/lib/geo/project";
import type { District, DistrictRisk, ScanCluster } from "@/lib/indra/types";

const W = 1000;
const H = 1080;

function riskColor(value: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - min) / Math.max(max - min, 1e-6)));
  // low sage → bone → vermillion (piecewise, no purple/gold)
  if (t < 0.5) {
    const u = t / 0.5;
    return lerpHex("#6a8f78", "#c8ccd4", u);
  }
  const u = (t - 0.5) / 0.5;
  return lerpHex("#c8ccd4", "#c45c4a", u);
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = hex(a);
  const pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hex(h: string): [number, number, number] {
  const n = h.replace("#", "");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

export function IndiaMap({
  districts,
  risks,
  clusters,
  selectedId,
  onSelect,
  metric = "rr",
}: {
  districts: District[];
  risks: DistrictRisk[];
  clusters: ScanCluster[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  metric?: "rr" | "sir" | "dark";
}) {
  const byId = useMemo(() => new Map(risks.map((r) => [r.districtId, r])), [risks]);
  const values = risks.map((r) => (metric === "sir" ? r.sir : metric === "dark" ? r.rrDark : r.rr));
  const min = Math.min(...values, 0.4);
  const max = Math.max(...values, 1.6);

  const main = ringToPath(INDIA_MAIN, W, H);
  const andaman = ringToPath(ANDAMAN, W, H);
  const lak = ringToPath(LAKSHADWEEP, W, H);

  const hulls = clusters.slice(0, 4).map((c) => {
    const pts = c.districtIds
      .map((id) => districts.find((d) => d.id === id))
      .filter(Boolean)
      .map((d) => {
        const p = project(d!.lat, d!.lng);
        return { x: p.x * W, y: p.y * H };
      });
    if (pts.length < 2) return null;
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const rx = Math.max(...pts.map((p) => Math.abs(p.x - cx))) + 18;
    const ry = Math.max(...pts.map((p) => Math.abs(p.y - cy))) + 18;
    return { cx, cy, rx, ry, primary: c.primary, id: c.id };
  });

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="India district risk atlas"
      >
        <path d={main} fill="#151715" stroke="#2a2e2a" strokeWidth="2" />
        <path d={andaman} fill="#151715" stroke="#2a2e2a" strokeWidth="1.5" />
        <path d={lak} fill="#151715" stroke="#2a2e2a" strokeWidth="1.5" />

        {hulls.map(
          (h) =>
            h && (
              <ellipse
                key={h.id}
                cx={h.cx}
                cy={h.cy}
                rx={h.rx}
                ry={h.ry}
                fill={h.primary ? "rgba(196,92,74,0.08)" : "rgba(200,204,212,0.05)"}
                stroke={h.primary ? "#c45c4a" : "#8f918a"}
                strokeWidth="1.2"
                strokeDasharray={h.primary ? "0" : "6 5"}
              />
            ),
        )}

        {districts.map((d) => {
          const p = project(d.lat, d.lng);
          const r = byId.get(d.id);
          const v = r ? (metric === "sir" ? r.sir : metric === "dark" ? r.rrDark : r.rr) : 1;
          const selected = selectedId === d.id;
          const size = 7 + Math.min(d.popLakh, 80) / 14 + (selected ? 3 : 0);
          return (
            <circle
              key={d.id}
              cx={p.x * W}
              cy={p.y * H}
              r={size}
              fill={riskColor(v, min, max)}
              stroke={selected ? "#eceae4" : "#0b0c0b"}
              strokeWidth={selected ? 2 : 0.8}
              className="cursor-pointer"
              onClick={() => onSelect(d.id)}
            >
              <title>{`${d.name}, ${d.stateName} — RR ${v.toFixed(2)}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-2 rounded-md bg-background/80 px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="inline-block size-2 rounded-full" style={{ background: "#6a8f78" }} />
        Low
        <span className="inline-block size-2 rounded-full" style={{ background: "#c8ccd4" }} />
        Mid
        <span className="inline-block size-2 rounded-full" style={{ background: "#c45c4a" }} />
        High
      </div>
    </div>
  );
}
