"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import type { Alert, Equipment, Facility } from "@/types/maishawatch";
import { HospitalAlertDialog } from "./hospital-alert-dialog";

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-[5px] border border-blue-400/20 bg-blue-400/[0.07] px-3.5 text-xs font-semibold text-blue-200 transition hover:border-blue-300/30 hover:bg-blue-400/[0.12] hover:text-white"
      >
        <BellRing className="h-3.5 w-3.5" />
        Notify hospital
      </button>
      {open && <HospitalAlertDialog alert={activeAlert} equipment={equipment} facility={facility} onClose={() => setOpen(false)} />}
    </>
  );
}
