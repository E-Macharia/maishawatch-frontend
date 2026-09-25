"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, Gauge, Search, SlidersHorizontal, X, RefreshCw, Radio } from "lucide-react";
import { useLiveData } from "@/lib/data/live-context";
import { formatEquipmentType } from "@/lib/data/insights";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/dashboard/motion";
import { Pagination } from "@/components/dashboard/pagination";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { RiskBars, RiskDonut } from "@/components/dashboard/charts";
import { TableEmptyState } from "@/components/dashboard/table-empty-state";
import { EquipmentOnboardModal } from "@/components/dashboard/equipment-onboard-modal";


const PAGE_SIZE = 12;

export default function EquipmentPage() {
  const { equipment, facilities, isLive, isLoading, refresh, getFacilityName } = useLiveData();
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");
  const [type, setType] = useState("all");
  const [county, setCounty] = useState("all");
  const [sort, setSort] = useState("risk");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search).get("query") || "";
    if (incoming) setQuery(incoming);
  }, []);

  const counties = useMemo(() => [...new Set(facilities.map((f) => f.county))].sort(), [facilities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = equipment.filter((item) => {
      const facility = getFacilityName(item.facilityId);
      const c = facilities.find((f) => f.id === item.facilityId)?.county;
      const hay = `${item.name} ${item.serialNumber} ${facility} ${formatEquipmentType(item.type)} ${item.scenarioPattern}`.toLowerCase();
      return (
        (!q || hay.includes(q)) &&
        (risk === "all" || item.riskLevel === risk) &&
        (type === "all" || item.type === type) &&
        (county === "all" || c === county)
      );
    });
    return [...result].sort((a, b) =>
      sort === "risk"
        ? b.riskScore - a.riskScore
        : sort === "lead"
        ? a.leadTimeDays - b.leadTimeDays
        : sort === "name"
        ? a.name.localeCompare(b.name)
        : b.counterUsage - a.counterUsage
    );
  }, [equipment, facilities, query, risk, type, county, sort, getFacilityName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const reset = () => {
    setQuery("");
    setRisk("all");
    setType("all");
    setCounty("all");
    setSort("risk");
    setPage(1);
  };

  const critical = equipment.filter((x) => x.riskLevel === "critical").length;
  const discrepancy = equipment.filter((x) => x.discrepancyFlagged).length;

  const riskPortfolio = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    equipment.forEach((item) => {
      if (counts[item.riskLevel] !== undefined) counts[item.riskLevel]++;
    });
    return [
      { name: "Critical Risk", value: counts.critical, fill: "#ef4444" },
      { name: "High Risk", value: counts.high, fill: "#f97316" },
      { name: "Moderate Risk", value: counts.medium, fill: "#f59e0b" },
      { name: "Low Risk", value: counts.low, fill: "#10b981" },
    ];
  }, [equipment]);

  const typeBreakdown = useMemo(() => {
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Reveal>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Asset Registry</p>
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
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Equipment Intelligence</h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
              Search, filter, compare, and inspect every monitored biomedical asset across the hospital network in real-time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <EquipmentOnboardModal />
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </Reveal>


      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Assets Monitored" value={equipment.length} hint="Total equipment in registry" icon={Activity} />
        <MetricCard label="Critical Risk" value={critical} hint="Priority intervention required" icon={Gauge} tone="red" />
        <MetricCard label="Usage Discrepancies" value={discrepancy} hint="Counter vs register mismatch" icon={SlidersHorizontal} tone="amber" />
      </section>

      {/* Portfolio Charts */}
      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Reveal>
          <Card className="h-[330px] border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Risk Portfolio</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Distribution across all monitored assets.</p>
            </CardHeader>
            <CardContent className="grid h-[265px] grid-cols-[1fr_180px] items-center gap-2 px-6 py-4">
              <div className="space-y-3">
                {riskPortfolio.map((x) => (
                  <div key={x.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.fill }} />
                      {x.name}
                    </span>
                    <span className="text-xs font-bold text-foreground">{x.value}</span>
                  </div>
                ))}
              </div>
              <div className="h-44">
                <RiskDonut data={riskPortfolio} />
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card className="h-[330px] border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold text-foreground">Equipment Mix</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Coverage by clinical equipment category.</p>
            </CardHeader>
            <CardContent className="h-[265px] pt-4">
              <RiskBars data={typeBreakdown} />
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* Asset Directory Table Card */}
      <Reveal delay={0.1}>
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Asset Directory</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{filtered.length} records match the current filters.</p>
              </div>

              {/* Filter Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, serial, facility..."
                    className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-8 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs"
                  />
                  {query && (
                    <button
                      onClick={() => {
                        setQuery("");
                        setPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <FilterSelect
                  value={risk}
                  onChange={(v) => {
                    setRisk(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "all", label: "All Risk" },
                    { value: "critical", label: "Critical" },
                    { value: "high", label: "High" },
                    { value: "medium", label: "Moderate" },
                    { value: "low", label: "Low" },
                  ]}
                />

                <FilterSelect
                  value={type}
                  onChange={(v) => {
                    setType(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "all", label: "All Types" },
                    { value: "icu", label: "ICU" },
                    { value: "dialysis", label: "Dialysis" },
                    { value: "theatre", label: "Theatre" },
                    { value: "imaging", label: "Imaging" },
                    { value: "radiotherapy", label: "Radiotherapy" },
                  ]}
                />

                <FilterSelect
                  value={county}
                  onChange={(v) => {
                    setCounty(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "all", label: "All Counties" },
                    ...counties.map((c) => ({ value: c, label: c })),
                  ]}
                />

                <FilterSelect
                  value={sort}
                  onChange={(v) => {
                    setSort(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "risk", label: "Sort: Risk" },
                    { value: "lead", label: "Sort: Lead Time" },
                    { value: "name", label: "Sort: Name" },
                    { value: "usage", label: "Sort: Usage" },
                  ]}
                />

                <button
                  onClick={reset}
                  className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-xs"
                >
                  Reset
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    {["Equipment", "Facility", "County", "Type", "Risk", "Lead Time", "Usage", "Maintenance", ""].map((h) => (
                      <th key={h} className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-accent/40">
                      <td className="px-6 py-4">
                        <Link href={`/equipment/${item.id}`}>
                          <p className="text-xs font-bold text-foreground hover:underline">{item.name}</p>
                          <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">{item.serialNumber}</p>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{getFacilityName(item.facilityId)}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {facilities.find((f) => f.id === item.facilityId)?.county}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{formatEquipmentType(item.type)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge level={item.riskLevel} />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-mono font-bold ${item.leadTimeDays <= 14 ? "text-red-500" : "text-foreground"}`}>
                          {item.leadTimeDays}d
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono tabular-nums text-muted-foreground">
                        {item.counterUsage.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold ${
                            item.scenarioPattern === "maintenance-neglect" ? "text-amber-500" : "text-emerald-500"
                          }`}
                        >
                          {item.scenarioPattern === "maintenance-neglect" ? "Attention" : "On track"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/equipment/${item.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-xs"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 && (
              <TableEmptyState
                title="No equipment matches filters"
                description="Try searching a different term or resetting county and risk filters."
                onReset={reset}
              />
            )}

            {filtered.length > 0 && (
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} pageSize={PAGE_SIZE} total={filtered.length} />
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
