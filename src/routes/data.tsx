import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STATES } from "@/lib/data/states";
import { useModel, useUniverse } from "@/lib/indra/use-model";
import { useApp } from "@/lib/store";
import { formatInt, formatNum } from "@/lib/utils";

export const Route = createFileRoute("/data")({ component: DataPage });

function DataPage() {
  const kind = useApp((s) => s.kind);
  const { model } = useModel(kind);
  const universe = useUniverse();

  function download(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function districtCsv() {
    const header = "id,name,state,zone,lat,lng,pop_lakh,sex_ratio,fem_lit,density,urban,rr,sir,observed,expected\n";
    const rows = universe.districts.map((d) => {
      const r = model?.risks.find((x) => x.districtId === d.id);
      return [d.id, d.name, d.stateName, d.zone, d.lat, d.lng, d.popLakh, d.sexRatio, d.femLit, d.density, d.urban, r?.rr ?? "", r?.sir ?? "", r?.observed ?? "", r?.expected ?? ""].join(",");
    });
    download("samhita_districts.csv", header + rows.join("\n"));
  }

  function caseCsv() {
    const header = "id,district,kind,date,lat,lng,series,urban,statute,typology,narrative\n";
    const rows = universe.cases.map((c) =>
      [
        c.id,
        c.districtId,
        c.kind,
        c.date,
        c.lat.toFixed(4),
        c.lng.toFixed(4),
        c.seriesId ?? "",
        c.urban,
        c.statute,
        c.typology ?? "",
        `"${c.narrative.replaceAll('"', "'")}"`,
      ].join(","),
    );
    download("samhita_cases.csv", header + rows.join("\n"));
  }

  function stateCsv() {
    const header = "code,name,zone,female_pop_lakh_2022,caw_2022,caw_2023,caw_rate_2022,murder_rate,cyber_rate,violent_rate,sex_ratio,fem_lit,dark_figure\n";
    const rows = STATES.map((s) =>
      [s.code, s.name, s.zone, s.femalePopLakh2022, s.caw2022, s.caw2023, s.cawRate2022, s.murderRate2022, s.cyberRate2022, s.violentRate2022, s.sexRatio, s.femaleLiteracy, s.darkFigure].join(","),
    );
    download("ncrb_state_priors.csv", header + rows.join("\n"));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Sources</p>
      <h1 className="mt-1 font-display text-3xl font-medium md:text-4xl">India datasets</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Official NCRB / Census / NFHS priors drive a seeded synthetic generator. No
        identifiable victim or accused is in this file. Counts are a statistically faithful
        panel for methods — they are not a substitute for Crime in India microdata.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Districts" value={String(universe.districts.length)} />
        <Stat label="Monthly cells" value={formatInt(universe.cells.length)} />
        <Stat label="Synthetic cases" value={formatInt(universe.cases.length)} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Calibrated priors</CardTitle>
          <CardDescription>What the generator is allowed to know</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            <span className="text-foreground">NCRB Crime in India 2022–2024.</span> State CAW
            counts and rates (Table 3A.1), murder (2A.1), cyber (9A.1), violent crime (1C.1).
            Female population from the CAW table; total population from the murder table.
          </p>
          <p>
            <span className="text-foreground">Census 2011 / NCP 2019 projections.</span>{" "}
            District centroids, density, urbanisation. New districts after 2011 are represented
            by parent geography, matching Pooja et al. and Mathews et al.
          </p>
          <p>
            <span className="text-foreground">NFHS-5 2019–21.</span> Sex ratio, female literacy,
            and the 29.3% lifetime domestic-violence prevalence used to set state dark-figure
            multipliers (Kerala ~1.35, Bihar ~3.2).
          </p>
          <p>
            <span className="text-foreground">India calendar.</span> Holi, Diwali, Navratri /
            Durga Puja (year-specific), monsoon, summer street factor, 2020–21 lockdown dip.
          </p>
          <p>
            <span className="text-foreground">Planted series.</span> {universe.series.length} dockets:
            18 typed (forager / marauder / commuter) plus 4 versatile burglary→CAW/rape series with
            NFHS-stretched gaps — the ground truth for mixed-pool partition, not pairwise ranking.
            Statutes flip IPC → BNS on 1 July 2024.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>CSV of the current seed (2026)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={stateCsv}>NCRB state priors</Button>
          <Button variant="secondary" onClick={districtCsv}>
            District risk panel
          </Button>
          <Button variant="secondary" onClick={caseCsv}>
            Synthetic cases
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>State CAW rates, 2022</CardTitle>
          <CardDescription>Per lakh women — NCRB Table 3A.1</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">State / UT</th>
                <th className="font-medium">Zone</th>
                <th className="font-medium">CAW 2022</th>
                <th className="font-medium">Rate</th>
                <th className="font-medium">CAW 2023</th>
                <th className="font-medium">Dark fig.</th>
              </tr>
            </thead>
            <tbody>
              {STATES.slice()
                .sort((a, b) => b.cawRate2022 - a.cawRate2022)
                .map((s) => (
                  <tr key={s.code} className="border-t border-border">
                    <td className="py-1.5">{s.name}</td>
                    <td className="text-muted-foreground">{s.zone}</td>
                    <td className="font-mono tabular-nums">{formatInt(s.caw2022)}</td>
                    <td className="font-mono tabular-nums">{formatNum(s.cawRate2022, 1)}</td>
                    <td className="font-mono tabular-nums">{formatInt(s.caw2023)}</td>
                    <td className="font-mono tabular-nums">{formatNum(s.darkFigure, 2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
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
