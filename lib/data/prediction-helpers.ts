import type { Equipment, RiskLevel } from "@/types/maishawatch";
import { maishawatchData } from "@/lib/data";

export type PredictionView = {
  p24: number;
  p72: number;
  p168: number;
  maxProb: number;
  rulHours: number;
  rulDays: number;
  level: RiskLevel;
  source: "model" | "telemetry";
};

/** Normalize probability that may be 0–1 or 0–100. */
function asUnit(v: number | null | undefined, fallback: number): number {
  if (v == null || Number.isNaN(v)) return fallback;
  const n = Number(v);
  if (n > 1) return Math.min(1, Math.max(0, n / 100));
  return Math.min(1, Math.max(0, n));
}

function levelFromProbAndRul(p: number, rulHours: number): RiskLevel {
  if (p >= 0.8 || rulHours <= 8) return "critical";
  if (p >= 0.6 || rulHours <= 15) return "high";
  if (p >= 0.3 || rulHours <= 30) return "medium";
  return "low";
}

/**
 * Prefer ML fields from the snapshot; fall back to telemetry riskScore / rulHours.
 * This is the single source of truth for all prediction UI.
 */
export function getPredictionView(equipment: Equipment): PredictionView {
  const telemetryProb = asUnit(equipment.riskScore, 0);
  const hasModel =
    equipment.mlSource === "model" ||
    equipment.failureProbability24h != null ||
    equipment.failureProbability72h != null ||
    equipment.failureProbability168h != null;

  const p24 = asUnit(equipment.failureProbability24h, telemetryProb);
  const p72 = asUnit(equipment.failureProbability72h, telemetryProb);
  const p168 = asUnit(equipment.failureProbability168h, telemetryProb);
  const maxProb = Math.max(p24, p72, p168);

  const rulHours = Math.max(
    0,
    Math.round(
      equipment.mlRulHours ??
        equipment.rulHours ??
        (equipment.leadTimeDays != null ? equipment.leadTimeDays * 24 : 0),
    ),
  );
  const rulDays = Math.max(0, Math.round(rulHours / 24));

  const level =
    (equipment.mlRiskLevel as RiskLevel | undefined) ??
    equipment.riskLevel ??
    levelFromProbAndRul(maxProb, rulHours);

  return {
    p24,
    p72,
    p168,
    maxProb,
    rulHours,
    rulDays,
    level,
    source: hasModel ? "model" : "telemetry",
  };
}

export function getRecommendationFromPrediction(view: PredictionView): string {
  if (view.level === "critical") {
    return "Immediately inspect the equipment and consider taking it out of normal operation. Prioritize corrective maintenance and notify biomedical engineering.";
  }
  if (view.level === "high") {
    return "Schedule urgent biomedical inspection, review recent telemetry and maintenance history, and initiate corrective maintenance where required.";
  }
  if (view.level === "medium") {
    return "Increase monitoring frequency, review telemetry and maintenance history, and schedule preventive maintenance if the risk persists.";
  }
  return "Continue routine monitoring and review the equipment during the next scheduled maintenance assessment.";
}

/** Fleet ranking for the Predictions page. */
export function getPredictiveEquipmentList() {
  return maishawatchData.equipment
    .map((eq) => {
      const view = getPredictionView(eq);
      return { equipment: eq, view };
    })
    .sort((a, b) => b.view.maxProb - a.view.maxProb);
}

export function getPredictiveSummary() {
  const list = getPredictiveEquipmentList();
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const row of list) {
    counts[row.view.level] += 1;
  }
  const modelCount = list.filter((r) => r.view.source === "model").length;
  return {
    total: list.length,
    ...counts,
    modelCount,
    telemetryCount: list.length - modelCount,
  };
}
