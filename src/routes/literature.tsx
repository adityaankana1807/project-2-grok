import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PAPERS } from "@/lib/data/papers";

export const Route = createFileRoute("/literature")({ component: LiteraturePage });

function LiteraturePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Corpus</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">
        What the Drive folder taught INDRA
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Twenty-two papers on crime linkage, space–time clustering, near-repeats and Indian
        CAW. Each stage of the nest cites a source; the India-specific pieces (SAE districts,
        rape-cluster persistence, IFS from Dibrugarh, festival kernels, dark figure) are what
        make this a new algorithm rather than a dashboard over someone else’s method.
      </p>
      <ol className="mt-8 space-y-3">
        {PAPERS.map((p, i) => (
          <li key={p.title}>
            <Card>
              <CardHeader>
                <p className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")} · {p.year}
                </p>
                <CardTitle className="text-base leading-snug">{p.title}</CardTitle>
                <CardDescription>
                  {p.authors} · feeds {p.feeds}
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
