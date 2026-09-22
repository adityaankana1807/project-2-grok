import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PAPERS } from "@/lib/data/papers";
import { PRIOR_SYSTEMS } from "@/lib/samhita-paper";

export const Route = createFileRoute("/literature")({ component: LiteraturePage });

function LiteraturePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Corpus</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">
        Drive folder, six priors, one compiler
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Twenty-two papers on crime linkage, space–time clustering, near-repeats and Indian CAW.
        Each SAMHITA channel cites a source. The six prior GitHub systems used the same corpus
        and still scored pairs or joined a known docket. SAMHITA compiles tables from an empty
        caseload.
      </p>

      <div className="mt-8 grid gap-3">
        {PRIOR_SYSTEMS.map((p) => (
          <Card key={p.name}>
            <CardHeader>
              <CardTitle className="text-base">{p.name}</CardTitle>
              <CardDescription className="font-mono text-[11px]">{p.repo}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="text-foreground">Fusion.</span> {p.fusion}
              </p>
              <p>
                <span className="text-foreground">India.</span> {p.india}
              </p>
              <p>
                <span className="text-foreground">Gap.</span> {p.gap}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ol className="mt-10 space-y-3">
        {PAPERS.map((p, i) => (
          <li key={p.title}>
            <Card>
              <CardHeader>
                <p className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")} · {p.year}
                </p>
                <CardTitle className="text-base leading-snug">{p.title}</CardTitle>
                <CardDescription>
                  {p.authors} · {p.feeds}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.summary}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
