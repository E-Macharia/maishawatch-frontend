import { maishawatchData, getFacilityName } from "@/lib/data";
import type { Equipment, Facility, RiskLevel } from "@/types/maishawatch";

export const equipmentTypeLabels: Record<Equipment["type"], string> = {
  icu: "ICU / Monitoring",
  theatre: "Theatre",
  dialysis: "Dialysis",
  radiotherapy: "Radiotherapy",
  imaging: "Imaging",
};

export function formatEquipmentType(type: Equipment["type"]) {
  return equipmentTypeLabels[type];
}

export function getEquipmentById(id: string) {
  return maishawatchData.equipment.find((item) => item.id === id);
}

export function getFacilityById(id: string) {
  return maishawatchData.facilities.find((item) => item.id === id);
}

export function getEquipmentForFacility(facilityId: string) {
  return maishawatchData.equipment.filter((item) => item.facilityId === facilityId);
}

export function getAlertsForEquipment(equipmentId: string) {
  return maishawatchData.alerts.filter((alert) => alert.equipmentId === equipmentId);
}

export function getOverviewChartData() {
  const source = maishawatchData.equipment.flatMap((equipment) => equipment.usageHistory.map((point) => ({ ...point })));
  const buckets = new Map<string, { label: string; value: number; secondary: number; discrepancy: number; count: number }>();
  source.forEach((point) => {
    const label = new Date(point.date).toLocaleDateString("en-KE", { month: "short" });
    const current = buckets.get(label) ?? { label, value: 0, secondary: 0, discrepancy: 0, count: 0 };
    current.value += point.counterUsage;
    current.secondary += point.registerUsage;
    current.discrepancy += point.discrepancyPercent ?? 0;
    current.count += 1;
    buckets.set(label, current);
  });
  return [...buckets.values()].slice(-8).map((item) => ({
    label: item.label,
    value: Math.round(item.value / item.count),
    secondary: Math.round(item.secondary / item.count),
    discrepancy: Number((item.discrepancy / item.count).toFixed(1)),
  }));
}

export function getEquipmentTrend(equipment: Equipment) {
  return equipment.usageHistory.slice(-10).map((point) => ({
    label: new Date(point.date).toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
    value: point.counterUsage,
    secondary: point.registerUsage,
  }));
}

export function getTelemetryTrend(equipment: Equipment) {
  return equipment.telemetryHistory.slice(-14).map((point) => ({
    label: new Date(point.date).toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
    risk: point.riskScore ?? 0,
    degradation: point.degradationIndex ?? 0,
    utilization: Number(((point.utilizationRate ?? 0) * 100).toFixed(1)),
    temperature: point.temperature ?? 0,
    vibration: point.vibration ?? 0,
  }));
}

export function getRiskPortfolio() {
  const levels: Array<{ name: string; key: RiskLevel; fill: string }> = [
    { name: "Critical", key: "critical", fill: "#f87171" },
    { name: "High", key: "high", fill: "#fb923c" },
    { name: "Moderate", key: "medium", fill: "#fbbf24" },
    { name: "Low", key: "low", fill: "#34d399" },
  ];
  return levels.map((level) => ({ name: level.name, value: maishawatchData.equipment.filter((item) => item.riskLevel === level.key).length, fill: level.fill }));
}

export function getTypeBreakdown() {
  return Object.entries(equipmentTypeLabels).map(([key, label]) => ({
    label,
    value: maishawatchData.equipment.filter((equipment) => equipment.type === key).length,
  }));
}

export function getFacilitySummary(facilityId: string) {
  const facility = getFacilityById(facilityId);
  const equipment = getEquipmentForFacility(facilityId);
  const riskScore = equipment.length ? Math.round(equipment.reduce((sum, item) => sum + item.riskScore, 0) / equipment.length) : 0;
  const critical = equipment.filter((item) => item.riskLevel === "critical").length;
  const discrepancy = equipment.filter((item) => item.discrepancyFlagged).length;
  const downtime = equipment.reduce((sum, item) => sum + (item.totalDowntimeHours ?? 0), 0);
  const repairCost = equipment.reduce((sum, item) => sum + (item.estimatedRepairCost ?? 0), 0);
  const utilization = equipment.length ? equipment.reduce((sum, item) => sum + (item.utilizationRate ?? 0), 0) / equipment.length : 0;
  return { facility, equipment, riskScore, critical, discrepancy, downtime, repairCost, utilization };
}

