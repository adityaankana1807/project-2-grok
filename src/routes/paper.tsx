import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useModel } from "@/lib/indra/use-model";
import { useApp } from "@/lib/store";
import { formatNum, formatPct } from "@/lib/utils";
import { EQUATIONS, PAPER, PRIOR_SYSTEMS, SECTIONS } from "@/lib/triveni-paper";

export const Route = createFileRoute("/paper")({ component: PaperPage });

function PaperPage() {
  const kind = useApp((s) => s.kind);
  const { model } = useModel(kind);
  const L = model.metrics.linkage;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{PAPER.venue}</p>
      <h1 className="mt-3 font-display text-3xl font-medium leading-tight md:text-4xl">
        {PAPER.title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {PAPER.authors}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {PAPER.keywords.map((k) => (
          <span
            key={k}
            className="rounded-full bg-muted px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            {k}
          </span>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl">Abstract</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{PAPER.abstract}</p>
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <LiveStat label="log-Λ AUC" value={formatNum(L.indraAuc, 3)} />
        <LiveStat label="Jaccard AUC" value={formatNum(L.jaccardAuc, 3)} />
        <LiveStat label="Recall@10" value={formatPct(L.recallAt10, 0)} />
        <LiveStat label="MRR" value={formatNum(L.mrr, 2)} />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Live on this seed, crime head {kind}, {L.nLinked} linked / {L.nUnlinked} unlinked pairs.
        Synthetic. Not a court exhibit.
      </p>

      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="mt-12">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{s.kicker}</p>
          <h2 className="mt-1 font-display text-2xl">{s.title}</h2>
          {s.body.map((para) => (
            <p key={para.slice(0, 48)} className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {para}
            </p>
          ))}
        </section>
      ))}

      <section className="mt-12">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">07 · Notation</p>
        <h2 className="mt-1 font-display text-2xl">Closed-form score</h2>
        <div className="mt-4 space-y-3">
          {EQUATIONS.map((eq) => (
            <Card key={eq.name}>
              <CardHeader>
                <CardTitle className="text-base">{eq.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed">{eq.tex}</pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">08 · Priors</p>
        <h2 className="mt-1 font-display text-2xl">Four repositories, one hole</h2>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Fusion compared</CardTitle>
            <CardDescription>Read from the public GitHub trees, not from marketing copy</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">System</th>
                  <th className="font-medium">Fusion</th>
                  <th className="font-medium">India</th>
                  <th className="font-medium">Gap</th>
                </tr>
              </thead>
              <tbody>
                {PRIOR_SYSTEMS.map((p) => (
                  <tr key={p.name} className="border-t border-border align-top">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{p.repo}</div>
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
      </section>
    </article>
  );
}

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl tabular-nums">{value}</div>
    </div>
  );
}
