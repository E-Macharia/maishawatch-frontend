import Link from "next/link";
import { ArrowUpRight, Building2, CircleAlert, Gauge, ShieldCheck, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Reveal } from "@/components/dashboard/motion";
import { RiskBars } from "@/components/dashboard/charts";
import { getCountyRiskRanking, getPriorityEquipment } from "@/lib/data/insights";
import { getOverviewMetrics } from "@/lib/data/metrics";
import { maishawatchData } from "@/lib/data";

export default function NationalPage(){
  const metrics=getOverviewMetrics(); const ranking=getCountyRiskRanking(); const top=ranking.slice(0,10); const priorities=getPriorityEquipment();
  const countyBars=top.map(x=>({label:x.county,value:x.averageRisk}));
  const countiesWithCritical=ranking.filter(x=>x.criticalCount>0).length;
  return <div className="space-y-5">
    <Reveal><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">National oversight</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Kenya equipment network</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">A network-level view of asset risk, county concentration, failure exposure and reporting integrity using the backend data pipeline snapshot.</p></div></Reveal>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Reveal delay={.05}><MetricCard label="Facilities in master" value={metrics.facilityCount.toLocaleString()} hint="KMHFR-derived network reference" icon={Building2} tone="blue"/></Reveal>
      <Reveal delay={.09}><MetricCard label="Critical assets" value={metrics.criticalCount} hint={`${countiesWithCritical} counties affected`} icon={ShieldCheck} tone="red"/></Reveal>
      <Reveal delay={.13}><MetricCard label="Network downtime" value={`${metrics.downtimeHours}h`} hint="Recorded failure downtime" icon={CircleAlert} tone="amber"/></Reveal>
      <Reveal delay={.17}><MetricCard label="Average utilization" value={`${metrics.utilization}%`} hint="Latest telemetry snapshot" icon={TrendingDown} tone="emerald"/></Reveal>
    </section>
    <section className="grid gap-4 xl:grid-cols-[1.45fr_.9fr]">
      <Reveal delay={.2}><Card className="h-[390px] ring-0"><CardHeader className="border-b pb-4"><CardTitle className="text-sm font-semibold">County risk ranking</CardTitle><p className="mt-1 text-xs text-slate-500">Top counties by average monitored equipment risk.</p></CardHeader><CardContent className="h-[315px] pt-4"><RiskBars data={countyBars}/></CardContent></Card></Reveal>
      <Reveal delay={.24}><Card className="ring-0"><CardHeader className="border-b pb-4"><CardTitle className="text-sm font-semibold">Network watchlist</CardTitle><p className="mt-1 text-xs text-slate-500">Equipment with the shortest remaining useful life.</p></CardHeader><CardContent className="p-0"><div className="divide-y">{priorities.slice(0,6).map(item=><Link key={item.id} href={`/equipment/${item.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.name}</p><p className="mt-1 truncate text-[10px] text-slate-500">{item.facilityName} · {item.leadTimeDays}d lead time</p></div><span className="text-xs font-semibold text-red-600 dark:text-red-300">{item.riskScore}</span><ArrowUpRight className="h-3.5 w-3.5 text-slate-400"/></Link>)}</div></CardContent></Card></Reveal>
    </section>
    <Reveal delay={.28}><Card className="ring-0"><CardHeader className="border-b pb-4"><div className="flex items-center justify-between"><div><CardTitle className="text-sm font-semibold">County operational table</CardTitle><p className="mt-1 text-xs text-slate-500">Critical exposure, discrepancies and downtime across monitored counties.</p></div><Gauge className="h-4 w-4 text-slate-400"/></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="bg-black/[0.025] dark:bg-white/[0.018]"><tr>{["County","Assets","Avg risk","Critical","Discrepancies","Downtime","Posture"].map(h=><th key={h} className="px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y">{ranking.slice(0,20).map(row=><tr key={row.county} className="transition hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"><td className="px-5 py-3 text-xs font-semibold">{row.county}</td><td className="px-5 py-3 text-xs text-slate-500">{row.equipmentCount}</td><td className="px-5 py-3 text-xs font-semibold">{row.averageRisk}</td><td className="px-5 py-3 text-xs text-red-600 dark:text-red-300">{row.criticalCount}</td><td className="px-5 py-3 text-xs text-amber-600 dark:text-amber-300">{row.discrepancyCount}</td><td className="px-5 py-3 text-xs text-slate-500">{row.downtimeHours}h</td><td className="px-5 py-3 text-xs font-medium">{row.averageRisk>=70?"Immediate intervention":row.averageRisk>=50?"Elevated":"Stable"}</td></tr>)}</tbody></table></div></CardContent></Card></Reveal>
    <p className="text-[10px] text-slate-500">Source snapshot: {maishawatchData.meta.source}. Facility master records include 47 counties; coordinates, where present, are reference/demo values rather than surveyed facility GPS.</p>
  </div>
}
