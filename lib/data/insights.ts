import type { Equipment, Facility, RiskLevel, Alert } from "@/types/maishawatch";

export const equipmentTypeLabels: Record<Equipment["type"], string> = {
  icu: "ICU / Monitoring",
  theatre: "Theatre",
  dialysis: "Dialysis",
  radiotherapy: "Radiotherapy",
  imaging: "Imaging",
};

export function formatEquipmentType(type: Equipment["type"]) {
  return equipmentTypeLabels[type] || "Medical Equipment";
}

export function getOverviewChartData(equipmentList: Equipment[] = []) {
  if (!equipmentList || equipmentList.length === 0) {
    return [
      { label: "Jan", value: 3400, secondary: 3200, discrepancy: 6.2 },
      { label: "Feb", value: 3900, secondary: 3600, discrepancy: 8.1 },
      { label: "Mar", value: 4200, secondary: 3800, discrepancy: 10.5 },
      { label: "Apr", value: 4600, secondary: 4100, discrepancy: 12.2 },
    ];
  }
  const source = equipmentList.flatMap((equipment) =>
    (equipment.usageHistory || []).map((point) => ({ ...point })),
  );
  if (source.length === 0) {
    return [];
  }
  const buckets = new Map<
    string,
    { label: string; value: number; secondary: number; discrepancy: number; count: number }
  >();
  source.forEach((point) => {
    const label = new Date(point.date).toLocaleDateString("en-KE", { month: "short" });
    const current = buckets.get(label) ?? {
      label,
      value: 0,
      secondary: 0,
      discrepancy: 0,
      count: 0,
    };
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
  if (!equipment?.usageHistory?.length) {
    return [];
  }
  return equipment.usageHistory.slice(-10).map((point) => ({
    label: new Date(point.date).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
    }),
    value: point.counterUsage,
    secondary: point.registerUsage,
  }));
}

export function getTelemetryTrend(equipment: Equipment) {
  if (!equipment?.telemetryHistory?.length) {
    return [];
  }
  return equipment.telemetryHistory.slice(-14).map((point) => ({
    label: new Date(point.date).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
    }),
    risk: point.riskScore ?? 0,
    degradation: point.degradationIndex ?? 0,
    utilization: Number(((point.utilizationRate ?? 0) * 100).toFixed(1)),
    temperature: point.temperature ?? 0,
    vibration: point.vibration ?? 0,
  }));
}

export function getRiskPortfolio(equipmentList: Equipment[] = []) {
  const levels: Array<{ name: string; key: RiskLevel; fill: string }> = [
    { name: "Critical", key: "critical", fill: "#f87171" },
    { name: "High", key: "high", fill: "#fb923c" },
    { name: "Moderate", key: "medium", fill: "#fbbf24" },
    { name: "Low", key: "low", fill: "#34d399" },
  ];
  return levels.map((level) => ({
    name: level.name,
    value: equipmentList.filter((item) => item.riskLevel === level.key).length,
    fill: level.fill,
  }));
}

export function getTypeBreakdown(equipmentList: Equipment[] = []) {
  return Object.entries(equipmentTypeLabels).map(([key, label]) => ({
    label,
    value: equipmentList.filter((equipment) => equipment.type === key).length,
  }));
}

export function getFacilitySummary(
  facilityId: string,
  facilityList: Facility[] = [],
  equipmentList: Equipment[] = [],
) {
  const facility = facilityList.find((f) => f.id === facilityId);
  const equipment = equipmentList.filter((item) => item.facilityId === facilityId);
  const riskScore = equipment.length
    ? Math.round(
        equipment.reduce((sum, item) => sum + item.riskScore, 0) /
          equipment.length,
      )
    : 0;
  const critical = equipment.filter((item) => item.riskLevel === "critical").length;
  const discrepancy = equipment.filter((item) => item.discrepancyFlagged).length;
  const downtime = equipment.reduce(
    (sum, item) => sum + (item.totalDowntimeHours ?? 0),
    0,
  );
  const repairCost = equipment.reduce(
    (sum, item) => sum + (item.estimatedRepairCost ?? 0),
    0,
  );
  const utilization = equipment.length
    ? equipment.reduce((sum, item) => sum + (item.utilizationRate ?? 0), 0) /
      equipment.length
    : 0;
  return {
    facility,
    equipment,
    riskScore,
    critical,
    discrepancy,
    downtime,
    repairCost,
    utilization,
  };
}

export function getPriorityEquipment(
  equipmentList: Equipment[] = [],
  facilityList: Facility[] = [],
) {
  const facMap = new Map(facilityList.map((f) => [f.id, f.name]));
  return [...equipmentList]
    .sort((a, b) => a.leadTimeDays - b.leadTimeDays || b.riskScore - a.riskScore)
    .slice(0, 7)
    .map((item) => ({
      ...item,
      facilityName: facMap.get(item.facilityId) || `Facility ${item.facilityId}`,
    }));
}

