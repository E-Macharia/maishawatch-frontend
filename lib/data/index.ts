import dataset from "@/lib/data/generated/dataset.json";
import type { MaishaWatchDataset } from "@/types/maishawatch";

export const maishawatchData = dataset as MaishaWatchDataset;

export const facilityById = new Map(
  maishawatchData.facilities.map((facility) => [facility.id, facility]),
);

export const equipmentById = new Map(
  maishawatchData.equipment.map((equipment) => [equipment.id, equipment]),
);

export const getFacilityName = (facilityId: string) =>
  facilityById.get(facilityId)?.name ?? "Unknown facility";

export const getEquipmentName = (equipmentId: string) =>
  equipmentById.get(equipmentId)?.name ?? "Unknown equipment";
