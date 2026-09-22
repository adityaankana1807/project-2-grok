import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { explainStep } from "@/lib/indra/samhita";
import { CRIME_LABEL } from "@/lib/indra/types";
import { useModel } from "@/lib/indra/use-model";
import { formatNum } from "@/lib/utils";

export const Route = createFileRoute("/linkage")({ component: StreamPage });

function StreamPage() {
  const { model } = useModel("caw");
  const part = model.partition;
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(part.steps[Math.min(12, part.steps.length - 1)]?.caseId ?? "");

  const steps = useMemo(() => {
    const needle = q.toLowerCase();
    return part.steps.filter((s) => {
      if (!needle) return true;
      const rec = model.universe.cases.find((c) => c.id === s.caseId);
      const d = model.universe.districts.find((x) => x.id === rec?.districtId);
      return `${s.caseId} ${s.tableId} ${s.trueSeries ?? ""} ${d?.name}`.toLowerCase().includes(needle);
    });
  }, [part.steps, q, model.universe]);

  const step = part.steps.find((s) => s.caseId === sel) ?? steps[0];
  const rec = step ? model.universe.cases.find((c) => c.id === step.caseId) : undefined;
  const place = rec ? model.universe.districts.find((d) => d.id === rec.districtId) : undefined;
  const table = step ? part.tables.find((t) => t.id === step.tableId) : undefined;
  const mates = (table?.caseIds ?? [])
    .map((id) => model.universe.cases.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Workbench</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">Compile the stream</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {part.metrics.nPool} FIRs in date order — 22 planted series plus 80 matched singletons.
        SAMHITA sits each one at a table or opens a new one. ARI {formatNum(part.metrics.ari, 2)}{" "}
        vs SPRT-greedy {formatNum(part.metrics.greedyAri, 2)}.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Chronological FIRs</CardTitle>
            <CardDescription>
              {part.metrics.nTables} tables after the last seat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search id, table, series, district…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="max-h-[32rem] space-y-1 overflow-auto pr-1">
              {steps.map((s) => {
                const c = model.universe.cases.find((x) => x.id === s.caseId);
                const d = model.universe.districts.find((x) => x.id === c?.districtId);
                const active = step?.caseId === s.caseId;
                return (
                  <button
                    key={s.caseId}
                    type="button"
                    onClick={() => setSel(s.caseId)}
                    className={
                      "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm " +
                      (active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary")
                    }
                  >
                    <span className="truncate">
                      <span className="font-mono text-xs">{s.caseId}</span>
                      <span className="ml-2">{d?.name}</span>
                    </span>
                    <span className="ml-2 flex items-center gap-2 text-xs">
                      <Badge variant={s.action === "new" ? "high" : active ? "outline" : "mid"}>
                        {s.action === "new" ? "new" : "join"} {s.tableId}
                      </Badge>
                      {s.trueSeries && (
                        <Badge variant={active ? "outline" : "low"}>{s.trueSeries}</Badge>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {step && rec && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {step.action === "new" ? "Opened" : "Joined"} {step.tableId}
                </CardTitle>
                <CardDescription>
                  {place?.name} · {rec.date} · {rec.statute}
                  {step.trueSeries ? ` · gold ${step.trueSeries}` : " · singleton"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{explainStep(step)}</p>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <Stat k="log-post" v={formatNum(step.logPost, 2)} />
                  <Stat k="log α" v={formatNum(step.logNew, 2)} />
                  <Stat k="log BF" v={formatNum(step.logBf, 2)} />
                  <Stat k="δ̄" v={formatNum(step.dark, 2)} />
                </div>
              </CardContent>
            </Card>
          )}

          {table && (
            <Card>
              <CardHeader>
                <CardTitle>Table {table.id}</CardTitle>
                <CardDescription>{table.caseIds.length} FIRs seated here</CardDescription>
              </CardHeader>
              <CardContent className="max-h-80 space-y-1 overflow-auto">
                {mates.map((c) => {
                  if (!c) return null;
                  const d = model.universe.districts.find((x) => x.id === c.districtId);
                  return (
                    <div
                      key={c.id}
                      className="flex min-h-11 items-center justify-between rounded-lg bg-muted px-3 text-sm"
                    >
                      <span>
                        <span className="font-mono text-xs">{c.id}</span>
                        <span className="ml-2">{d?.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c.date} · {CRIME_LABEL[c.kind]}
                        {c.seriesId ? ` · ${c.seriesId}` : ""}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-1 font-mono text-lg tabular-nums">{v}</div>
    </div>
  );
}
