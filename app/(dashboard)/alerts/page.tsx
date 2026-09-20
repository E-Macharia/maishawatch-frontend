"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
	AlertTriangle,
	ArrowUpRight,
	BellRing,
	CheckCircle2,
	CircleAlert,
	Search,
	Send,
	X,
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
import { AlertResolutionDialog } from "@/components/dashboard/alert-resolution-dialog";
import { HospitalAlertDialog } from "@/components/dashboard/hospital-alert-dialog";
import { api } from "@/lib/api/backend-client";
import type { Alert } from "@/types/maishawatch";

const PAGE_SIZE = 8;

export default function AlertsPage() {
  const [severity, setSeverity] = useState("all");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [resolved, setResolved] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [notify, setNotify] = useState<Alert | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<Alert[] | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    try {
      setResolved(JSON.parse(localStorage.getItem("maisha-resolved-alerts") || "[]"));
    } catch {}
  }, []);

  // Fetch live alerts from backend
  useEffect(() => {
    let mounted = true;

    async function loadAlerts() {
      try {
        const res = await api.alerts.list().catch(() => null);
        if (!mounted) return;
        const rawItems = Array.isArray(res) ? res : res?.items || res?.alerts || [];
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const mapped: Alert[] = rawItems.map((item: any) => ({
            id: String(item.id),
            type: (item.alert_type?.toLowerCase().includes("discrepancy") ? "discrepancy" : "risk") as "risk" | "discrepancy",
            severity: (item.severity?.toLowerCase() || "medium") as "critical" | "high" | "medium" | "low",
            equipmentId: item.equipment_id || item.equipmentId || "",
            facilityId: item.facility_id || item.facilityId || "",
            message: item.message || item.title || "Alert triggered",
            scenarioRationale: item.recommendation || item.scenarioRationale || "",
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
          }));
          setLiveAlerts(mapped);
          setIsLiveConnected(true);
        } else if (res !== null && res !== undefined) {
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.warn("Could not fetch alerts from backend, using offline dataset", err);
      }
    }

    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const alertsSource = useMemo(() => {
    if (liveAlerts && liveAlerts.length > 0) {
      return liveAlerts;
    }
    return maishawatchData.alerts;
  }, [liveAlerts]);

  const filtered = useMemo(
    () =>
      alertsSource.filter(
        (a) =>
          !resolved.includes(a.id) &&
          (severity === "all" || a.severity === severity) &&
          (type === "all" || a.type === type) &&
          (!query ||
            `${getEquipmentName(a.equipmentId)} ${getFacilityName(a.facilityId)} ${a.message}`
              .toLowerCase()
              .includes(query.toLowerCase()))
      ),
    [alertsSource, severity, type, query, resolved]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const critical = alertsSource.filter((x) => x.severity === "critical" && !resolved.includes(x.id)).length;
  const discrepancies = alertsSource.filter((x) => x.type === "discrepancy" && !resolved.includes(x.id)).length;

  const resolve = (id: string) => {
    const nextResolved = Array.from(new Set([...resolved, id]));
    setResolved(nextResolved);
    try {
      localStorage.setItem("maisha-resolved-alerts", JSON.stringify(nextResolved));
    } catch {}

    // Synchronize resolution to live backend
    api.alerts.resolve(id).catch((err) => {
      console.warn(`Failed to resolve alert ${id} on backend:`, err);
    });

    setSelected(null);
    setPage(1);
  };

  const reset = () => {
    setQuery("");
    setSeverity("all");
    setType("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {selected && (
        <AlertResolutionDialog
          alert={selected}
          equipment={
            equipmentById.get(selected.equipmentId) ?? ({
              id: selected.equipmentId,
              name: getEquipmentName(selected.equipmentId) || "Biomedical Asset",
              model: "Medical Device",
              serialNumber: selected.equipmentId,
              facilityId: selected.facilityId,
              department: "Clinical Engineering",
              installDate: new Date().toISOString(),
              status: "active",
              riskLevel: selected.severity,
            } as any)
          }
          onClose={() => setSelected(null)}
          onResolved={resolve}
        />
      )}
      {notify && (
        <HospitalAlertDialog
          alert={notify}
          equipment={
            equipmentById.get(notify.equipmentId) ?? ({
              id: notify.equipmentId,
              name: getEquipmentName(notify.equipmentId) || "Biomedical Asset",
              model: "Medical Device",
              serialNumber: notify.equipmentId,
              facilityId: notify.facilityId,
              department: "Clinical Engineering",
              installDate: new Date().toISOString(),
              status: "active",
              riskLevel: notify.severity,
            } as any)
          }
          facility={
            facilityById.get(notify.facilityId) ?? ({
              id: notify.facilityId,
              name: getFacilityName(notify.facilityId) || "Healthcare Facility",
              county: "Kenya",
              level: 4,
              type: "Hospital",
              coordinates: { lat: -1.286389, lng: 36.817223 },
            } as any)
          }
          onClose={() => setNotify(null)}
        />
      )}

      {/* Header Banner */}
      <Reveal>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Operational Signals</p>
            {isLiveConnected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Backend Connected
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Alert Centre</h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
            Turn risk signals into verified biomedical maintenance actions and auditable hospital notifications.
          </p>
        </div>
      </Reveal>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Open Alerts"
          value={alertsSource.length - resolved.filter((id) => alertsSource.some((a) => a.id === id)).length}
          hint="Signals requiring intervention"
          icon={BellRing}
          tone="amber"
        />
        <MetricCard label="Critical Urgency" value={critical} hint="Shortest predicted failure lead times" icon={AlertTriangle} tone="red" />
        <MetricCard label="Usage Discrepancies" value={discrepancies} hint="Counter vs register mismatch" icon={CircleAlert} tone="blue" />
      </section>

      {/* Signal Queue Card */}
      <Reveal delay={0.08}>
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Signal Queue</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{filtered.length} open signals match the current view.</p>
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
                    placeholder="Search alert, asset, facility..."
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
                  value={severity}
                  onChange={(v) => {
                    setSeverity(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "all", label: "All Severity" },
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
                    { value: "risk", label: "Risk" },
                    { value: "discrepancy", label: "Discrepancy" },
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
            <div className="divide-y divide-border">
              {rows.map((alert) => (
                <div key={alert.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-accent/40 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                        alert.severity === "critical"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {alert.type === "risk" ? <AlertTriangle className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-foreground">{getEquipmentName(alert.equipmentId)}</p>
                        <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {alert.type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{alert.message}</p>
                      <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/80">
                        {getFacilityName(alert.facilityId)} •{" "}
                        {new Date(alert.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                    <StatusBadge level={alert.severity} />
                    <Link
                      href={`/equipment/${alert.equipmentId}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-xs"
                    >
                      Inspect <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => setNotify(alert)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-xs cursor-pointer"
                    >
                      <Send className="h-3 w-3" /> Notify
                    </button>
                    <button
                      onClick={() => setSelected(alert)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Resolve
                    </button>
                  </div>
                </div>
              ))}

              {rows.length === 0 && (
                <TableEmptyState
                  title="No open signals match filters"
                  description="All alerts in this view have been resolved or filtered out."
                  onReset={reset}
                />
              )}
            </div>

            {filtered.length > 0 && (
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} pageSize={PAGE_SIZE} total={filtered.length} />
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
