import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KindSelect } from "@/components/kind-select";
import { useApp } from "@/lib/store";
import { useModel } from "@/lib/indra/use-model";
import { formatNum, formatPct } from "@/lib/utils";

export const Route = createFileRoute("/algorithm")({ component: AlgorithmPage });

const STAGES = [
  {
    n: "01",
    title: "Small-area relative risk",
    source: "Pooja, Guddattu & Rao 2024 · BYM SAE",
    body: "District SIRs are shrunk with population-weighted empirical Bayes, then smoothed on a k-nearest neighbour graph (CAR stand-in for the Besag–York–Mollié pair). High / mid / low bands at 1.1 and 0.9 match the paper.",
    formula: "r̂ᵢ = mᵢ SIRᵢ + (1 − mᵢ) μ,   mᵢ = Eᵢ / (Eᵢ + k)   then   r ← 0.62 r + 0.38 Ū_N(i)",
  },
  {
    n: "02",
    title: "Space–time scan",
    source: "Mathews, Binu & Guddattu 2024 · Kulldorff Poisson",
    body: "Circular windows of 80 and 180 km with 3-month cylinders. The log-likelihood ratio flags persistent clusters in the Central, Northern and Eastern belts — the same geography the rape-cluster paper found in 2011–2020 NCRB.",
    formula: "LLR = O_in log(O_in / E_in) + O_out log(O_out / E_out) − O log(O / E)",
  },
  {
    n: "03",
    title: "India calendar prior",
    source: "Unique to INDRA",
    body: "Holi, Diwali, Navratri/Durga Puja, monsoon (Jun–Sep) and the 2020–21 lockdown dip modulate both generation and linkage τ. Festival windows stretch the temporal kernel by 1.55 — UK series models have no equivalent.",
    formula: "τ* = τ · 1.55  if  festival(i) = festival(j),   τ = 10 days",
  },
  {
    n: "04",
    title: "Near-repeat forager",
    source: "Borg & Svensson 2022 · optimal-forager patches",
    body: "Knox-style space–time interaction plus a highway-corridor boost when two events share a lat or lng belt (NH/SH commuting). Near-repeat burglaries are treated as a different generative class from isolated ones.",
    formula: "S_for = exp(−d / 1.6 km) · exp(−Δt / 8 d) · 1.12_corridor",
  },
  {
    n: "05",
    title: "Intuitionistic-fuzzy linkage",
    source: "Dutta & Banik 2024 · Tonkin et al. 2025",
    body: "Each MO field is (μ, ν, π). Unknown FIR fields are high-π, not zeroes — Jaccard would treat double-missing as a match. INDRA’s S_IFS uses hesitancy and a signed (μ − ν) term, then rarity-weights acid / firearm / climb.",
    formula: "S_IFS = (2 − |Δμ| − |Δν|) / (2 + |Δπ|) · (1 − 0.25 |Δ(μ − ν)|)",
  },
  {
    n: "06",
    title: "ST-lite forecast",
    source: "Shahmoradi et al. 2025 · closed-form cousin",
    body: "Next-month district count from lag-1, lag-12, neighbour mean, festival intensity and monsoon. No GPU, no black box — inspectable coefficients for a methods lab.",
    formula: "ŷ_{t+1} = 0.46 y_t + 0.22 y_{t−12} + 0.14 ȳ_N + 1.4 (f − 1) + 0.6 (m − 1)",
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
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">The INDRA nest</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Six stages, each taken from the papers in your Drive folder and retuned to Indian
        districts, NCRB heads, NFHS covariates and the festival calendar. Nothing here is a
        copy of a UK or Chicago model with the labels swapped.
      </p>

      <div className="mt-6">
        <KindSelect value={kind} onChange={setKind} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Metric
          label="INDRA linkage AUC"
          value={formatNum(L.indraAuc, 3)}
          sub={`Jaccard baseline ${formatNum(L.jaccardAuc, 3)}`}
        />
        <Metric
          label="Top-100 precision"
          value={formatPct(L.top100Indra, 0)}
          sub={`Jaccard ${formatPct(L.top100Jaccard, 0)} · ${L.nLinked} linked pairs`}
        />
        <Metric
          label="Median first rank"
          value={String(L.medianFirstRankIndra)}
          sub={`Jaccard ${L.medianFirstRankJaccard}`}
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
          <CardTitle>Nested score</CardTitle>
          <CardDescription>How the stages combine for a case pair</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
{`L(i,j) = 0.26 S_geo + 0.16 S_time + 0.34 S_IFS + 0.12 S_risk + 0.12 S_forager
S_geo  = exp(−d / d0)     d0 = 12 km urban / 35 km rural
S_time = exp(−Δt / τ*)    τ* festival-stretched
S_risk = exp(−|log rᵢ − log rⱼ|)`}
          </pre>
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
