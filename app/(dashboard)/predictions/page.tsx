"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CircleAlert,
  Search,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Reveal } from "@/components/dashboard/motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/dashboard/pagination";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { TableEmptyState } from "@/components/dashboard/table-empty-state";
import { useLiveData } from "@/lib/data/live-context";
import { getPredictionView } from "@/lib/data/prediction-helpers";
import { PredictionPanel } from "@/components/dashboard/prediction-panel";
import type { RiskLevel } from "@/types/maishawatch";

const PAGE_SIZE = 8;

export default function PredictionsPage() {
  const { equipment, isLive, isLoading, refresh, getFacilityName } = useLiveData();
  const [level, setLevel] = useState("all");
  const [source, setSource] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const all = useMemo(() => {
    return equipment
      .map((item) => ({
        equipment: item,
        view: getPredictionView(item),
      }))
      .sort((a, b) => b.view.maxProb - a.view.maxProb);
  }, [equipment]);

  const summary = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let modelCount = 0;
    let telemetryCount = 0;

    for (const { view } of all) {
      if (view.level === "critical") critical++;
      else if (view.level === "high") high++;
      else if (view.level === "medium") medium++;
      else low++;

      if (view.source === "model") modelCount++;
      else telemetryCount++;
    }

    return {
      total: all.length,
      critical,
      high,
      medium,
      low,
      modelCount,
      telemetryCount,
    };
  }, [all]);

  const filtered = useMemo(() => {
    return all.filter(({ equipment, view }) => {
      if (level !== "all" && view.level !== level) return false;
      if (source !== "all" && view.source !== source) return false;
      if (q.trim()) {
        const hay =
          `${equipment.name} ${equipment.id} ${getFacilityName(equipment.facilityId)}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [all, level, source, q, getFacilityName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected =
    all.find((r) => r.equipment.id === selectedId) ?? pageRows[0] ?? null;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                AI Predictions
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isLive
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                {isLive ? "Live ML API Connected" : "Connecting to API..."}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Failure probability across 24h / 72h / 7-day horizons. Live model output from backend /predict API.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              {summary.modelCount} model-backed · {summary.telemetryCount} fallback
            </div>
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Critical"
            value={summary.critical}
            hint="Immediate attention"
            icon={CircleAlert}
            tone="red"
          />
          <MetricCard
            label="High"
            value={summary.high}
            hint="Urgent maintenance"
            icon={AlertTriangle}
            tone="amber"
          />
          <MetricCard
            label="Medium"
            value={summary.medium}
            hint="Increase monitoring"
            icon={Activity}
            tone="blue"
          />
          <MetricCard
            label="Low"
            value={summary.low}
            hint="Routine watch"
            icon={ShieldCheck}
            tone="emerald"
          />
        </div>
      </Reveal>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Reveal delay={0.08}>
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Predicted risk ranking
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sorted by maximum failure probability across horizons.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search equipment…"
                      className="h-9 w-44 rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <FilterSelect
                    value={level}
                    onChange={(v) => {
                      setLevel(v);
                      setPage(1);
                    }}
                    options={[
                      { value: "all", label: "All levels" },
                      { value: "critical", label: "Critical" },
                      { value: "high", label: "High" },
                      { value: "medium", label: "Medium" },
                      { value: "low", label: "Low" },
                    ]}
                  />
                  <FilterSelect
                    value={source}
                    onChange={(v) => {
                      setSource(v);
                      setPage(1);
                    }}
                    options={[
                      { value: "all", label: "All sources" },
                      { value: "model", label: "Model only" },
                      { value: "telemetry", label: "Fallback only" },
                    ]}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pageRows.length === 0 ? (
                <TableEmptyState
                  title="No matching predictions"
                  description="Try clearing filters or re-run the data sync with models enabled."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-bold">Equipment</th>
                        <th className="px-4 py-3 font-bold">24h</th>
                        <th className="px-4 py-3 font-bold">72h</th>
                        <th className="px-4 py-3 font-bold">7d</th>
                        <th className="px-4 py-3 font-bold">RUL</th>
                        <th className="px-4 py-3 font-bold">Level</th>
                        <th className="px-4 py-3 font-bold">Source</th>
                        <th className="px-4 py-3 font-bold" />
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map(({ equipment, view }) => (
                        <tr
                          key={equipment.id}
                          onClick={() => setSelectedId(equipment.id)}
                          className={`cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40 ${
                            selected?.equipment.id === equipment.id
                              ? "bg-primary/5"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground">
                              {equipment.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {getFacilityName(equipment.facilityId)} ·{" "}
                              <span className="font-mono">{equipment.id}</span>
                            </p>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {Math.round(view.p24 * 100)}%
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {Math.round(view.p72 * 100)}%
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {Math.round(view.p168 * 100)}%
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {view.rulHours}h
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge level={view.level as RiskLevel} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                              {view.source === "model" ? (
                                <Sparkles className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Activity className="h-3 w-3 text-amber-500" />
                              )}
                              {view.source}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/equipment/${equipment.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="border-t border-border px-4 py-3">
                <Pagination
                  page={page}
                  pageCount={totalPages}
                  pageSize={PAGE_SIZE}
                  total={filtered.length}
                  onPageChange={setPage}
                />
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.12}>
          {selected ? (
            <PredictionPanel
              equipment={selected.equipment}
              facilityId={selected.equipment.facilityId}
              enableNotify
            />
          ) : (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Select a row to inspect AI prediction details and notify the
                team.
              </CardContent>
            </Card>
          )}
        </Reveal>
      </div>
    </div>
  );
}
