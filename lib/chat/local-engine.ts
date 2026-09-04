import { maishawatchData, facilityById, equipmentById } from "@/lib/data";
import { getOverviewMetrics } from "@/lib/data/metrics";
import type { ChatMessage, RichCardPayload } from "@/types/chat";
import type { Equipment, Facility, RiskLevel } from "@/types/maishawatch";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function equipmentToCard(item: Equipment): RichCardPayload {
  const facility = facilityById.get(item.facilityId);
  return {
    type: "equipment",
    data: {
      id: item.id,
      name: item.name,
      type: item.type.toUpperCase(),
      facilityName: facility?.name ?? "Unknown Facility",
      county: facility?.county ?? "Unknown County",
      riskLevel: item.riskLevel,
      riskScore: item.riskScore,
      rulHours: item.rulHours,
      discrepancyPercent: item.discrepancyPercent,
      discrepancyFlagged: item.discrepancyFlagged,
      maintenanceDue: item.maintenanceDue,
      status: item.operationalStatus ?? "Active",
    },
  };
}

function facilityToCard(facility: Facility, equipCount: number, criticalCount: number): RichCardPayload {
  return {
    type: "facility",
    data: {
      id: facility.id,
      name: facility.name,
      county: facility.county,
      serviceLevel: facility.serviceLevel,
      beds: facility.beds,
      operationStatus: facility.operationStatus,
      equipmentCount: equipCount,
      highRiskCount: criticalCount,
    },
  };
}

