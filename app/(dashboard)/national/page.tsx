import Link from "next/link";
import { ArrowUpRight, Building2, CircleAlert, Gauge, ShieldCheck, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Reveal } from "@/components/dashboard/motion";
import { RiskBars } from "@/components/dashboard/charts";
import { getCountyRiskRanking, getPriorityEquipment } from "@/lib/data/insights";
import { getOverviewMetrics } from "@/lib/data/metrics";
import { maishawatchData } from "@/lib/data";

export default function NationalPage() {
  const metrics = getOverviewMetrics();
  const ranking = getCountyRiskRanking();
  const top = ranking.slice(0, 10);
  const priorities = getPriorityEquipment();

  const countyBars = top.map((x) => ({ label: x.county, value: x.averageRisk }));
  const countiesWithCritical = ranking.filter((x) => x.criticalCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Reveal>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">National Oversight</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Kenya Equipment Network</h1>
          <p className="mt-1 max-w-3xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
            A network-level view of asset risk, county concentration, failure exposure, and reporting integrity using the backend telemetry dataset.
          </p>
        </div>
      </Reveal>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal delay={0.05}>
          <MetricCard
            label="Facilities in Master"
            value={metrics.facilityCount.toLocaleString()}
            hint="KMHFR-derived network reference"
            icon={Building2}
            tone="blue"
          />
        </Reveal>
        <Reveal delay={0.09}>
          <MetricCard
            label="Critical Assets"
            value={metrics.criticalCount}
            hint={`${countiesWithCritical} counties affected`}
            icon={ShieldCheck}
            tone="red"
          />
        </Reveal>
        <Reveal delay={0.13}>
          <MetricCard
            label="Network Downtime"
            value={`${metrics.downtimeHours}h`}
            hint="Recorded failure downtime"
            icon={CircleAlert}
            tone="amber"
          />
        </Reveal>
        <Reveal delay={0.17}>
          <MetricCard
            label="Average Utilization"
            value={`${metrics.utilization}%`}
            hint="Latest telemetry snapshot"
            icon={TrendingDown}
            tone="emerald"
          />
        </Reveal>
      </section>

      {/* County Risk Ranking & Watchlist */}
      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <Reveal delay={0.2}>
          <Card className="h-[390px] border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">County Risk Ranking</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Top counties by average monitored equipment risk score.</p>
            </CardHeader>
            <CardContent className="h-[315px] pt-4">
              <RiskBars data={countyBars} />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.24}>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Network Watchlist</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Equipment with shortest remaining lead times.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {priorities.slice(0, 6).map((item) => (
                  <Link
                    key={item.id}
                    href={`/equipment/${item.id}`}
                    className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{item.name}</p>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {item.facilityName} • <span className="font-mono text-foreground font-semibold">{item.leadTimeDays}d lead time</span>
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-500">{item.riskScore}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* County Operational Table */}
      <Reveal delay={0.28}>
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">County Operational Table</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Critical exposure, discrepancies, and downtime across monitored counties.</p>
              </div>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    {["County", "Assets", "Avg Risk", "Critical", "Discrepancies", "Downtime", "Posture"].map((h) => (
                      <th key={h} className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ranking.slice(0, 20).map((row) => (
                    <tr key={row.county} className="transition-colors hover:bg-accent/40">
                      <td className="px-6 py-3 text-xs font-bold text-foreground">{row.county}</td>
                      <td className="px-6 py-3 text-xs font-mono text-muted-foreground">{row.equipmentCount}</td>
                      <td className="px-6 py-3 text-xs font-mono font-bold text-foreground">{row.averageRisk}</td>
                      <td className="px-6 py-3 text-xs font-mono font-bold text-red-500">{row.criticalCount}</td>
                      <td className="px-6 py-3 text-xs font-mono font-bold text-amber-500">{row.discrepancyCount}</td>
                      <td className="px-6 py-3 text-xs font-mono text-muted-foreground">{row.downtimeHours}h</td>
                      <td className="px-6 py-3 text-xs font-semibold">
                        <span
                          className={
                            row.averageRisk >= 70
                              ? "text-red-500"
                              : row.averageRisk >= 50
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }
                        >
                          {row.averageRisk >= 70 ? "Immediate Intervention" : row.averageRisk >= 50 ? "Elevated" : "Stable"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <p className="text-[11px] text-muted-foreground">
        Source snapshot: {maishawatchData.meta.source}. Facility master records include 47 counties.
      </p>
    </div>
  );
}
