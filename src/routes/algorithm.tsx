import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KindSelect } from "@/components/kind-select";
import { useApp } from "@/lib/store";
import { useModel } from "@/lib/indra/use-model";
import { formatNum, formatPct } from "@/lib/utils";
import { PRIOR_SYSTEMS } from "@/lib/samhita-paper";
import { SAMHITA_CONC, SAMHITA_HALF_LIFE } from "@/lib/indra/samhita";

export const Route = createFileRoute("/algorithm")({ component: AlgorithmPage });

const STAGES = [
  {
    n: "01",
    title: "Chinese-restaurant compiler",
    source: "Infinite tables · not a pair, not a known docket",
    body: "FIRs arrive in date order. Each sits at an existing table with probability proportional to occupancy × join Bayes factor, or opens a new table with concentration α. ANVAYA needed S to exist. SAMHITA starts empty.",
    formula: "P(join T) ∝ n_T · δ̄_T · BF(q → T),   P(new) ∝ α",
  },
  {
    n: "02",
    title: "Dark-figure occupancy",
    source: "NFHS-5 · unique to SAMHITA",
    body: "ANVAYA dilated the clock. SAMHITA inflates the table. A Bihar series thinned by δ = 3.2 looks like a singleton to a raw CRP; n_eff = n · δ̄ puts it back on the menu. Kerala (1.35) is not scored as Bihar.",
    formula: "n_eff = n_T · mean(δ_NFHS of members)",
  },
  {
    n: "03",
    title: "Modus drift",
    source: "140-day half-life on Dirichlet counts",
    body: "Versatile burglary→CAW is not a family table. Old MO counts decay as exp(−Δt / 140). The prototype follows the offender; it does not freeze the first two burglaries.",
    formula: `w_i = exp(−Δt_i / ${SAMHITA_HALF_LIFE} d)`,
  },
  {
    n: "04",
    title: "MAP seat, ARI score",
    source: "Partition of a mixed pool",
    body: "Join if log n_eff + log BF > log α, else open. Headline metric is Adjusted Rand Index against gold series/singleton labels, not Hit@1 on a planted docket. The foil is ANVAYA’s SPRT used as a greedy partitioner.",
    formula: `α = ${SAMHITA_CONC} · join if log n_eff + log BF > log α`,
  },
];

function AlgorithmPage() {
  const kind = useApp((s) => s.kind);
  const setKind = useApp((s) => s.setKind);
  const { model } = useModel(kind);
  const L = model.metrics.linkage;
  const F = model.metrics.forecast;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Methods</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">SAMHITA compiler</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Six prior systems on this corpus score pairs or join a known series. SAMHITA compiles
        an unknown number of tables. ARI on a mixed pool is the headline, not pairwise AUC.
      </p>

      <div className="mt-6">
        <KindSelect value={kind} onChange={setKind} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Metric
          label="Partition ARI"
          value={formatNum(L.ari, 3)}
          sub={`SPRT-greedy foil ${formatNum(L.greedyAri, 3)} · ${L.nPool} FIRs`}
        />
        <Metric
          label="Series recovered"
          value={formatPct(L.recoveredSeries, 0)}
          sub={`${L.nTables} tables · singleton precision ${formatNum(L.singletonPrecision, 2)}`}
        />
        <Metric
          label="Over / under-seg"
          value={`${formatNum(L.overSeg, 2)} / ${formatNum(L.underSeg, 2)}`}
          sub="Split series · merged series"
        />
        <Metric
          label="Forecast top-decile hit"
          value={formatPct(F.hitRate, 0)}
          sub={`MAE ${formatNum(F.mae, 2)} vs mean-naive ${formatNum(F.naiveMae, 2)}`}
        />
      </div>

      <ol className="mt-10 space-y-4">
        {STAGES.map((s) => (
          <li key={s.n}>
            <Card>
              <CardHeader>
                <p className="font-mono text-xs text-muted-foreground">{s.n}</p>
                <CardTitle>{s.title}</CardTitle>
                <CardDescription>{s.source}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{s.body}</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
                  {s.formula}
                </pre>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Prior systems</CardTitle>
          <CardDescription>What each repo actually fuses</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">System</th>
                <th className="font-medium">Fusion</th>
                <th className="font-medium">Hole</th>
              </tr>
            </thead>
            <tbody>
              {PRIOR_SYSTEMS.map((p) => (
                <tr key={p.name} className="border-t border-border">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="text-muted-foreground">{p.fusion}</td>
                  <td className="text-muted-foreground">{p.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 font-mono text-3xl tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
