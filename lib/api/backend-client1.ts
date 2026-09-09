import type {
	Equipment,
	Facility,
	Alert,
	MaintenanceRecord,
	MaishaWatchDataset,
} from "@/types/maishawatch";
import { maishawatchData } from "@/lib/data";

const API_BASE = (
	process.env.BACKEND_API_BASE_URL ||
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	process.env.NEXT_PUBLIC_BACKEND_URL ||
	"http://127.0.0.1:8000"
).replace(/\/$/, "");

const DATA_SOURCE = process.env.DATA_SOURCE ?? "fixture";

export function getAuthHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (typeof window !== "undefined") {
		const token = localStorage.getItem("maishawatch_access_token");
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}
	}
	return headers;
}

async function fetchWithFallback<T>(
	url: string,
	fallbackValue: () => T,
): Promise<T> {
	if (DATA_SOURCE !== "remote") {
		return fallbackValue();
	}

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

		const res = await fetch(url, {
			cache: "no-store",
			headers: getAuthHeaders(),
			signal: controller.signal,
		});
		clearTimeout(timeoutId);

		if (!res.ok) {
			console.warn(
				`[Backend API] Request to ${url} returned ${res.status}. Falling back to snapshot.`,
			);
			return fallbackValue();
		}
		const json = await res.json();
		return (json.data !== undefined ? json.data : json) as T;
	} catch (error) {
		console.warn(
			`[Backend API] Failed to connect to ${url}. Using local snapshot fallback.`,
		);
		return fallbackValue();
	}
}

/**
 * Fetch equipment list with optional search, county, and risk filters
 */
export async function fetchEquipmentList(params?: {
	q?: string;
	county?: string;
	risk?: string;
	type?: string;
}): Promise<Equipment[]> {
	const query = new URLSearchParams();
	if (params?.q) query.set("q", params.q);
	if (params?.county) query.set("county", params.county);
	if (params?.risk) query.set("risk", params.risk);
	if (params?.type) query.set("type", params.type);

	const url = `${API_BASE}/equipment${query.toString() ? `?${query.toString()}` : ""}`;

	return fetchWithFallback<Equipment[]>(url, () => {
		let items = maishawatchData.equipment;
		if (params?.q) {
			const q = params.q.toLowerCase().trim();
			items = items.filter(
				(e) =>
					e.id.toLowerCase().includes(q) ||
					e.name.toLowerCase().includes(q) ||
					e.serialNumber.toLowerCase().includes(q) ||
					e.manufacturer?.toLowerCase().includes(q),
			);
		}
		if (params?.risk) {
			items = items.filter((e) => e.riskLevel === params.risk);
		}
		return items;
	});
}

/**
 * Fetch single equipment detail
 */
export async function fetchEquipmentById(
	id: string,
): Promise<{ data: Equipment; facility: Facility | null } | null> {
	const url = `${API_BASE}/equipment/${id}`;

	return fetchWithFallback<{
		data: Equipment;
		facility: Facility | null;
	} | null>(url, () => {
		const eq = maishawatchData.equipment.find((e) => e.id === id);
		if (!eq) return null;
		const fac =
			maishawatchData.facilities.find((f) => f.id === eq.facilityId) || null;
		return { data: eq, facility: fac };
	});
}

/**
 * Fetch facilities with pagination and search
 */
export async function fetchFacilities(params?: {
	page?: number;
	pageSize?: number;
	q?: string;
	county?: string;
	kephLevel?: string;
}): Promise<{
	total: number;
	page: number;
	pageSize: number;
	items: Facility[];
}> {
	const query = new URLSearchParams();
	if (params?.page) query.set("page", String(params.page));
	if (params?.pageSize) query.set("pageSize", String(params.pageSize));
	if (params?.q) query.set("q", params.q);
	if (params?.county) query.set("county", params.county);
	if (params?.kephLevel) query.set("kephLevel", params.kephLevel);

	const url = `${API_BASE}/facilities${query.toString() ? `?${query.toString()}` : ""}`;

	return fetchWithFallback(url, () => {
		let list = maishawatchData.facilities;
		if (params?.q) {
			const q = params.q.toLowerCase().trim();
			list = list.filter(
				(f) => f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q),
			);
		}
		if (params?.county) {
			list = list.filter(
				(f) => f.county.toLowerCase() === params.county?.toLowerCase(),
			);
		}
		const page = params?.page ?? 1;
		const pageSize = params?.pageSize ?? 25;
		const start = (page - 1) * pageSize;
		return {
			total: list.length,
			page,
			pageSize,
			items: list.slice(start, start + pageSize),
		};
	});
}

