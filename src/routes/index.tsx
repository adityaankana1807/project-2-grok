import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { IndiaMap } from "@/components/india-map";
import { KindSelect } from "@/components/kind-select";
import { MonthSlider } from "@/components/month-slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { atlasView } from "@/lib/indra/engine";
import { monthLabel } from "@/lib/indra/scan";
import { CRIME_LABEL } from "@/lib/indra/types";
import { useModel, useUniverse } from "@/lib/indra/use-model";
import { useApp } from "@/lib/store";
import { formatInt, formatNum } from "@/lib/utils";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/")({ component: Atlas });

function Atlas() {
  const kind = useApp((s) => s.kind);
  const setKind = useApp((s) => s.setKind);
  const monthIndex = useApp((s) => s.monthIndex);
  const setMonth = useApp((s) => s.setMonth);
  const selectedId = useApp((s) => s.selectedDistrictId);
  const selectDistrict = useApp((s) => s.selectDistrict);
  const viewMode = useApp((s) => s.viewMode);
  const setViewMode = useApp((s) => s.setViewMode);
  const { model } = useModel(kind);
  const universe = useUniverse();

  const origin = Math.min(monthIndex, universe.months.length - 1);
  const view = useMemo(
    () => atlasView(universe, kind, origin),
    [universe, kind, origin],
  );
  const { risks, clusters, moran, highCount } = view;
  const linkage = model.metrics.linkage;
  const selected = universe.districts.find((d) => d.id === selectedId) ?? null;
  const selectedRisk = risks.find((r) => r.districtId === selectedId);

  const national = useMemo(() => {
    return universe.months.map((m) => {
      let count = 0;
      let expected = 0;
      for (const c of universe.cells) {
        if (c.monthIndex === m.index) {
          count += c.counts[kind];
          expected += c.expected[kind];
        }
      }
      return { i: m.index, label: `${m.month}/${String(m.year).slice(2)}`, count, expected };
    });
  }, [universe, kind]);

  const top = [...risks].sort((a, b) => b.rr - a.rr).slice(0, 8);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Command atlas
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight md:text-4xl">
            Indian forensic case linkage
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            TRIVENI scores a pair as a typology-mixed likelihood ratio — desh, kaal, riti,
            patch — under FIR missingness, the IPC→BNS flip, and NCRB-calibrated district risk.
            Not a UK model with the labels swapped.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Kpi label="Moran's I" value={formatNum(moran, 2)} />
          <Kpi label="High-risk districts" value={String(highCount)} />
          <Kpi
            label="log-Λ AUC"
            value={formatNum(linkage.indraAuc, 2)}
            hint={`Jaccard ${formatNum(linkage.jaccardAuc, 2)}`}
          />
          <Kpi
            label="Recall@10"
            value={formatNum(linkage.recallAt10, 2)}
            hint={`MRR ${formatNum(linkage.mrr, 2)}`}
          />
        </div>
      </div>

      <KindSelect value={kind} onChange={setKind} />

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Card className="overflow-hidden p-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {CRIME_LABEL[kind]} · 12-month SAE window ending {monthLabel(universe.months, origin)}
            </p>
            <div className="flex gap-1">
              {(
                [
                  ["rr", "SAE RR"],
                  ["sir", "Raw SIR"],
                  ["dark", "Dark-figure"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewMode(id)}
                  className={
                    viewMode === id
                      ? "h-11 rounded-md bg-primary px-2.5 text-xs text-primary-foreground"
                      : "h-11 rounded-md px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <IndiaMap
            districts={universe.districts}
            risks={risks}
            clusters={clusters}
            selectedId={selectedId}
            onSelect={(id) => selectDistrict(id === selectedId ? null : id)}
            metric={viewMode}
          />
          <div className="px-3 pb-3">
            <MonthSlider months={universe.months} value={origin} onChange={setMonth} />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{selected ? selected.name : "Select a district"}</CardTitle>
              <CardDescription>
                {selected
                  ? `${selected.stateName} · ${selected.zone}`
                  : "Tap a marker on the atlas."}
              </CardDescription>
            </CardHeader>
            {selected && selectedRisk && (
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedRisk.band}>{selectedRisk.band} risk</Badge>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    RR {formatNum(selectedRisk.rr, 2)}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <Row k="Observed (12 mo)" v={formatInt(selectedRisk.observed)} />
                  <Row k="Expected" v={formatNum(selectedRisk.expected, 1)} />
                  <Row k="SIR" v={formatNum(selectedRisk.sir, 2)} />
                  <Row k="Dark-figure RR" v={formatNum(selectedRisk.rrDark, 2)} />
                  <Row k="Persistence" v={formatNum(selectedRisk.persistence, 2)} />
                  <Row k="Sex ratio" v={String(selected.sexRatio)} />
                  <Row k="Female literacy" v={`${selected.femLit}%`} />
                  <Row k="Density" v={formatInt(selected.density)} />
                </dl>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scan clusters</CardTitle>
              <CardDescription>Kulldorff-lite, last 24 months of this window</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {clusters.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No significant cylinders in this window.
                </p>
              )}
              {clusters.slice(0, 5).map((c) => {
                const center = universe.districts.find((d) => d.id === c.centerId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectDistrict(c.centerId)}
                    className="flex min-h-11 w-full items-center justify-between rounded-lg bg-muted px-3 py-2 text-left text-sm"
                  >
                    <span>
                      <span className="font-medium">{center?.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {c.districtIds.length} districts · {c.radiusKm} km
                      </span>
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      LLR {formatNum(c.llr, 1)}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>National synthetic series</CardTitle>
            <CardDescription>Sampled district panel, not all-India census of cases</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={national} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} interval={5} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} width={36} />
                <RTooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    color: "var(--color-foreground)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" fill="color-mix(in oklab, var(--color-primary) 18%, transparent)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Highest relative risk</CardTitle>
            <CardDescription>Empirical-Bayes + CAR smoother</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {top.map((r, i) => {
                const d = universe.districts.find((x) => x.id === r.districtId)!;
                return (
                  <li key={r.districtId}>
                    <button
                      type="button"
                      onClick={() => selectDistrict(r.districtId)}
                      className="flex min-h-11 w-full items-baseline justify-between gap-2 text-left text-sm"
                    >
                      <span className="truncate">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {d.name}
                      </span>
                      <span className="font-mono tabular-nums">{formatNum(r.rr, 2)}</span>
                    </button>
                    {i < top.length - 1 && <Separator className="mt-2" />}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-[7.5rem]">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-xl tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono tabular-nums text-right">{v}</dd>
    </>
  );
}
