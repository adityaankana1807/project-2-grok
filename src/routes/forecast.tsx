import { createFileRoute } from "@tanstack/react-router";
import { KindSelect } from "@/components/kind-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useModel } from "@/lib/indra/use-model";
import { monthLabel } from "@/lib/indra/scan";
import { useApp } from "@/lib/store";
import { formatNum, formatPct } from "@/lib/utils";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/forecast")({ component: ForecastPage });

function ForecastPage() {
  const kind = useApp((s) => s.kind);
  const setKind = useApp((s) => s.setKind);
  const selectDistrict = useApp((s) => s.selectDistrict);
  const { model } = useModel(kind);
  const origin = model.universe.months.length - 4;
  const next = model.forecast.filter((p) => p.monthIndex === origin + 1);
  const ranked = [...next].sort((a, b) => b.predicted - a.predicted).slice(0, 15);

  const byState = new Map<string, number>();
  for (const p of next) {
    const d = model.universe.districts.find((x) => x.id === p.districtId);
    if (!d) continue;
    byState.set(d.stateName, (byState.get(d.stateName) ?? 0) + p.predicted);
  }
  const stateBars = [...byState.entries()]
    .map(([name, predicted]) => ({ name: name.length > 14 ? name.slice(0, 12) + "…" : name, predicted }))
    .sort((a, b) => b.predicted - a.predicted)
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Look-ahead</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">Hotspot forecast</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        ST-lite rolls lag-1, seasonal lag-12, neighbours, festival intensity and monsoon one
        month forward from {monthLabel(model.universe.months, origin)}. Hit rate is the share of
        true top-decile districts recovered in the predicted top-decile. Forecast is a
        watch-list, not a linkage score — TRIVENI keeps them separate.
      </p>
      <div className="mt-5">
        <KindSelect value={kind} onChange={setKind} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Top-decile hit rate" value={formatPct(model.metrics.forecast.hitRate, 0)} />
        <Stat label="MAE" value={formatNum(model.metrics.forecast.mae, 2)} />
        <Stat label="Mean-naive MAE" value={formatNum(model.metrics.forecast.naiveMae, 2)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>State mass, next month</CardTitle>
            <CardDescription>Sum of district forecasts in the sample panel</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateBars} layout="vertical" margin={{ left: 16, right: 8 }}>
                <XAxis type="number" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} width={92} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="predicted" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Watch list</CardTitle>
            <CardDescription>Highest predicted district counts</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {ranked.map((p, i) => {
                const d = model.universe.districts.find((x) => x.id === p.districtId)!;
                const risk = model.risks.find((r) => r.districtId === p.districtId);
                return (
                  <li key={p.districtId}>
                    <button
                      type="button"
                      onClick={() => selectDistrict(p.districtId)}
                      className="flex w-full items-center justify-between gap-2 text-left text-sm"
                    >
                      <span className="truncate">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {d.name}
                        <span className="ml-2 text-xs text-muted-foreground">{d.stateName}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {risk && <Badge variant={risk.band}>{risk.band}</Badge>}
                        <span className="font-mono tabular-nums">{formatNum(p.predicted, 1)}</span>
                      </span>
                    </button>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 font-mono text-3xl tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