/**
 * Fetch active risk & discrepancy alerts
 */
export async function fetchAlerts(params?: {
	severity?: string;
	type?: string;
	includeAcknowledged?: boolean;
}): Promise<Alert[]> {
	const query = new URLSearchParams();
	if (params?.severity) query.set("severity", params.severity);
	if (params?.type) query.set("type", params.type);
	if (params?.includeAcknowledged) query.set("includeAcknowledged", "true");

	const url = `${API_BASE}/alerts${query.toString() ? `?${query.toString()}` : ""}`;

	return fetchWithFallback<Alert[]>(url, () => maishawatchData.alerts);
}

/**
 * Fetch analytics summary / network KPIs
 */
export async function fetchAnalyticsSummary(): Promise<any> {
	const url = `${API_BASE}/analytics/summary`;
	return fetchWithFallback(url, () => ({
		totalEquipment: maishawatchData.equipment.length,
		totalFacilities: maishawatchData.facilities.length,
		criticalRiskCount: maishawatchData.equipment.filter(
			(e) => e.riskLevel === "critical",
		).length,
		highRiskCount: maishawatchData.equipment.filter((e) => e.riskLevel === "high")
			.length,
		discrepancyCount: maishawatchData.equipment.filter(
			(e) => e.discrepancyFlagged,
		).length,
	}));
}

/**
 * Record a new maintenance action (Live mutation to backend)
 */
export async function submitMaintenanceRecord(payload: {
	equipmentId: string;
	type: "preventive" | "inspection" | "corrective";
	notes: string;
	technician?: string;
	actionPerformed?: string;
	durationHours?: number;
	partsCost?: number;
	downtimeHours?: number;
}): Promise<{ status: string; message: string; data: MaintenanceRecord }> {
	const res = await fetch(`${API_BASE}/maintenance`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		throw new Error(`Failed to submit maintenance log: ${res.statusText}`);
	}
	return res.json();
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
	alertId: string,
	acknowledgedBy: string = "Biomedical Engineer",
	notes?: string,
): Promise<{ status: string; message: string }> {
	const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
		method: "PATCH",
		headers: getAuthHeaders(),
		body: JSON.stringify({ acknowledgedBy, notes }),
	});

	if (!res.ok) {
		throw new Error(`Failed to acknowledge alert: ${res.statusText}`);
	}
	return res.json();
}

/**
 * Predict Remaining Useful Life and Risk Factors using backend ML service
 */
export async function predictEquipmentRul(payload: {
	equipmentId?: string;
	equipmentType: string;
	temperature: number;
	vibration: number;
	pressure: number;
	operatingHours?: number;
}): Promise<any> {
	const res = await fetch(`${API_BASE}/predict/rul`, {
		method: "POST",
		headers: getAuthHeaders(),
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		throw new Error(`Failed to compute ML prediction: ${res.statusText}`);
	}
	return res.json();
}

/**
 * Complete dataset getter (for full snapshot or remote aggregation)
 */
export async function getBackendDataset(): Promise<MaishaWatchDataset> {
	if (DATA_SOURCE !== "remote") return maishawatchData;

	try {
		const [equipment, alerts] = await Promise.all([
			fetchEquipmentList(),
			fetchAlerts(),
		]);

		return {
			meta: {
				...maishawatchData.meta,
				source: "remote FastAPI backend service",
				generatedAt: new Date().toISOString(),
				equipmentCount: equipment.length,
				alertCount: alerts.length,
			},
			facilities: maishawatchData.facilities,
			equipment,
			alerts,
		};
	} catch {
		return maishawatchData;
	}
}
