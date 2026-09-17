import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KindSelect } from "@/components/kind-select";
import { MO_LABEL, TYPOLOGY_LABEL } from "@/lib/indra/types";
import { displayProb, explainScore, rankAgainst, saturateLr } from "@/lib/indra/linkage";
import { useModel } from "@/lib/indra/use-model";
import { useApp } from "@/lib/store";
import { formatNum } from "@/lib/utils";
import { haversineKm } from "@/lib/geo/project";

export const Route = createFileRoute("/linkage")({ component: LinkagePage });

function LinkagePage() {
  const kind = useApp((s) => s.kind);
  const setKind = useApp((s) => s.setKind);
  const selectedCaseId = useApp((s) => s.selectedCaseId);
  const selectCase = useApp((s) => s.selectCase);
  const { model } = useModel(kind);
  const [q, setQ] = useState("");

  const pool = useMemo(() => {
    return model.universe.cases
      .filter((c) => c.kind === kind)
      .filter((c) => {
        if (!q) return true;
        const d = model.universe.districts.find((x) => x.id === c.districtId);
        const hay = `${c.id} ${d?.name} ${c.seriesId ?? ""} ${c.date} ${c.statute} ${c.narrative}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [model, kind, q]);

  const target = pool.find((c) => c.id === selectedCaseId) ?? pool.find((c) => c.seriesId) ?? pool[0];
  const ranks = useMemo(() => {
    if (!target) return [];
    return rankAgainst(target, model.universe, model.risks, model.clusters).slice(0, 12);
  }, [target, model]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Workbench</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">Likelihood-ratio linkage</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Eighteen planted series — forager, marauder, commuter — sit inside the synthetic
        caseload. Pick an index offence. TRIVENI ranks SAE-blocked candidates by log Λ, not by
        a blended similarity. Jaccard is the literature baseline.
      </p>
      <div className="mt-5">
        <KindSelect value={kind} onChange={setKind} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Index case</CardTitle>
            <CardDescription>{pool.length} {kind} cases in the window</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search id, district, series, statute…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="max-h-[28rem] space-y-1 overflow-auto pr-1">
              {pool.slice(0, 80).map((c) => {
                const d = model.universe.districts.find((x) => x.id === c.districtId);
                const active = target?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCase(c.id)}
                    className={
                      "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm " +
                      (active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary")
                    }
                  >
                    <span className="truncate">
                      <span className="font-mono text-xs">{c.id}</span>
                      <span className="ml-2">{d?.name}</span>
                    </span>
                    <span className="ml-2 flex items-center gap-2 text-xs">
                      {c.seriesId && <Badge variant={active ? "outline" : "high"}>{c.seriesId}</Badge>}
                      <span className="font-mono tabular-nums">{c.date}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {target && (
            <Card>
              <CardHeader>
                <CardTitle>Ranked against {target.id}</CardTitle>
                <CardDescription>
                  {model.universe.districts.find((d) => d.id === target.districtId)?.name} · {target.date}
                  {" · "}
                  {target.statute}
                  {target.seriesId
                    ? ` · planted ${target.seriesId} (${target.typology ? TYPOLOGY_LABEL[target.typology] : "typed"})`
                    : " · singleton"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ranks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No blocked candidates in this window.</p>
                )}
                {ranks.map((s, i) => {
                  const other = model.universe.cases.find((c) => c.id === s.b)!;
                  const d = model.universe.districts.find((x) => x.id === other.districtId);
                  const km = haversineKm(target.lat, target.lng, other.lat, other.lng);
                  return (
                    <div key={s.b} className="rounded-lg bg-muted p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="text-sm">
                          <span className="font-mono text-xs text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="ml-2 font-medium">{other.id}</span>
                          <span className="ml-2 text-muted-foreground">
                            {d?.name} · {formatNum(km, 0)} km · {other.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.linked && <Badge variant="high">true link</Badge>}
                          <span className="font-mono text-sm tabular-nums">
                            log Λ {formatNum(s.logLr, 2)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{explainScore(s)}</p>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground sm:grid-cols-4">
                        <LrBar label="Desh" v={s.desh} />
                        <LrBar label="Kaal" v={s.kaal} />
                        <LrBar label="Riti" v={s.riti} />
                        <LrBar label="Patch" v={s.patch} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        <span>support {formatNum(displayProb(s.logLr), 2)}</span>
                        <span>Jaccard {formatNum(s.jaccard, 2)}</span>
                        <span>
                          mix F{formatNum(s.mix.forager, 2)} M{formatNum(s.mix.marauder, 2)} C
                          {formatNum(s.mix.commuter, 2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {target && (
            <Card>
              <CardHeader>
                <CardTitle>MO encoding</CardTitle>
                <CardDescription>
                  Hesitancy π is missingness, not absence · {target.narrative}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="py-1 font-medium">Feature</th>
                        <th className="font-medium">Value</th>
                        <th className="font-medium">μ</th>
                        <th className="font-medium">ν</th>
                        <th className="font-medium">π</th>
                      </tr>
                    </thead>
                    <tbody>
                      {target.features.map((f) => (
                        <tr key={f.key} className="border-t border-border">
                          <td className="py-1.5">{MO_LABEL[f.key]}</td>
                          <td className="font-mono">{f.value ?? "unknown"}</td>
                          <td className="font-mono tabular-nums">{f.ifs.mu.toFixed(2)}</td>
                          <td className="font-mono tabular-nums">{f.ifs.nu.toFixed(2)}</td>
                          <td className="font-mono tabular-nums">{f.ifs.pi.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function LrBar({ label, v }: { label: string; v: number }) {
  const sat = saturateLr(v);
  return (
    <div>
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{formatNum(v, 2)}</span>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-background">
        <div className="h-full bg-accent" style={{ width: `${Math.round(sat * 100)}%` }} />
      </div>
    </div>
  );
}
