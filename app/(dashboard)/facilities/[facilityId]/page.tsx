import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Building2, Gauge, MapPin, ShieldCheck, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Reveal } from "@/components/dashboard/motion";
import { RiskDonut } from "@/components/dashboard/charts";
import { getFacilitySummary, getFacilityEligibilitySummary, formatEquipmentType } from "@/lib/data/insights";
import { notFound } from "next/navigation";

export default async function FacilityDetailPage({ params }: { params: Promise<{ facilityId: string }> }) {
  const { facilityId } = await params;
  const summary = getFacilitySummary(facilityId);
  if (!summary.facility) notFound();

  const risk = {
    critical: summary.equipment.filter((e) => e.riskLevel === "critical").length,
    high: summary.equipment.filter((e) => e.riskLevel === "high").length,
    medium: summary.equipment.filter((e) => e.riskLevel === "medium").length,
    low: summary.equipment.filter((e) => e.riskLevel === "low").length,
  };

  const donut = [
    { name: "Critical", value: risk.critical, fill: "#ef4444" },
    { name: "High", value: risk.high, fill: "#f97316" },
    { name: "Moderate", value: risk.medium, fill: "#f59e0b" },
    { name: "Low", value: risk.low, fill: "#10b981" },
  ];

  const eligibility = getFacilityEligibilitySummary(summary.facility);

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <Reveal>
        <Link href="/facilities" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to facilities
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Facility Intelligence</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{summary.facility.name}</h1>
            <p className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {summary.facility.county} • Level {summary.facility.serviceLevel} • {summary.facility.facilityType}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
            <Gauge className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average Risk</p>
              <p className="text-lg font-bold font-mono text-foreground">
                {summary.riskScore}
                <span className="text-xs font-normal text-muted-foreground">/100</span>
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Primary KPI Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal>
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Capacity</p>
              <p className="mt-1 text-xl font-bold font-mono text-foreground">{(summary.facility.bedsAndCots ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Beds + cots</p>
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.04}>
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Utilization</p>
              <p className="mt-1 text-xl font-bold font-mono text-foreground">{Math.round(summary.utilization * 100)}%</p>
              <p className="text-xs text-muted-foreground">Latest monitored assets</p>
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Downtime</p>
              <p className="mt-1 text-xl font-bold font-mono text-foreground">{summary.downtime.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">Recorded failure downtime</p>
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.12}>
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Owner Type</p>
              <p className="mt-1 truncate text-sm font-bold text-foreground">{summary.facility.ownerType || "Not recorded"}</p>
              <p className="text-xs text-muted-foreground">Facility master record</p>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* Equipment Portfolio & Risk Profile */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.85fr]">
        <Reveal delay={0.12}>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Equipment Portfolio</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Assets currently monitored at this facility.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {summary.equipment.length ? (
                  summary.equipment.map((item) => (
                    <Link
                      key={item.id}
                      href={`/equipment/${item.id}`}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-xs font-bold text-foreground">{item.name}</p>
                          <StatusBadge level={item.riskLevel} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatEquipmentType(item.type)} • <span className="font-mono">{item.serialNumber}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-foreground">{item.riskScore}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">risk</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-xs text-muted-foreground text-center">No monitored equipment attached to this facility.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.16}>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Risk Profile</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Current distribution across monitored assets.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mx-auto h-52 max-w-[240px]">
                <RiskDonut data={donut} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {Object.entries(risk).map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{key}</p>
                    <p className="mt-1 text-lg font-bold font-mono text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* Facility Metadata & Eligibility */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Reveal delay={0.2}>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">Equipment Eligibility</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Eligibility flags supplied by facility master.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-6">
              {eligibility.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
                  <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      item.eligible === true
                        ? "text-emerald-600 dark:text-emerald-400"
                        : item.eligible === false
                        ? "text-muted-foreground"
                        : "text-amber-500"
                    }`}
                  >
                    {item.eligible === true ? "Eligible" : item.eligible === false ? "Not eligible" : "Unknown"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.24}>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">Facility Operations</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Availability and master-record context.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-6">
              {[
                ["Operation", summary.facility.operationStatus],
                ["Whole day", summary.facility.openWholeDay],
                ["Weekends", summary.facility.openWeekends],
                ["Late night", summary.facility.openLateNight],
                ["Sub-county", summary.facility.subCounty],
                ["Ward", summary.facility.ward],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-foreground">{v || "Not recorded"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
