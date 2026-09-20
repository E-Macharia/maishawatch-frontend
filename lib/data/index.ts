import type { Equipment, Facility, Alert, MaishaWatchDataset } from "@/types/maishawatch";

export * from "./live-context";
export * from "./insights";
export * from "./metrics";

export const getFacilityName = (facilityId: string, facilities: Facility[] = []) =>
  facilities.find((f) => f.id === facilityId)?.name ?? `Facility ${facilityId}`;

export const getEquipmentName = (equipmentId: string, equipment: Equipment[] = []) =>
  equipment.find((e) => e.id === equipmentId)?.name ?? `Equipment ${equipmentId}`;

