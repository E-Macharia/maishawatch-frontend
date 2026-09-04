import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Lift } from "./motion";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  trend?: string;
  tone?: "blue" | "red" | "amber" | "emerald";
}) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  } as const;

  return (
    <Lift>
      <Card className="border-border bg-card text-card-foreground shadow-xs transition-all hover:border-border/80">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-2.5 text-3xl font-extrabold tracking-tight text-foreground tabular-nums">{value}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
            </div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>
              <Icon className="h-4 w-4" />
            </span>
          </div>
          {trend && (
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              {trend.toLowerCase().includes("stable") ? (
                <Minus className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              )}
              <span>{trend}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Lift>
  );
}
