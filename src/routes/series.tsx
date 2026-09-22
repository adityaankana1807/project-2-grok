import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CRIME_LABEL, TYPOLOGY_LABEL, type Typology } from "@/lib/indra/types";
import { sprtPath, SPRT_LABEL } from "@/lib/indra/anvaya";
import { useModel } from "@/lib/indra/use-model";
import { useApp } from "@/lib/store";
import { formatNum } from "@/lib/utils";

export const Route = createFileRoute("/series")({ component: SeriesPage });

const TYPE_TONE: Record<Typology, "high" | "mid" | "low"> = {
  forager: "high",
  marauder: "mid",
  commuter: "low",
};

function SeriesPage() {
  const kind = useApp((s) => s.kind);
  const { model } = useModel(kind);
  const [sid, setSid] = useState(model.universe.series[0]?.id ?? "S01");
  const series = model.universe.series.find((s) => s.id === sid) ?? model.universe.series[0];
  const cases = useMemo(() => {
    if (!series) return [];
    return series.caseIds
      .map((id) => model.universe.cases.find((c) => c.id === id)!)
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [series, model]);

  const path = useMemo(() => {
    if (!series) return [];
    return sprtPath(series, model.universe, model.clusters);
  }, [series, model]);

  if (!series) return null;

  const lats = cases.map((c) => c.lat);
  const lngs = cases.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.04;
  const host = model.universe.districts.find((d) => d.id === cases[0]?.districtId);

  function xy(lat: number, lng: number) {
    const x = ((lng - minLng + pad) / (maxLng - minLng + 2 * pad)) * 100;
    const y = (1 - (lat - minLat + pad) / (maxLat - minLat + 2 * pad)) * 100;
    return { x, y };
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Planted series</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">Typed crime series</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Eighteen typed series plus four versatile burglary→CAW dockets. SAMHITA recovers tables
        from an empty caseload — the captured table is shown beside each planted series.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Series</CardTitle>
            <CardDescription>{model.universe.series.length} planted · SAMHITA tables overlaid</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[32rem] space-y-1 overflow-auto">
            {model.universe.series.map((s) => {
              const first = model.universe.cases.find((c) => c.id === s.caseIds[0]);
              const d = model.universe.districts.find((x) => x.id === first?.districtId);
              const active = s.id === series.id;
              const captured = first ? model.partition.labels[first.id] : undefined;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSid(s.id)}
                  className={
                    "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm " +
                    (active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary")
                  }
                >
                  <span>
                    <span className="font-mono text-xs">{s.id}</span>
                    <span className="ml-2">{d?.name}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {captured && <Badge variant={active ? "outline" : "mid"}>{captured}</Badge>}
                    {s.versatile && <Badge variant={active ? "outline" : "high"}>versatile</Badge>}
                    <Badge variant={active ? "outline" : TYPE_TONE[s.typology]}>
                      {TYPOLOGY_LABEL[s.typology]}
                    </Badge>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {series.id} · {TYPOLOGY_LABEL[series.typology]}
                {series.versatile ? " · versatile" : ""}
              </CardTitle>
              <CardDescription>
                {host?.name} · {CRIME_LABEL[series.kind]}
                {series.versatile ? " → CAW/rape" : ""} · {cases.length} FIRs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <svg viewBox="0 0 100 64" className="w-full rounded-lg bg-muted" role="img">
                <title>{`${series.id} path`}</title>
                {cases.slice(1).map((c, i) => {
                  const a = xy(cases[i]!.lat, cases[i]!.lng);
                  const b = xy(c.lat, c.lng);
                  return (
                    <line
                      key={c.id}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="currentColor"
                      strokeOpacity={0.45}
                      strokeWidth={0.6}
                    />
                  );
                })}
                {cases.map((c, i) => {
                  const p = xy(c.lat, c.lng);
                  return (
                    <g key={c.id}>
                      <circle cx={p.x} cy={p.y} r={1.6} fill="currentColor" />
                      <text
                        x={p.x + 2.2}
                        y={p.y + 1.1}
                        fontSize={3.2}
                        fill="currentColor"
                        opacity={0.7}
                      >
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SPRT walk</CardTitle>
              <CardDescription>Accumulated log-odds as each FIR joins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {path.map((p, i) => (
                <div
                  key={p.caseId}
                  className="flex min-h-11 items-center justify-between rounded-lg bg-muted px-3 text-sm"
                >
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="ml-2 font-mono">{p.caseId}</span>
                    <span className="ml-2 text-muted-foreground">
                      {p.date} · {CRIME_LABEL[p.kind]}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge
                      variant={p.decision === "open" ? "high" : p.decision === "hold" ? "mid" : "default"}
                    >
                      {SPRT_LABEL[p.decision]}
                    </Badge>
                    <span className="font-mono tabular-nums">{formatNum(p.logOdds, 2)}</span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
