import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CRIME_LABEL, TYPOLOGY_LABEL, type Typology } from "@/lib/indra/types";
import { scorePair } from "@/lib/indra/linkage";
import { useModel } from "@/lib/indra/use-model";
import { useApp } from "@/lib/store";
import { formatNum } from "@/lib/utils";
import { haversineKm } from "@/lib/geo/project";

export const Route = createFileRoute("/series")({ component: SeriesPage });

const TONE: Record<Typology, string> = {
  forager: "var(--color-risk)",
  marauder: "var(--color-primary)",
  commuter: "var(--color-safe)",
};

function SeriesPage() {
  const kind = useApp((s) => s.kind);
  const { model } = useModel(kind);
  const series = model.universe.series;
  const [sid, setSid] = useState(series[0]?.id ?? "");
  const active = series.find((s) => s.id === sid) ?? series[0];

  const cases = useMemo(() => {
    if (!active) return [];
    return active.caseIds
      .map((id) => model.universe.cases.find((c) => c.id === id)!)
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [active, model]);

  const pairs = useMemo(() => {
    const out = [];
    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        out.push(scorePair(cases[i]!, cases[j]!, model.risks, model.clusters));
      }
    }
    return out.sort((a, b) => b.logLr - a.logLr);
  }, [cases, model]);

  const spanKm =
    cases.length < 2
      ? 0
      : Math.max(
          ...cases.flatMap((a) => cases.map((b) => haversineKm(a.lat, a.lng, b.lat, b.lng))),
        );

  const counts = { forager: 0, marauder: 0, commuter: 0 };
  for (const s of series) counts[s.typology] += 1;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Planted graph</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">Typed crime series</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Eighteen series, six of each typology, with matching spatial jitter. ST-SAGE planted
        marauders only; TRIVENI plants the mixture so a 60 km pair can still be a commuter.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Forager series" value={String(counts.forager)} hint="d0 ≈ 1.8 km" />
        <Stat label="Marauder series" value={String(counts.marauder)} hint="d0 12 / 35 km" />
        <Stat label="Commuter series" value={String(counts.commuter)} hint="NH/SH 52–88 km" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Series</CardTitle>
            <CardDescription>{series.length} planted, 4–7 events each</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {series.map((s) => {
              const host = model.universe.cases.find((c) => c.id === s.caseIds[0]);
              const d = host
                ? model.universe.districts.find((x) => x.id === host.districtId)
                : null;
              const on = active?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSid(s.id)}
                  className={
                    "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm " +
                    (on ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary")
                  }
                >
                  <span>
                    <span className="font-mono text-xs">{s.id}</span>
                    <span className="ml-2">{d?.name}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs">
                    <Badge variant={on ? "outline" : s.typology === "forager" ? "high" : s.typology === "commuter" ? "low" : "mid"}>
                      {TYPOLOGY_LABEL[s.typology]}
                    </Badge>
                    {CRIME_LABEL[s.kind]}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {active && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {active.id} · {TYPOLOGY_LABEL[active.typology]}
                </CardTitle>
                <CardDescription>
                  {CRIME_LABEL[active.kind]} · {cases.length} events · span {formatNum(spanKm, 0)} km
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SeriesMap cases={cases} typology={active.typology} />
              </CardContent>
            </Card>
          )}

          {active && (
            <Card>
              <CardHeader>
                <CardTitle>Within-series log Λ</CardTitle>
                <CardDescription>Every pair scored with SAE clusters in the mix</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {pairs.slice(0, 8).map((p) => (
                  <div key={`${p.a}-${p.b}`} className="flex items-baseline justify-between text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.a} · {p.b}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatNum(p.logLr, 2)}
                      <span className="ml-2 text-[11px] text-muted-foreground">
                        D {formatNum(p.desh, 1)} · K {formatNum(p.kaal, 1)} · R {formatNum(p.riti, 1)}
                      </span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SeriesMap({
  cases,
  typology,
}: {
  cases: { id: string; lat: number; lng: number; date: string }[];
  typology: Typology;
}) {
  if (cases.length === 0) return null;
  const lats = cases.map((c) => c.lat);
  const lngs = cases.map((c) => c.lng);
  const minLat = Math.min(...lats) - 0.04;
  const maxLat = Math.max(...lats) + 0.04;
  const minLng = Math.min(...lngs) - 0.04;
  const maxLng = Math.max(...lngs) + 0.04;
  const dx = Math.max(maxLng - minLng, 0.08);
  const dy = Math.max(maxLat - minLat, 0.08);
  const pts = cases.map((c) => ({
    ...c,
    x: ((c.lng - minLng) / dx) * 100,
    y: ((maxLat - c.lat) / dy) * 100,
  }));
  const stroke = TONE[typology];

  return (
    <svg viewBox="0 0 100 62" className="h-56 w-full rounded-lg bg-muted" role="img" aria-label="Series path">
      {pts.slice(1).map((p, i) => (
        <line
          key={`${pts[i]!.id}-${p.id}`}
          x1={pts[i]!.x}
          y1={pts[i]!.y * 0.62}
          x2={p.x}
          y2={p.y * 0.62}
          stroke={stroke}
          strokeWidth="0.6"
          opacity="0.7"
        />
      ))}
      {pts.map((p, i) => (
        <g key={p.id}>
          <circle cx={p.x} cy={p.y * 0.62} r="1.8" fill={stroke} />
          <text
            x={p.x + 2.2}
            y={p.y * 0.62 + 1.2}
            fill="var(--color-foreground)"
            fontSize="3.2"
            fontFamily="var(--font-mono)"
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 font-mono text-3xl tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