export function processLocalQuery(query: string): ChatMessage {
  const q = query.toLowerCase().trim();
  const id = `msg-${Date.now()}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 1. Direct Equipment ID Match (e.g. ME-00002, me-00015)
  const equipmentIdMatch = q.match(/me-\d+/i);
  if (equipmentIdMatch) {
    const targetId = equipmentIdMatch[0].toUpperCase();
    const item = equipmentById.get(targetId);
    if (item) {
      const facility = facilityById.get(item.facilityId);
      const content = `### Equipment Analysis: **${item.name}** (${item.id})
- **Location:** ${facility?.name ?? "Unknown"} (${facility?.county ?? "N/A"})
- **Risk Level:** **${item.riskLevel.toUpperCase()}** (Score: ${item.riskScore}/100)
- **Remaining Useful Life (RUL):** ${item.rulHours ? `${item.rulHours} hrs` : "N/A"}
- **Maintenance Status:** ${item.maintenanceDue ? "⚠️ Overdue / Due Soon" : "Up to date"}
- **Usage Discrepancy:** ${item.discrepancyPercent}% ${item.discrepancyFlagged ? "(FLAGGED)" : ""}
- **Telemetry Condition:** ${item.conditionStatus ?? "Normal"} (Degradation Index: ${item.degradationIndex ?? 0})
- **Failure Exposure:** ${item.failureCount ?? 0} failure events recorded, KES ${(item.estimatedRepairCost ?? 0).toLocaleString()} estimated repair cost.

*Rationale:* ${item.scenarioRationale || "Continuous multi-sensor telemetry monitoring active."}`;

      return {
        id,
        role: "assistant",
        content,
        timestamp,
        cards: [equipmentToCard(item)],
        navigationAction: {
          label: `Open ${item.id} Detail Page`,
          path: `/equipment/${item.id}`,
        },
        suggestedPrompts: [
          `What is the maintenance history for ${item.id}?`,
          `Show telemetry anomalies for ${item.id}`,
          `List critical alerts`,
        ],
      };
    }
  }

  // 2. Multi-Attribute Entity & Intent Classifier
  const counties = Array.from(new Set(maishawatchData.facilities.map((f) => f.county).filter(Boolean)));
  const matchedCounty = counties.find((c) => q.includes(c.toLowerCase()));
  const matchedFacility = maishawatchData.facilities.find((f) => q.includes(f.name.toLowerCase()));

  const isCritical = q.includes("critical") || q.includes("urgent");
  const isHighRisk = q.includes("high risk") || q.includes("high-risk");
  const isMediumRisk = q.includes("medium risk") || q.includes("medium-risk");
  const isLowRisk = q.includes("low risk") || q.includes("low-risk");
  const hasRiskFilter = isCritical || isHighRisk || isMediumRisk || isLowRisk || q.includes("at risk");

  const isOverdue = q.includes("overdue") || q.includes("maintenance") || q.includes("repair") || q.includes("service") || q.includes("servicing");
  const isDiscrepancy = q.includes("discrepancy") || q.includes("fraud") || q.includes("counter") || q.includes("register") || q.includes("unreported");
  const isAlerts = q.includes("alert") || q.includes("anomaly") || q.includes("sensor") || q.includes("telemetry");

  const equipmentTypeKeywords = [
    { key: "ventilator", label: "Ventilator" },
    { key: "dialysis", label: "Hemodialysis" },
    { key: "hemodialysis", label: "Hemodialysis" },
    { key: "mri", label: "MRI" },
    { key: "ct", label: "CT Scanner" },
    { key: "x-ray", label: "X-Ray" },
    { key: "xray", label: "X-Ray" },
    { key: "anesthesia", label: "Anesthesia" },
    { key: "monitor", label: "Patient Monitor" },
    { key: "ultrasound", label: "Ultrasound" },
  ];
  const matchedTypeObj = equipmentTypeKeywords.find((t) => q.includes(t.key));
  const matchedTypeLabel = matchedTypeObj?.label;

  // --- PRECISE SPECIFIC FILTERING ROUTE ---
  // If user query mentions a County or Facility combined with Risk, Equipment Type, Overdue, or Discrepancy:
  if (matchedCounty || matchedFacility || (hasRiskFilter && (matchedTypeLabel || isOverdue || isDiscrepancy || matchedCounty))) {
    let filteredEquipment = [...maishawatchData.equipment];

    // Filter by County if specified
    if (matchedCounty) {
      filteredEquipment = filteredEquipment.filter((item) => {
        const fac = facilityById.get(item.facilityId);
        return fac && fac.county.toLowerCase() === matchedCounty.toLowerCase();
      });
    }

    // Filter by Facility if specified
    if (matchedFacility) {
      filteredEquipment = filteredEquipment.filter((item) => item.facilityId === matchedFacility.id);
    }

    // Filter by Equipment Type if specified
    if (matchedTypeLabel) {
      filteredEquipment = filteredEquipment.filter((item) =>
        item.name.toLowerCase().includes(matchedTypeObj!.key) ||
        item.type.toLowerCase().includes(matchedTypeObj!.key) ||
        item.backendEquipmentType?.toLowerCase().includes(matchedTypeObj!.key)
      );
    }

    // Filter by Risk Level if specified
    if (hasRiskFilter) {
      if (isCritical) {
        filteredEquipment = filteredEquipment.filter((item) => item.riskLevel === "critical" || item.riskLevel === "high");
      } else if (isHighRisk) {
        filteredEquipment = filteredEquipment.filter((item) => item.riskLevel === "high");
      } else if (isMediumRisk) {
        filteredEquipment = filteredEquipment.filter((item) => item.riskLevel === "medium");
      } else if (isLowRisk) {
        filteredEquipment = filteredEquipment.filter((item) => item.riskLevel === "low");
      }
    }

    // Filter by Maintenance status if specified
    if (isOverdue) {
      filteredEquipment = filteredEquipment.filter((item) => item.maintenanceDue);
    }

    // Filter by Usage Discrepancy status if specified
    if (isDiscrepancy) {
      filteredEquipment = filteredEquipment.filter((item) => item.discrepancyFlagged || item.discrepancyPercent > 15);
    }

    filteredEquipment.sort((a, b) => b.riskScore - a.riskScore);

    // Build context-aware summary header
    const scopeParts: string[] = [];
    if (isCritical) scopeParts.push("Critical Risk");
    else if (isHighRisk) scopeParts.push("High Risk");
    else if (hasRiskFilter) scopeParts.push("At-Risk");

    if (isOverdue) scopeParts.push("Overdue Maintenance");
    if (isDiscrepancy) scopeParts.push("Usage Discrepancy");
    if (matchedTypeLabel) scopeParts.push(matchedTypeLabel);

    const scopeTitle = scopeParts.length > 0 ? scopeParts.join(" ") : "Monitored";
    const locationTitle = matchedFacility
      ? `at ${matchedFacility.name}`
      : matchedCounty
      ? `in **${matchedCounty} County**`
      : "across the network";

    if (filteredEquipment.length > 0) {
      const topCards = filteredEquipment.slice(0, 3).map(equipmentToCard);
      const listContent = filteredEquipment
        .slice(0, 5)
        .map((item, idx) => {
          const fac = facilityById.get(item.facilityId);
          return `${idx + 1}. **${item.name}** (${item.id}) — **${item.riskLevel.toUpperCase()}** (${item.riskScore}/100) | Location: ${fac?.name ?? "N/A"} (${fac?.county ?? "N/A"})`;
        })
        .join("\n");

      const content = `### Found ${filteredEquipment.length} ${scopeTitle} Asset${filteredEquipment.length > 1 ? "s" : ""} ${locationTitle}:

${listContent}

*Action:* Click any equipment card below for instant telemetry and service diagnostics.`;

      return {
        id,
        role: "assistant",
        content,
        timestamp,
        cards: topCards,
        navigationAction: {
          label: matchedCounty ? `View ${matchedCounty} Equipment` : "View Equipment List",
          path: matchedCounty ? `/equipment?county=${encodeURIComponent(matchedCounty)}` : "/equipment",
        },
        suggestedPrompts: [
          `Show facilities in ${matchedCounty || "Nairobi"}`,
          "List all critical alerts",
          "What is the total network repair cost exposure?",
        ],
      };
    } else {
      // Precise zero-result message giving exact context instead of incorrect global data
      const allFacilityAssets = matchedCounty
        ? maishawatchData.equipment.filter((item) => facilityById.get(item.facilityId)?.county.toLowerCase() === matchedCounty.toLowerCase())
        : maishawatchData.equipment;

      const fallbackCards = allFacilityAssets.slice(0, 3).map(equipmentToCard);
      const content = `### Status Notice for ${locationTitle}
No equipment assets match your filter (**${scopeTitle}**) ${locationTitle}.

Monitored assets in this scope are operating within acceptable parameters. Here are the active assets in this region:`;

      return {
        id,
        role: "assistant",
        content,
        timestamp,
        cards: fallbackCards,
        navigationAction: {
          label: matchedCounty ? `View ${matchedCounty} Facilities` : "View Facilities",
          path: matchedCounty ? `/facilities?county=${encodeURIComponent(matchedCounty)}` : "/facilities",
        },
        suggestedPrompts: [
          `Show critical equipment nationwide`,
          `Which county has highest risk?`,
          `List all critical alerts`,
        ],
      };
    }
  }

  // 3. Pure Critical & High Risk Query (Nationwide fallback when no county specified)
  if (isCritical || isHighRisk || (hasRiskFilter && !matchedCounty)) {
    const criticalList = maishawatchData.equipment
      .filter((item) => item.riskLevel === "critical" || item.riskLevel === "high")
      .sort((a, b) => b.riskScore - a.riskScore);

    const topCards = criticalList.slice(0, 3).map(equipmentToCard);
    const content = `Found **${criticalList.length} equipment assets** currently operating at **Critical** or **High** risk levels across all counties.

**Top Priority Risk Assets:**
${criticalList
  .slice(0, 5)
  .map(
    (item, index) =>
      `${index + 1}. **${item.name}** (${item.id}) — Risk: **${item.riskScore}/100** | RUL: ${item.rulHours ?? "N/A"}h | Discrepancy: ${item.discrepancyPercent}%`
  )
  .join("\n")}

*Immediate Action:* Inspection or preventive maintenance dispatch is recommended for assets with RUL < 100 hours.`;

    return {
      id,
      role: "assistant",
      content,
      timestamp,
      cards: topCards,
      navigationAction: {
        label: "View All Critical Equipment",
        path: "/equipment?risk=critical",
      },
      suggestedPrompts: [
        "Which equipment is overdue for maintenance?",
        "Show critical alerts",
        "Show critical equipment in Nairobi",
      ],
    };
  }

  // 4. Pure Maintenance / Overdue Query
  if (isOverdue) {
    const overdueList = maishawatchData.equipment.filter((item) => item.maintenanceDue);
    const totalDowntime = maishawatchData.equipment.reduce((sum, item) => sum + (item.totalDowntimeHours ?? 0), 0);
    const totalRepairCost = maishawatchData.equipment.reduce((sum, item) => sum + (item.estimatedRepairCost ?? 0), 0);

    const cards = overdueList.slice(0, 3).map(equipmentToCard);
    const content = `### Maintenance Overview
- **Overdue Maintenance Assets:** **${overdueList.length} devices** require prompt technician attention.
- **Total Network Downtime:** **${totalDowntime.toFixed(1)} hours** accumulated.
- **Estimated Repair Exposure:** **${formatCurrency(totalRepairCost)}**

**Assets Requiring Servicing:**
${overdueList
  .slice(0, 4)
  .map((item) => `- **${item.name}** (${item.id}) | Last Serviced: ${item.lastMaintenanceDate}`)
  .join("\n")}`;

    return {
      id,
      role: "assistant",
      content,
      timestamp,
      cards,
      navigationAction: {
        label: "Generate Maintenance Report",
        path: "/reports",
      },
      suggestedPrompts: [
        "Show equipment with register discrepancies",
        "What are the network KPIs?",
        "List all critical alerts",
      ],
    };
  }

  // 5. Pure Usage Discrepancy Query
  if (isDiscrepancy) {
    const flaggedList = maishawatchData.equipment
      .filter((item) => item.discrepancyFlagged || item.discrepancyPercent > 15)
      .sort((a, b) => b.discrepancyPercent - a.discrepancyPercent);

    const cards = flaggedList.slice(0, 3).map(equipmentToCard);
    const content = `### Usage Reconciliation & Discrepancies
- **Flagged Assets:** **${flaggedList.length} devices** exhibit significant variation between automated counter usage and manual log register records.
- **Highest Discrepancy Asset:** **${flaggedList[0]?.name || "N/A"}** (${flaggedList[0]?.id || ""}) at **${flaggedList[0]?.discrepancyPercent || 0}% variance**.

Unreported usage or billing mismatches can indicate under-reporting or operational bypass.`;

    return {
      id,
      role: "assistant",
      content,
      timestamp,
      cards,
      navigationAction: {
        label: "Review Discrepancy Alerts",
        path: "/alerts",
      },
      suggestedPrompts: [
        "Show critical risk equipment",
        "Show facility risk ranking",
        "Give me a high-level summary",
      ],
    };
  }

  // 6. Alerts & Telemetry Anomalies (with County filtering if present)
  if (isAlerts) {
    let alerts = maishawatchData.alerts;
    if (matchedCounty) {
      alerts = alerts.filter((a) => {
        const fac = facilityById.get(a.facilityId);
        return fac && fac.county.toLowerCase() === matchedCounty.toLowerCase();
      });
    }

    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    const highAlerts = alerts.filter((a) => a.severity === "high");

    const content = `### Active Risk & Telemetry Alerts ${matchedCounty ? `in **${matchedCounty} County**` : ""}
- **Total Active Alerts:** **${alerts.length}**
- **Critical Severity:** **${criticalAlerts.length} alerts**
- **High Severity:** **${highAlerts.length} alerts**

**Recent Critical Notifications:**
${(criticalAlerts.length > 0 ? criticalAlerts : alerts)
  .slice(0, 4)
  .map((a) => `• **${a.equipmentId}**: ${a.message}`)
  .join("\n")}`;

    return {
      id,
      role: "assistant",
      content,
      timestamp,
      cards: [
        {
          type: "metric",
          data: {
            title: matchedCounty ? `${matchedCounty} Alerts` : "Active System Alerts",
            value: alerts.length,
            description: `${criticalAlerts.length} Critical, ${highAlerts.length} High`,
            intent: "danger",
          },
        },
      ],
      navigationAction: {
        label: "Open Alerts Console",
        path: "/alerts",
      },
      suggestedPrompts: [
        "Show critical risk equipment",
        "Which equipment is overdue for maintenance?",
        "Show usage discrepancies",
      ],
    };
  }

  // 7. General System Overview / Help / Fallback
  const metrics = getOverviewMetrics();
  const overviewCards: RichCardPayload[] = [
    {
      type: "metric",
      data: {
        title: "Monitored Equipment",
        value: metrics.equipmentCount,
        description: `${metrics.criticalCount} Critical, ${metrics.highRiskCount} High Risk`,
        intent: metrics.criticalCount > 0 ? "danger" : "info",
      },
    },
    {
      type: "metric",
      data: {
        title: "Active Alerts",
        value: metrics.activeAlertCount,
        description: `${metrics.discrepancyCount} Flagged Discrepancies`,
        intent: "warning",
      },
    },
    {
      type: "metric",
      data: {
        title: "Repair Cost Exposure",
        value: formatCurrency(metrics.repairCost),
        description: `${metrics.downtimeHours}h total downtime`,
        intent: "danger",
      },
    },
  ];

  const defaultContent = `### MaishaWatch AI Assistant
I am connected directly to your **MaishaWatch Backend Dataset** (${metrics.facilityCount.toLocaleString()} facilities, ${metrics.equipmentCount} assets, 324,000 telemetry readings).

**Network Health Summary:**
- **Equipment Assets:** ${metrics.equipmentCount} (${metrics.criticalCount} Critical, ${metrics.highRiskCount} High Risk)
- **Facilities Monitored:** ${metrics.facilityCount.toLocaleString()} across Kenya
- **Active Alerts:** ${metrics.activeAlertCount}
- **Flagged Discrepancies:** ${metrics.discrepancyCount} assets
- **Accumulated Downtime:** ${metrics.downtimeHours} hours (KES ${metrics.repairCost.toLocaleString()} repair exposure)

How can I assist you with equipment telemetry, risk drivers, maintenance schedules, or facility reports today?`;

  return {
    id,
    role: "assistant",
    content: defaultContent,
    timestamp,
    cards: overviewCards,
    navigationAction: {
      label: "Open Overview Dashboard",
      path: "/overview",
    },
    suggestedPrompts: [
      "Show critical risk equipment in Nairobi",
      "Which equipment is overdue for maintenance?",
      "Show usage discrepancies",
      "Which facilities in Kisumu need support?",
    ],
  };
}