export function getEquipmentHealthScore(equipment: Equipment) {
  if (!equipment) {
    return { overall: 75, reliability: 80, maintenance: 70, utilization: 65, reporting: 90 };
  }
  const reliability = Math.max(0, 100 - Math.round(equipment.riskScore * 0.78));
  const daysSinceMaintenance = Number.isFinite(
    new Date(equipment.lastMaintenanceDate).getTime(),
  )
    ? Math.max(
        0,
        Math.round(
          (Date.now() - new Date(equipment.lastMaintenanceDate).getTime()) /
            86400000,
        ),
      )
    : 365;
  const maintenance = equipment.maintenanceDue
    ? 42
    : Math.max(
        55,
        100 -
          Math.min(
            45,
            Math.round(
              (daysSinceMaintenance /
                Math.max(1, equipment.maintenanceIntervalDays ?? 180)) *
                45,
            ),
          ),
      );
  const utilization = Math.min(
    100,
    Math.round((equipment.utilizationRate ?? 0) * 100),
  );
  const reporting = Math.max(
    0,
    100 - Math.min(60, Math.round(Math.max(0, equipment.discrepancyPercent))),
  );
  const overall = Math.round(
    reliability * 0.4 +
      maintenance * 0.25 +
      Math.max(40, utilization) * 0.15 +
      reporting * 0.2,
  );
  return {
    overall,
    reliability,
    maintenance,
    utilization: Math.max(40, utilization),
    reporting,
  };
}

export function getRiskDrivers(equipment: Equipment) {
  if (!equipment) return [];
  const factors = [
    {
      label: "Modeled risk score",
      value: Math.round(equipment.riskScore * 0.42),
    },
    { label: "Maintenance state", value: equipment.maintenanceDue ? 22 : 7 },
    {
      label: "Degradation trend",
      value: Math.min(18, Math.round((equipment.degradationIndex ?? 0) * 18)),
    },
    {
      label: "Reporting discrepancy",
      value: Math.min(
        12,
        Math.round(Math.max(0, equipment.discrepancyPercent) / 4),
      ),
    },
    {
      label: "Sensor anomalies",
      value: Math.min(
        12,
        Object.values(equipment.anomalyCounts ?? {}).reduce(
          (a, b) => a + b,
          0,
        ),
      ),
    },
  ];
  const total = factors.reduce((sum, item) => sum + item.value, 0);
  const multiplier = total > 0 ? equipment.riskScore / total : 1;
  return factors.map((item) => ({
    ...item,
    value: Math.max(1, Math.round(item.value * multiplier)),
  }));
}

export function getFailureSummary(equipment: Equipment) {
  const events = equipment?.failureEvents ?? [];
  return {
    count: equipment?.failureCount ?? events.length,
    downtimeHours: equipment?.totalDowntimeHours ?? 0,
    repairCost: equipment?.estimatedRepairCost ?? 0,
    latest: events.at(-1),
  };
}

export function getCountyRiskRanking(
  equipmentList: Equipment[] = [],
  facilityList: Facility[] = [],
) {
  const facMap = new Map(facilityList.map((f) => [f.id, f]));
  const grouped = new Map<
    string,
    {
      count: number;
      riskTotal: number;
      critical: number;
      discrepancies: number;
      downtime: number;
    }
  >();
  for (const item of equipmentList) {
    const facility = facMap.get(item.facilityId);
    const county = facility?.county ?? "Unknown";
    const current = grouped.get(county) ?? {
      count: 0,
      riskTotal: 0,
      critical: 0,
      discrepancies: 0,
      downtime: 0,
    };
    current.count += 1;
    current.riskTotal += item.riskScore;
    current.critical += item.riskLevel === "critical" ? 1 : 0;
    current.discrepancies += item.discrepancyFlagged ? 1 : 0;
    current.downtime += item.totalDowntimeHours ?? 0;
    grouped.set(county, current);
  }
  return [...grouped.entries()]
    .map(([county, values]) => ({
      county,
      equipmentCount: values.count,
      averageRisk: Math.round(values.riskTotal / values.count),
      criticalCount: values.critical,
      discrepancyCount: values.discrepancies,
      downtimeHours: Number(values.downtime.toFixed(1)),
    }))
    .sort(
      (a, b) =>
        b.averageRisk - a.averageRisk || b.criticalCount - a.criticalCount,
    );
}

export function getFacilityEligibilitySummary(facility: Facility | undefined) {
  if (!facility) return [];
  const entries = Object.entries(facility.eligibility ?? {});
  return entries.map(([key, eligible]) => ({
    label: key
      .replace(/[A-Z]/g, (m) => ` ${m}`)
      .replace(/^./, (m) => m.toUpperCase()),
    eligible,
  }));
}
