import type { MaishaWatchDataset } from "@/types/maishawatch";
import { maishawatchData } from "@/lib/data";

const baseUrl = process.env.BACKEND_API_BASE_URL?.replace(/\/$/, "");
const dataSource = process.env.DATA_SOURCE ?? "fixture";
const endpoint = (name: string, fallback: string) =>
	process.env[`BACKEND_${name}_PATH`] ?? fallback;

async function getJson<T>(path: string): Promise<T> {
	if (!baseUrl) throw new Error("BACKEND_API_BASE_URL is not configured");
	const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
	if (!response.ok)
		throw new Error(`Backend request failed (${response.status}) for ${path}`);
	return response.json() as Promise<T>;
}

export async function getBackendDataset(): Promise<MaishaWatchDataset> {
	if (dataSource !== "remote" || !baseUrl) return maishawatchData;

	const [facilities, equipment, alerts] = await Promise.all([
		getJson<MaishaWatchDataset["facilities"]>(
			endpoint("FACILITIES_PATH", "/api/facilities"),
		),
		getJson<MaishaWatchDataset["equipment"]>(
			endpoint("EQUIPMENT_PATH", "/api/equipment"),
		),
		getJson<MaishaWatchDataset["alerts"]>(endpoint("ALERTS_PATH", "/api/alerts")),
	]);

	return {
		meta: {
			...maishawatchData.meta,
			source: "remote backend API",
			generatedAt: new Date().toISOString(),
			facilityCount: facilities.length,
			equipmentCount: equipment.length,
		},
		facilities,
		equipment,
		alerts,
	};
}
