import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, Building2, Gauge, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Reveal } from "@/components/dashboard/motion";
import { ComparisonTrendChart, RiskBars, RiskDonut } from "@/components/dashboard/charts";
import { maishawatchData, getFacilityName } from "@/lib/data";
import { getFacilityRiskRanking, getOverviewMetrics } from "@/lib/data/metrics";
import { getOverviewChartData, getPriorityEquipment, getRiskPortfolio, getTypeBreakdown, formatEquipmentType } from "@/lib/data/insights";

export default function OverviewPage() {
  const metrics = getOverviewMetrics();
  const priorities = getPriorityEquipment();
  const facilityRanking = getFacilityRiskRanking().slice(0, 5);
  const riskPortfolio = getRiskPortfolio();
  const trend = getOverviewChartData();
  const typeBreakdown = getTypeBreakdown();
  const activeAlerts = maishawatchData.alerts.filter((a) => a.severity === "critical" || a.severity === "high").slice(0, 5);
  const averageRisk = Math.round(maishawatchData.equipment.reduce((sum, item) => sum + item.riskScore, 0) / maishawatchData.equipment.length);
  const maintenanceOverdue = maishawatchData.equipment.filter((item) => item.scenarioPattern === "maintenance-neglect").length;

  return (
    <div className="space-y-6">
      <Reveal>
        <section className="relative overflow-hidden rounded-[5px] border border-white/[0.07] bg-white/[0.025] px-5 py-7 shadow-sm sm:px-7 lg:px-8">
          <div className="absolute inset-0 grid-fade opacity-35" />
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-[5px] bg-blue-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-[5px] border border-blue-400/15 bg-blue-400/[0.05] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.17em] text-blue-300"><Sparkles className="h-3 w-3" /> Biomedical command centre</div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[34px]">Good afternoon, team.</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-400">Here&apos;s the current operational posture across the monitored Kenyan hospital network. Focus first on assets with the shortest predicted failure window.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="rounded-[5px] border border-white/[0.07] bg-black/10 px-4 py-3"><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Avg risk</p><p className="mt-1 text-xl font-semibold text-white">{averageRisk}<span className="text-[13px] font-normal text-slate-500"> / 100</span></p></div>
              <div className="rounded-[5px] border border-white/[0.07] bg-black/10 px-4 py-3"><p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Overdue</p><p className="mt-1 text-lg font-semibold text-orange-300">{maintenanceOverdue}<span className="text-[13px] font-normal text-slate-500"> assets</span></p></div>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal delay={0.04}><MetricCard label="Equipment monitored" value={metrics.equipmentCount} hint={`${metrics.facilityCount} facilities in scope`} icon={Activity} tone="blue" trend="Network coverage stable" /></Reveal>
        <Reveal delay={0.08}><MetricCard label="Critical assets" value={metrics.criticalCount} hint="Shortest failure windows" icon={ShieldAlert} tone="red" trend="priority review required" /></Reveal>
        <Reveal delay={0.12}><MetricCard label="Open alerts" value={metrics.activeAlertCount} hint={`${metrics.discrepancyCount} with discrepancy flags`} icon={AlertTriangle} tone="amber" trend="monitoring active" /></Reveal>
        <Reveal delay={0.16}><MetricCard label="Facilities at risk" value={facilityRanking.filter((f) => f.averageRisk >= 60).length} hint="Average risk score ≥ 60" icon={Building2} tone="emerald" trend="stable" /></Reveal>
      </section>
      <Reveal delay={0.18}>
        <Card className="border-white/[0.07] bg-white/[0.025] ring-0 shadow-sm">
          <CardContent className="p-0">
            <div className="grid divide-y divide-white/[0.05] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-amber-400/10 text-amber-300"><Activity className="h-4 w-4"/></span>
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Sensor anomalies</p><p className="mt-1 text-lg font-semibold text-white tabular-nums">{metrics.anomalyCount}</p><p className="mt-0.5 text-[13px] text-slate-500">Recent telemetry signals</p></div>
              </div>
              <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-blue-400/10 text-blue-300"><Wrench className="h-4 w-4"/></span>
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Recorded downtime</p><p className="mt-1 text-lg font-semibold text-white tabular-nums">{metrics.downtimeHours}h</p><p className="mt-0.5 text-[13px] text-slate-500">Failure-event downtime</p></div>
              </div>
              <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-emerald-400/10 text-emerald-300"><Gauge className="h-4 w-4"/></span>
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Average utilization</p><p className="mt-1 text-lg font-semibold text-white tabular-nums">{metrics.utilization}%</p><p className="mt-0.5 text-[13px] text-slate-500">Latest equipment telemetry</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Reveal delay={0.18}>
          <Card className="min-h-[360px] border-white/[0.07] bg-white/[0.025] ring-0">
            <CardHeader className="border-b border-white/[0.06] pb-4"><div className="flex items-center justify-between gap-4"><div><CardTitle className="text-[15px] font-semibold text-white">Utilization vs reported usage</CardTitle><p className="mt-1.5 text-[13px] leading-5 text-slate-500">Portfolio average from the current scenario telemetry.</p></div><span className="rounded-[5px] border border-emerald-400/10 bg-emerald-400/5 px-2.5 py-1 text-[11px] font-medium text-emerald-300">8-period view</span></div></CardHeader>
            <CardContent className="h-[280px] px-2 pb-4 pt-5"><ComparisonTrendChart data={trend} /></CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.22}>
          <Card className="min-h-[360px] border-white/[0.07] bg-white/[0.025] ring-0">
            <CardHeader className="border-b border-white/[0.06] pb-4"><div><CardTitle className="text-[15px] font-semibold text-white">Risk portfolio</CardTitle><p className="mt-1.5 text-[13px] leading-5 text-slate-500">Current modeled risk by asset.</p></div></CardHeader>
            <CardContent className="grid h-[280px] grid-cols-[1fr_210px] items-center gap-2 px-5 py-4">
              <div className="space-y-3.5">{riskPortfolio.map((item) => <div key={item.name} className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-[5px]" style={{background:item.fill}}/><span className="text-[13px] text-slate-500">{item.name}</span></div><span className="text-[13px] font-semibold text-foreground">{item.value}</span></div>)}</div>
              <div className="h-[235px] w-full max-w-[235px] justify-self-end"><RiskDonut data={riskPortfolio} /></div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Reveal delay={0.26}>
          <Card className="border-white/[0.07] bg-white/[0.025] ring-0">
            <CardHeader className="border-b border-white/[0.06] pb-4"><div className="flex items-center justify-between gap-4"><div><CardTitle className="text-[15px] font-semibold text-white">Priority intervention queue</CardTitle><p className="mt-1.5 text-[13px] leading-5 text-slate-500">Assets ordered by predicted failure lead time.</p></div><Link href="/equipment" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-300 hover:text-white">View all <ArrowRight className="h-3.5 w-3.5"/></Link></div></CardHeader>
            <CardContent className="p-0"><div className="divide-y divide-white/[0.05]">{priorities.slice(0,6).map((item) => <Link key={item.id} href={`/equipment/${item.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.025]"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-blue-400/[0.06] text-blue-300"><Gauge className="h-4 w-4"/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-[14px] font-semibold text-slate-200">{item.name}</p><StatusBadge level={item.riskLevel}/></div><p className="mt-1 truncate text-[13px] text-slate-500">{item.facilityName} · {formatEquipmentType(item.type)} · {item.serialNumber}</p></div><div className="shrink-0 text-right"><p className="text-[15px] font-semibold text-white">{item.leadTimeDays}d</p><p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">lead time</p></div></Link>)}</div></CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.3}>
          <Card className="border-white/[0.07] bg-white/[0.025] ring-0">
            <CardHeader className="border-b border-white/[0.06] pb-4"><div className="flex items-center justify-between"><div><CardTitle className="text-[15px] font-semibold text-white">Network hotspots</CardTitle><p className="mt-1.5 text-[13px] leading-5 text-slate-500">Highest average equipment risk.</p></div><Building2 className="h-4 w-4 text-slate-600"/></div></CardHeader>
            <CardContent className="p-0"><div className="divide-y divide-white/[0.05]">{facilityRanking.map((facility,index)=><Link key={facility.id} href={`/facilities/${facility.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-white/[0.025]"><span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-white/[0.04] text-[10px] font-semibold text-slate-500">0{index+1}</span><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold text-slate-200">{facility.name}</p><p className="mt-1 text-xs text-slate-600">{facility.county} · {facility.equipmentCount} assets</p></div><div className="text-right"><p className={facility.averageRisk>=70?"text-red-300":"text-amber-300"} >{facility.averageRisk}</p><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">risk</p></div></Link>)}</div></CardContent>
          </Card>
        </Reveal>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr_0.9fr]">
        <Reveal delay={0.34}>
          <Card className="h-[310px] border-white/[0.07] bg-white/[0.025] ring-0"><CardHeader className="border-b border-white/[0.06] pb-4"><CardTitle className="text-[15px] font-semibold text-white">Equipment mix</CardTitle><p className="mt-1.5 text-[13px] leading-5 text-slate-500">Asset count by clinical area.</p></CardHeader><CardContent className="h-[245px] pt-4"><RiskBars data={typeBreakdown}/></CardContent></Card>
        </Reveal>
        <Reveal delay={0.38}>
          <Card className="h-[310px] border-white/[0.07] bg-white/[0.025] ring-0"><CardHeader className="border-b border-white/[0.06] pb-4"><div className="flex items-center justify-between"><div><CardTitle className="text-[15px] font-semibold text-white">Live alerts</CardTitle><p className="mt-1.5 text-[13px] leading-5 text-slate-500">Highest urgency signals.</p></div><Link href="/alerts" className="text-xs font-semibold text-blue-300">Open <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></Link></div></CardHeader><CardContent className="p-0"><div className="divide-y divide-white/[0.05]">{activeAlerts.map(alert=><Link key={alert.id} href={`/equipment/${alert.equipmentId}`} className="block px-5 py-3.5 transition hover:bg-white/[0.025]"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="h-1.5 w-1.5 rounded-[5px] bg-red-400"/><span className="truncate text-[13px] font-semibold text-slate-200">{getFacilityName(alert.facilityId)}</span></div><span className="text-[9px] uppercase tracking-[0.12em] text-slate-600">{alert.severity}</span></div><p className="mt-1.5 line-clamp-1 text-xs text-slate-500">{alert.message}</p></Link>)}</div></CardContent></Card>
        </Reveal>
        <Reveal delay={0.42}>
          <Card className="h-[310px] border-white/[0.07] bg-gradient-to-br from-blue-400/[0.08] to-cyan-300/[0.02] ring-0"><CardHeader><div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-blue-300/10 text-blue-200"><Wrench className="h-4 w-4"/></div></CardHeader><CardContent><p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-blue-300">Next best action</p><h3 className="mt-3 text-[22px] font-semibold tracking-tight text-white">Review the 9-day failure window.</h3><p className="mt-3 text-[14px] leading-6 text-slate-400">Several critical assets are entering their modeled intervention window. Open the equipment queue and start with the shortest lead times.</p><Link href="/equipment" className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-white">Open intervention queue <ArrowRight className="h-3.5 w-3.5"/></Link></CardContent></Card>
        </Reveal>
      </section>

    </div>
  );
}
