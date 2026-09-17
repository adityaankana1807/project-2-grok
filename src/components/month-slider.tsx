import type { MonthKey } from "@/lib/indra/types";

export function MonthSlider({
  months,
  value,
  onChange,
}: {
  months: MonthKey[];
  value: number;
  onChange: (i: number) => void;
}) {
  const m = months[Math.min(value, months.length - 1)];
  const label = m
    ? new Date(m.year, m.month - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" })
    : "";
  return (
    <label className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-wider text-muted-foreground">Window end</span>
        <span className="font-mono tabular-nums text-foreground">{label}</span>
      </div>
      <input
        type="range"
        min={11}
        max={months.length - 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full cursor-pointer accent-accent"
      />
    </label>
  );
}
