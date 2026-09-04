"use client";
import { Activity, AlertTriangle, Gauge, Thermometer, Waves, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TelemetryRiskChart } from "@/components/dashboard/charts";
import { getTelemetryTrend } from "@/lib/data/insights";
import type { Equipment } from "@/types/maishawatch";

export function TelemetryInsights({ equipment }: { equipment: Equipment }) {
  const env = equipment.environment ?? {};
  const anomalies = equipment.anomalyCounts ?? { temperature: 0, vibration: 0, pressure: 0, flow: 0, power: 0 };
  const totalAnomalies = Object.values(anomalies).reduce((a, b) => a + b, 0);
  const trend = getTelemetryTrend(equipment);
  const sensors = [
    { label: "Temperature", value: env.temperature ?? 0, unit: "°C", icon: Thermometer },
    { label: "Vibration", value: env.vibration ?? 0, unit: "g", icon: Waves },
    { label: "Pressure", value: env.pressure ?? 0, unit: "kPa", icon: Gauge },
    { label: "Power", value: env.powerConsumption ?? 0, unit: "kW", icon: Zap },
  ];
  return <div className="space-y-4">
    <Card className="border-white/[0.07] bg-white/[0.025] ring-0">
      <CardHeader className="border-b border-white/[0.06] pb-4"><div className="flex items-center justify-between"><div><CardTitle className="text-[15px] font-semibold text-white">Condition telemetry</CardTitle><p className="mt-1 text-[13px] text-slate-500">Backend-derived risk, degradation, utilization and sensor trend.</p></div><span className="inline-flex items-center gap-1.5 rounded-[5px] border border-emerald-400/15 bg-emerald-400/[0.05] px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-emerald-500"><Activity className="h-3 w-3"/> Live snapshot</span></div></CardHeader>
      <CardContent className="h-[300px] pt-4"><TelemetryRiskChart data={trend}/></CardContent>
    </Card>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {sensors.map(sensor=>{const Icon=sensor.icon; return <Card key={sensor.label} className="border-white/[0.07] bg-white/[0.025] ring-0"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{sensor.label}</span><Icon className="h-3.5 w-3.5 text-slate-500"/></div><p className="mt-2 text-lg font-semibold text-white">{typeof sensor.value === "number" ? sensor.value.toFixed(sensor.label === "Vibration" ? 3 : 1) : sensor.value} <span className="text-[12px] font-normal text-slate-500">{sensor.unit}</span></p></CardContent></Card>})}
    </div>
    <Card className={totalAnomalies>0 ? "border-amber-400/15 bg-amber-400/[0.03] ring-0" : "border-emerald-400/15 bg-emerald-400/[0.03] ring-0"}><CardContent className="flex items-start gap-3 p-4"><AlertTriangle className={totalAnomalies>0?"mt-0.5 h-4 w-4 text-amber-400":"mt-0.5 h-4 w-4 text-emerald-400"}/><div><p className="text-xs font-semibold text-foreground">{totalAnomalies} recent sensor anomalies</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Latest operational code: <span className="font-semibold text-foreground">{equipment.latestErrorCode ?? "NONE"}</span> · Condition: <span className="font-semibold text-foreground">{equipment.conditionStatus ?? "Unknown"}</span> · Status: <span className="font-semibold text-foreground">{equipment.operationalStatus ?? "Unknown"}</span></p></div></CardContent></Card>
  </div>;
}
