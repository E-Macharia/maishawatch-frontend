import type { Equipment, Facility, Alert, RiskLevel } from "@/types/maishawatch";

export const riskLevels: RiskLevel[] = ["critical", "high", "medium", "low"];

export function countByRiskLevel(equipment: Equipment[] = []) {
  return riskLevels.reduce<Record<RiskLevel, number>>((counts, level) => {
    counts[level] = equipment.filter((item) => item.riskLevel === level).length;
    return counts;
  }, { critical: 0, high: 0, medium: 0, low: 0 });
}

export function getOverviewMetrics(
  equipment: Equipment[] = [],
  facilities: Facility[] = [],
  alerts: Alert[] = []
) {
  const risk = countByRiskLevel(equipment);
  const anomalyCount = equipment.reduce(
    (sum, item) => sum + Object.values(item.anomalyCounts ?? {}).reduce((a, b) => a + b, 0),
    0
  );
  const downtimeHours = equipment.reduce(
    (sum, item) => sum + (item.totalDowntimeHours ?? 0),
    0
  );
  const repairCost = equipment.reduce(
    (sum, item) => sum + (item.estimatedRepairCost ?? 0),
    0
  );
  const utilization = equipment.length
    ? equipment.reduce((sum, item) => sum + (item.utilizationRate ?? 0), 0) / equipment.length
    : 0;

  return {
    facilityCount: facilities.length,
    equipmentCount: equipment.length,
    criticalCount: risk.critical,
    highRiskCount: risk.high,
    activeAlertCount: alerts.length,
    discrepancyCount: equipment.filter((item) => item.discrepancyFlagged).length,
    anomalyCount,
    downtimeHours: Number(downtimeHours.toFixed(1)),
    repairCost: Number(repairCost.toFixed(2)),
    utilization: Number((utilization * 100).toFixed(1)),
    risk,
  };
}

export function getFacilityRiskRanking(
  equipmentList: Equipment[] = [],
  facilities: Facility[] = []
) {
  const byFacility = new Map<string, Equipment[]>();
  for (const item of equipmentList) {
    const existing = byFacility.get(item.facilityId) ?? [];
    existing.push(item);
    byFacility.set(item.facilityId, existing);
  }
  return facilities
    .map((facility) => {
      const equipment = byFacility.get(facility.id) ?? [];
      const averageRisk = equipment.length
        ? equipment.reduce((sum, item) => sum + item.riskScore, 0) / equipment.length
        : 0;
      const criticalCount = equipment.filter((item) => item.riskLevel === "critical").length;
      const discrepancyCount = equipment.filter((item) => item.discrepancyFlagged).length;
      const downtimeHours = equipment.reduce(
        (sum, item) => sum + (item.totalDowntimeHours ?? 0),
        0
      );
      return {
        ...facility,
        equipmentCount: equipment.length,
        averageRisk: Math.round(averageRisk),
        criticalCount,
        discrepancyCount,
        downtimeHours: Number(downtimeHours.toFixed(1)),
      };
    })
    .filter((facility) => facility.equipmentCount > 0)
    .sort((a, b) => b.averageRisk - a.averageRisk || b.criticalCount - a.criticalCount);
}
