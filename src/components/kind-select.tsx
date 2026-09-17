import { CRIME_KINDS, CRIME_LABEL, type CrimeKind } from "@/lib/indra/types";
import { cn } from "@/lib/utils";

export function KindSelect({
  value,
  onChange,
}: {
  value: CrimeKind;
  onChange: (k: CrimeKind) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {CRIME_KINDS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={cn(
            "h-11 rounded-md px-3 text-xs font-medium transition-colors duration-150",
            value === k
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {CRIME_LABEL[k]}
        </button>
      ))}
    </div>
  );
}
