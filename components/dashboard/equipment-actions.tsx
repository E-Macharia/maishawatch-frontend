"use client";

import { useState } from "react";
import { BellRing, Wrench } from "lucide-react";
import type { Alert, Equipment, Facility } from "@/types/maishawatch";
import { HospitalAlertDialog } from "./hospital-alert-dialog";
import { WorkOrderModal } from "./work-order-modal";

function buildFallbackAlert(equipment: Equipment): Alert {
  return {
    id: `equipment-notify-${equipment.id}`,
    type: equipment.discrepancyFlagged ? "discrepancy" : "risk",
    severity: equipment.riskLevel === "critical" ? "critical" : equipment.riskLevel === "high" ? "high" : "medium",
    equipmentId: equipment.id,
    facilityId: equipment.facilityId,
    message: equipment.discrepancyFlagged
      ? `${equipment.name} has a usage-reporting discrepancy requiring biomedical engineering review.`
      : `${equipment.name} has a modeled ${equipment.riskLevel} risk requiring biomedical engineering review.`,
    scenarioRationale: equipment.scenarioRationale,
    createdAt: new Date().toISOString(),
  };
}

export function EquipmentActions({ equipment, facility, alert }: { equipment: Equipment; facility: Facility; alert?: Alert }) {
  const [open, setOpen] = useState(false);
  const activeAlert = alert ?? buildFallbackAlert(equipment);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <WorkOrderModal equipment={equipment} facility={facility} alert={alert} />

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground transition hover:bg-accent"
      >
        <BellRing className="h-3.5 w-3.5 text-primary" />
        <span>Notify Hospital</span>
      </button>

      {open && <HospitalAlertDialog alert={activeAlert} equipment={equipment} facility={facility} onClose={() => setOpen(false)} />}
    </div>
  );
}

