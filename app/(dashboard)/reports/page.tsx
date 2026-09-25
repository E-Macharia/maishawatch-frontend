"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, BarChart3, FileText, Gauge, ShieldCheck, TrendingUp, RefreshCw, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/dashboard/motion";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RiskBars } from "@/components/dashboard/charts";
import { useLiveData } from "@/lib/data/live-context";
import { formatEquipmentType } from "@/lib/data/insights";
import { SnapshotButton } from "@/components/dashboard/snapshot-button";

export default function ReportsPage() {
  const { equipment, facilities, isLive, isLoading, refresh } = useLiveData();

  const riskAverage = useMemo(() => {
    if (!equipment.length) return 45;
    return Math.round(
      equipment.reduce((s, e) => s + e.riskScore, 0) / equipment.length,
    );
  }, [equipment]);

  const criticalCount = useMemo(
    () => equipment.filter((e) => e.riskLevel === "critical").length,
    [equipment],
  );

  const discrepancyCount = useMemo(
    () => equipment.filter((e) => e.discrepancyFlagged).length,
    [equipment],
  );

  const types = useMemo(() => {
    const counts: Record<string, number> = {};
    equipment.forEach((item) => {
      const t = formatEquipmentType(item.type);
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
    }));
  }, [equipment]);

  const topFacilities = useMemo(() => {
    const byFacility = new Map<string, typeof equipment>();
    for (const item of equipment) {
      const existing = byFacility.get(item.facilityId) ?? [];
      existing.push(item);
      byFacility.set(item.facilityId, existing);
    }

    return facilities
      .map((facility) => {
        const eq = byFacility.get(facility.id) ?? [];
        const avgRisk = eq.length
          ? eq.reduce((sum, item) => sum + item.riskScore, 0) / eq.length
          : 0;
        const crit = eq.filter((item) => item.riskLevel === "critical").length;
        const disc = eq.filter((item) => item.discrepancyFlagged).length;
        return {
          ...facility,
          equipmentCount: eq.length,
          averageRisk: Math.round(avgRisk),
          criticalCount: crit,
          discrepancyCount: disc,
        };
      })
      .filter((f) => f.equipmentCount > 0 || facilities.length < 50)
      .sort((a, b) => b.averageRisk - a.averageRisk)
      .slice(0, 10);
  }, [facilities, equipment]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Reveal>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Management Intelligence</p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isLive
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                {isLive ? "Live API Connected" : "Connecting to API..."}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Executive Reports</h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
              A concise oversight layer for biomedical maintenance targeting, equipment utilization, and facility risk exposure.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh API
            </button>
            <SnapshotButton />
          </div>
        </div>
      </Reveal>

      {/* KPI Summary Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Average Risk" value={riskAverage} hint="Network equipment score" icon={Gauge} tone="amber" />
        <MetricCard label="Critical Assets" value={criticalCount} hint="Priority interventions" icon={ShieldCheck} tone="red" />
        <MetricCard label="Usage Flags" value={discrepancyCount} hint="Reconciliation cases" icon={TrendingUp} tone="blue" />
        <MetricCard label="Facilities" value={facilities.length} hint="Current network coverage" icon={BarChart3} tone="emerald" />
      </section>

      {/* Portfolio Composition & Risk Interpretation */}
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.9fr]">
        <Reveal delay={0.08}>
          <Card className="h-[360px] border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Equipment by Clinical Area</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Portfolio composition for operational planning.</p>
            </CardHeader>
            <CardContent className="h-[285px] pt-4">
              <RiskBars data={types} />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.12}>
          <Card className="h-[360px] border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Signal Interpretation Guide</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">How to read the current dashboard risk signals.</p>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-xs font-bold text-red-500">Critical Priority</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Assets with the shortest modeled failure lead time and highest intervention priority. Immediate technician dispatch recommended.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-xs font-bold text-amber-500">Discrepancy Signal</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  A counter-versus-register mismatch requiring usage reconciliation to verify actual machine runtime.
                </p>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* Facility Oversight Table */}
      <Reveal delay={0.16}>
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Facility Oversight Register</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Top facilities ranked by average equipment risk score.</p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    {["Facility", "County", "Assets", "Avg Risk", "Critical", "Discrepancy", ""].map((h) => (
                      <th key={h} className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topFacilities.map((f) => (
                    <tr key={f.id} className="transition-colors hover:bg-accent/40">
                      <td className="px-6 py-3 text-xs font-bold text-foreground">
                        <Link href={`/facilities/${f.id}`} className="hover:underline">
                          {f.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-xs text-muted-foreground">{f.county}</td>
                      <td className="px-6 py-3 text-xs font-mono text-foreground">{f.equipmentCount}</td>
                      <td className="px-6 py-3 text-xs font-mono font-bold text-foreground">{f.averageRisk}</td>
                      <td className="px-6 py-3 text-xs font-mono text-red-500">{f.criticalCount}</td>
                      <td className="px-6 py-3 text-xs font-mono text-amber-500">{f.discrepancyCount}</td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/facilities/${f.id}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-xs"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
