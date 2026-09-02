import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Lift } from "./motion";
export function MetricCard({ label, value, hint, icon: Icon, trend, tone = "blue" }: { label: string; value: string | number; hint: string; icon: LucideIcon; trend?: string; tone?: "blue" | "red" | "amber" | "emerald" }) {
 const tones = { blue:"bg-blue-400/10 text-blue-300 ring-blue-400/10", red:"bg-red-400/10 text-red-300 ring-red-400/10", amber:"bg-amber-400/10 text-amber-300 ring-amber-400/10", emerald:"bg-emerald-400/10 text-emerald-300 ring-emerald-400/10" } as const;
 return <Lift><Card className="border-white/[0.07] bg-white/[0.025] shadow-sm ring-0"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-white tabular-nums">{value}</p><p className="mt-2 text-[13px] leading-5 text-slate-500">{hint}</p></div><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] ring-1 ${tones[tone]}`}><Icon className="h-4 w-4"/></span></div>{trend && <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-400">{trend === "stable" ? <Minus className="h-3.5 w-3.5"/> : <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300"/>}{trend}</div>}</CardContent></Card></Lift>;
}
