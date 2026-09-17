import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Atlas" },
  { to: "/algorithm", label: "Algorithm" },
  { to: "/linkage", label: "Linkage" },
  { to: "/series", label: "Series" },
  { to: "/forecast", label: "Forecast" },
  { to: "/paper", label: "Paper" },
  { to: "/data", label: "Data" },
  { to: "/literature", label: "Literature" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 md:px-6">
          <Link to="/" className="flex min-w-0 items-baseline gap-2">
            <span className="font-display text-xl font-medium tracking-tight">TRIVENI</span>
            <span className="hidden truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
              Forensic case linkage
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-0.5 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="border-t border-border">
        <p className="mx-auto max-w-[1400px] px-4 py-4 text-xs text-muted-foreground md:px-6">
          Synthetic, NCRB-calibrated research data — not official police records. Reporting
          rates are not incidence. TRIVENI emits a likelihood ratio for investigators, not a
          same-offender verdict.
        </p>
      </footer>
    </div>
  );
}