export function getPriorityEquipment() {
  return [...maishawatchData.equipment]
    .sort((a, b) => a.leadTimeDays - b.leadTimeDays || b.riskScore - a.riskScore)
    .slice(0, 7)
    .map((item) => ({ ...item, facilityName: getFacilityName(item.facilityId) }));
}

export function getEquipmentHealthScore(equipment: Equipment) {
  const reliability = Math.max(0, 100 - Math.round(equipment.riskScore * 0.78));
  const daysSinceMaintenance = Number.isFinite(new Date(equipment.lastMaintenanceDate).getTime()) ? Math.max(0, Math.round((Date.now() - new Date(equipment.lastMaintenanceDate).getTime()) / 86400000)) : 365;
  const maintenance = equipment.maintenanceDue ? 42 : Math.max(55, 100 - Math.min(45, Math.round((daysSinceMaintenance / Math.max(1, equipment.maintenanceIntervalDays ?? 180)) * 45)));
  const utilization = Math.min(100, Math.round((equipment.utilizationRate ?? 0) * 100));
  const reporting = Math.max(0, 100 - Math.min(60, Math.round(Math.max(0, equipment.discrepancyPercent))));
  const overall = Math.round(reliability * 0.4 + maintenance * 0.25 + Math.max(40, utilization) * 0.15 + reporting * 0.2);
  return { overall, reliability, maintenance, utilization: Math.max(40, utilization), reporting };
}

export function getRiskDrivers(equipment: Equipment) {
  const factors = [
    { label: "Modeled risk score", value: Math.round(equipment.riskScore * 0.42) },
    { label: "Maintenance state", value: equipment.maintenanceDue ? 22 : 7 },
    { label: "Degradation trend", value: Math.min(18, Math.round((equipment.degradationIndex ?? 0) * 18)) },
    { label: "Reporting discrepancy", value: Math.min(12, Math.round(Math.max(0, equipment.discrepancyPercent) / 4)) },
    { label: "Sensor anomalies", value: Math.min(12, Object.values(equipment.anomalyCounts ?? {}).reduce((a, b) => a + b, 0)) },
  ];
  const total = factors.reduce((sum, item) => sum + item.value, 0);
  const multiplier = total > 0 ? equipment.riskScore / total : 1;
  return factors.map((item) => ({ ...item, value: Math.max(1, Math.round(item.value * multiplier)) }));
}

export function getFailureSummary(equipment: Equipment) {
  const events = equipment.failureEvents ?? [];
  return {
    count: equipment.failureCount ?? events.length,
    downtimeHours: equipment.totalDowntimeHours ?? 0,
    repairCost: equipment.estimatedRepairCost ?? 0,
    latest: events.at(-1),
  };
}

export function getCountyRiskRanking() {
  const grouped = new Map<string, { count: number; riskTotal: number; critical: number; discrepancies: number; downtime: number }>();
  for (const item of maishawatchData.equipment) {
    const facility = getFacilityById(item.facilityId);
    const county = facility?.county ?? "Unknown";
    const current = grouped.get(county) ?? { count: 0, riskTotal: 0, critical: 0, discrepancies: 0, downtime: 0 };
    current.count += 1;
    current.riskTotal += item.riskScore;
    current.critical += item.riskLevel === "critical" ? 1 : 0;
    current.discrepancies += item.discrepancyFlagged ? 1 : 0;
    current.downtime += item.totalDowntimeHours ?? 0;
    grouped.set(county, current);
  }
  return [...grouped.entries()]
    .map(([county, values]) => ({ county, equipmentCount: values.count, averageRisk: Math.round(values.riskTotal / values.count), criticalCount: values.critical, discrepancyCount: values.discrepancies, downtimeHours: Number(values.downtime.toFixed(1)) }))
    .sort((a, b) => b.averageRisk - a.averageRisk || b.criticalCount - a.criticalCount);
}

export function getFacilityEligibilitySummary(facility: Facility | undefined) {
  if (!facility) return [];
  const entries = Object.entries(facility.eligibility ?? {});
  return entries.map(([key, eligible]) => ({ label: key.replace(/[A-Z]/g, (m) => ` ${m}`).replace(/^./, (m) => m.toUpperCase()), eligible }));
}
