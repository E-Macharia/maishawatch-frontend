import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CircleAlert, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Reveal } from "@/components/dashboard/motion";
import { ComparisonTrendChart } from "@/components/dashboard/charts";
import { TelemetryInsights } from "@/components/dashboard/telemetry-insights";
import { TechnicianLog } from "@/components/dashboard/technician-log";
import { EquipmentActions } from "@/components/dashboard/equipment-actions";
import {
  getEquipmentById,
  getAlertsForEquipment,
  getFacilityById,
  getEquipmentTrend,
  formatEquipmentType,
  getEquipmentHealthScore,
  getRiskDrivers,
  getFailureSummary,
} from "@/lib/data/insights";

export default async function EquipmentDetailPage({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  const found = getEquipmentById(equipmentId);
  if (!found) notFound();
  const item = found;
  const facility = getFacilityById(item.facilityId);
  const alerts = getAlertsForEquipment(item.id);
  if (!facility) notFound();
  const trend = getEquipmentTrend(item);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <Reveal>
        <Link href="/equipment" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to equipment
        </Link>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge level={item.riskLevel} />
              <span className="rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                {formatEquipmentType(item.type)}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{item.name}</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
              {facility?.name} • {facility?.county} • <span className="font-mono">{item.serialNumber}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <EquipmentActions equipment={item} facility={facility} alert={alerts[0]} />
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3.5 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Predicted Failure Window</p>
              <p className="mt-1 text-2xl font-extrabold text-foreground font-mono">
                {item.leadTimeDays} <span className="text-xs font-normal text-muted-foreground">usage-days</span>
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Usage Trend & Risk Intelligence */}
      <section className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <Reveal delay={0.08}>
          <Card className="h-[380px] border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">Usage History</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Equipment counter against registered activity.</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last 10 records</span>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-5">
              <ComparisonTrendChart data={trend} />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.12}>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Risk Intelligence</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Why this asset is being prioritized.</p>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div>
                <div className="flex items-end justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Risk Score</span>
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {item.riskScore}
                    <span className="text-xs font-normal text-muted-foreground">/100</span>
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500"
                    style={{ width: `${item.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Counter</p>
                  <p className="mt-1 text-lg font-bold font-mono text-foreground">{item.counterUsage.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Register</p>
                  <p className="mt-1 text-lg font-bold font-mono text-foreground">{item.registerUsage.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="flex gap-3">
                  <CircleAlert className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Risk Rationale</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.scenarioRationale}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* Health Score & Failure Exposure */}
      <Reveal delay={0.14}>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Equipment Health Score</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Composite view of reliability, maintenance, utilization, and reporting integrity.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overall Health</p>
                  <p className="mt-1 text-3xl font-extrabold text-foreground font-mono">
                    {getEquipmentHealthScore(item).overall}
                    <span className="text-xs font-normal text-muted-foreground">/100</span>
                  </p>
                </div>
                <StatusBadge
                  level={
                    getEquipmentHealthScore(item).overall < 45
                      ? "critical"
                      : getEquipmentHealthScore(item).overall < 65
                      ? "high"
                      : "low"
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(getEquipmentHealthScore(item))
                  .filter(([k]) => k !== "overall")
                  .map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-border bg-muted/40 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{key}</p>
                      <p className="mt-1 text-lg font-bold font-mono text-foreground">{value}</p>
                    </div>
                  ))}
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-bold text-primary">Why This Asset Is Risky</p>
                <div className="mt-3 space-y-2.5">
                  {getRiskDrivers(item).map((driver) => (
                    <div key={driver.label} className="flex items-center gap-3">
                      <span className="w-36 truncate text-xs font-medium text-muted-foreground">{driver.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, driver.value * 4)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-mono font-bold text-foreground">{driver.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Failure Exposure</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Historical failure-event impact from telemetry dataset.</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-6">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Events</p>
                <p className="mt-1 text-2xl font-bold font-mono text-foreground">{getFailureSummary(item).count}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Downtime</p>
                <p className="mt-1 text-2xl font-bold font-mono text-foreground">{getFailureSummary(item).downtimeHours}h</p>
              </div>
              <div className="col-span-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Estimated Repair Exposure
                </p>
                <p className="mt-1 text-xl font-bold font-mono text-foreground">
                  KSh {Math.round(getFailureSummary(item).repairCost).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Derived from recorded failure-event estimates.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Reveal>

      {/* Telemetry Insights */}
      <Reveal delay={0.18}>
        <TelemetryInsights equipment={item} />
      </Reveal>

      {/* Asset Metadata & Timeline */}
      <section className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
        <Reveal delay={0.16}>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Asset Metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Install Date</p>
                <p className="mt-1 text-xs font-mono font-semibold text-foreground">{item.installDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Maintenance</p>
                <p className="mt-1 text-xs font-mono font-semibold text-foreground">{item.lastMaintenanceDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Usage Days</p>
                <p className="mt-1 text-xs font-mono font-semibold text-foreground">{item.usageDays.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Discrepancy</p>
                <p className="mt-1 text-xs font-mono font-semibold text-foreground">{item.discrepancyPercent}%</p>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.2}>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">Maintenance Timeline</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Recent biomedical engineering activity.</p>
                </div>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {item.maintenanceLog
                  .slice()
                  .reverse()
                  .map((record) => (
                    <div key={record.id} className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Wrench className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold capitalize text-foreground">{record.type}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">{record.date}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{record.notes}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* Technician Log */}
      <Reveal delay={0.24}>
        <TechnicianLog equipment={item} />
      </Reveal>

      {/* Open Signals */}
      {alerts.length > 0 && (
        <Reveal delay={0.28}>
          <Card className="border-red-500/20 bg-red-500/5 shadow-xs">
            <CardHeader className="border-b border-red-500/20">
              <div className="flex items-center gap-2">
                <CircleAlert className="h-4 w-4 text-red-500" />
                <CardTitle className="text-sm font-bold text-foreground">Open Signals for This Asset</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 p-6">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-foreground">{alert.message}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{alert.severity}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
