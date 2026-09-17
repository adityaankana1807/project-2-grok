import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KindSelect } from "@/components/kind-select";
import { useApp } from "@/lib/store";
import { useModel } from "@/lib/indra/use-model";
import { formatNum, formatPct } from "@/lib/utils";
import { EQUATIONS, PRIOR_SYSTEMS, STREAMS } from "@/lib/triveni-paper";

export const Route = createFileRoute("/algorithm")({ component: AlgorithmPage });

function AlgorithmPage() {
  const kind = useApp((s) => s.kind);
  const setKind = useApp((s) => s.setKind);
  const { model } = useModel(kind);
  const L = model.metrics.linkage;
  const F = model.metrics.forecast;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Methods</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">
        The TRIVENI mixture
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        A forensic likelihood ratio mixed over forager, marauder and commuter kernels. Four
        streams — desh, kaal, riti, patch — and a saturating copula so space and time are not
        counted twice as a Hawkes near-repeat. Closed-form. Inspectable.
      </p>

      <div className="mt-6">
        <KindSelect value={kind} onChange={setKind} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Metric
          label="log-Λ AUC"
          value={formatNum(L.indraAuc, 3)}
          sub={`Jaccard ${formatNum(L.jaccardAuc, 3)} · IFS ${formatNum(L.ifsAuc, 3)}`}
        />
        <Metric
          label="Recall@10"
          value={formatPct(L.recallAt10, 0)}
          sub={`MRR ${formatNum(L.mrr, 2)} · ${L.nLinked} linked pairs`}
        />
        <Metric
          label="Top-100 precision"
          value={formatPct(L.top100Indra, 0)}
          sub={`Jaccard ${formatPct(L.top100Jaccard, 0)}`}
        />
        <Metric
          label="Median first rank"
          value={String(L.medianFirstRankIndra)}
          sub={`Jaccard ${L.medianFirstRankJaccard} · forecast hit ${formatPct(F.hitRate, 0)}`}
        />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Mixture LR</CardTitle>
          <CardDescription>What a pair actually scores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {EQUATIONS.map((eq) => (
            <div key={eq.name}>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{eq.name}</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
                {eq.tex}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <ol className="mt-8 space-y-4">
        {STREAMS.map((s, i) => (
          <li key={s.id}>
            <Card>
              <CardHeader>
                <p className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
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
          <CardTitle>Against the four priors</CardTitle>
          <CardDescription>Same Drive corpus, different fusion</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">System</th>
                <th className="font-medium">Fusion</th>
                <th className="font-medium">India-specific</th>
                <th className="font-medium">Gap TRIVENI closes</th>
              </tr>
            </thead>
            <tbody>
              {PRIOR_SYSTEMS.map((p) => (
                <tr key={p.name} className="border-t border-border">
                  <td className="py-2 font-medium">
                    {p.name}
                    <div className="font-mono text-[10px] font-normal text-muted-foreground">{p.repo}</div>
                  </td>
                  <td className="pr-3">{p.fusion}</td>
                  <td className="pr-3">{p.india}</td>
                  <td>{p.gap}</td>
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
