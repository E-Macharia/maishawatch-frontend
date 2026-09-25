import type { Equipment, Facility, Alert } from "@/types/maishawatch";

export const API_BASE = (
	process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ||
	process.env.NEXT_PUBLIC_BACKEND_URL ||
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	process.env.BACKEND_API_BASE_URL ||
	"https://maishawatch-backend.onrender.com"
).replace(/\/$/, "");

export const TOKEN_KEY = "maishawatch_access_token";

export function getAuthHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: "application/json",
		"Content-Type": "application/json",
	};
	if (typeof window !== "undefined") {
		try {
			const token = localStorage.getItem(TOKEN_KEY);
			if (token) headers.Authorization = `Bearer ${token}`;
		} catch {
			// Ignore localStorage access errors
		}
	}
	return headers;
}

export class ApiError extends Error {
	status: number;
	data: unknown;
	constructor(message: string, status: number, data?: unknown) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
	}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 35000); // 35s to handle Render free-tier cold starts
	try {
		const headers = { ...getAuthHeaders(), ...(init.headers || {}) };
		const response = await fetch(`${API_BASE}${path}`, {
			...init,
			cache: "no-store",
			headers,
			signal: controller.signal,
		});
		const text = await response.text();
		let payload: unknown = null;
		try {
			payload = text ? JSON.parse(text) : null;
		} catch {
			payload = text;
		}
		if (!response.ok) {
			const detail =
				typeof payload === "object" && payload && "detail" in payload
					? String((payload as { detail: unknown }).detail)
					: response.statusText;
			throw new ApiError(
				`${response.status}: ${detail}`,
				response.status,
				payload,
			);
		}
		return payload as T;
	} finally {
		clearTimeout(timeout);
	}
}

const qs = (
	params: Record<string, string | number | boolean | undefined | null>,
) => {
	const query = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "")
			query.set(key, String(value));
	});
	const value = query.toString();
	return value ? `?${value}` : "";
};

export const api = {
	health: () =>
		request<{ status: string; service: string; version: string }>("/health"),

	auth: {
		login: (email: string, password: string) =>
			request<{
				access_token?: string;
				token_type?: string;
				user?: any;
				requires_otp?: boolean;
				is_first_time?: boolean;
				message?: string;
				email?: string;
				otp_for_debug?: string;
			}>("/auth/login", {
				method: "POST",
				body: JSON.stringify({ email: email.trim(), password }),
			}),
		token: (username: string, password: string) => {
			const body = new URLSearchParams({
				username: username.trim(),
				password,
			});
			return request<{ access_token: string; token_type: string }>(
				"/auth/token",
				{
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: body.toString(),
				},
			);
		},
		verifyOtp: (email: string, otp: string) =>
			request<{ access_token: string; token_type: string; user: any }>(
				"/auth/verify-otp",
				{
					method: "POST",
					body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
				},
			),
		changeTempPassword: (payload: {
			email: string;
			temp_password: string;
			new_password: string;
			confirm_password: string;
		}) =>
			request<any>("/auth/change-temp-password", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		forgotPassword: (email: string) =>
			request<any>("/auth/forgot-password", {
				method: "POST",
				body: JSON.stringify({ email: email.trim() }),
			}),
		resetPassword: (payload: {
			email: string;
			otp: string;
			new_password: string;
			confirm_password: string;
		}) =>
			request<any>("/auth/reset-password", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		changePassword: (payload: {
			current_password: string;
			new_password: string;
			confirm_password: string;
		}) =>
			request<any>("/auth/change-password", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		me: () => request<any>("/auth/me"),
		logout: () => request<any>("/auth/logout", { method: "POST" }),
	},

	dashboard: {
		summary: () =>
			request<{
				total_equipment: number;
				total_facilities: number;
				open_alerts: number;
				critical_alerts: number;
				pending_maintenance: number;
				operational_equipment: number;
				maintenance_mode_equipment: number;
				decommissioned_equipment: number;
				recent_alerts_count: number;
				role: string;
				scope_type: string;
				scope_id: string | null;
				generated_at: string;
			}>("/dashboard/summary"),
		analyticsSummary: () => request<any>("/analytics/summary"),
	},

	equipment: {
		list: (
			params: {
				facility_id?: string;
				equipment_type?: string;
				status?: string;
				search?: string;
			} = {},
		) => request<any[]>(`/equipment${qs(params)}`),
		detail: (
			id: string,
			params: {
				include_telemetry?: boolean;
				include_maintenance?: boolean;
				include_alerts?: boolean;
				limit?: number;
			} = {},
		) => request<any>(`/equipment/${encodeURIComponent(id)}${qs(params)}`),
		create: (payload: {
			equipment_id: string;
			facility_id: string;
			equipment_type: string;
			manufacturer?: string;
			model?: string;
			serial_number?: string;
			installation_date?: string;
			simulate_telemetry?: boolean;
			telemetry_interval_seconds?: number;
		}) =>
			request<any>("/equipment", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		update: (id: string, payload: Record<string, unknown>) =>
			request<any>(`/equipment/${encodeURIComponent(id)}`, {
				method: "PUT",
				body: JSON.stringify(payload),
			}),
		patch: (id: string, payload: Record<string, unknown>) =>
			request<any>(`/equipment/${encodeURIComponent(id)}`, {
				method: "PATCH",
				body: JSON.stringify(payload),
			}),
		updateStatus: (id: string, status: string) =>
			request<any>(`/equipment/${encodeURIComponent(id)}/status`, {
				method: "PATCH",
				body: JSON.stringify({ status }),
			}),
		remove: (id: string, permanent = false) =>
			request<any>(`/equipment/${encodeURIComponent(id)}${qs({ permanent })}`, {
				method: "DELETE",
			}),
		syncAll: () => request<any>("/equipment/sync-all", { method: "POST" }),
		syncData: () => request<any>("/equipment/sync-data", { method: "POST" }),
		generateTelemetry: (id: string, count = 100) =>
			request<any>(
				`/equipment/${encodeURIComponent(id)}/generate-telemetry${qs({ count })}`,
				{ method: "POST" },
			),
		failurePrediction: (id: string) =>
			request<any>(`/equipment/${encodeURIComponent(id)}/failure-prediction`),
		rul: (id: string) => request<any>(`/equipment/${encodeURIComponent(id)}/rul`),
		evaluate: (equipment_id: string) =>
			request<any>("/equipment/evaluate", {
				method: "POST",
				body: JSON.stringify({ equipment_id }),
			}),
		simulateBatch: (payload: {
			equipment_id: string;
			facility_id: string;
			count?: number;
		}) =>
			request<any>("/equipment/simulate-batch", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		stats: (facility_id?: string) =>
			request<any>(`/equipment/stats/summary${qs({ facility_id })}`),
		telemetry: (
			id: string,
			params: { facility_id?: string; limit?: number; days?: number } = {},
		) =>
			request<any[]>(
				`/equipment/${encodeURIComponent(id)}/telemetry${qs(params)}`,
			),
		alerts: (id: string, params: { limit?: number; status?: string } = {}) =>
			request<any[]>(`/equipment/${encodeURIComponent(id)}/alerts${qs(params)}`),
	},

	facilities: {
		list: (
			params: {
				name?: string;
				county?: string;
				equipment_type?: string;
				status?: string;
				keph_level?: string;
			} = {},
		) => request<any[]>(`/facilities${qs(params)}`),
		create: (payload: {
			facility_id: string;
			facility_name: string;
			county: string;
			keph_level?: string;
			status?: string;
		}) =>
			request<any>("/facilities", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
	},

	maintenance: {
		list: () => request<any[]>("/maintenance"),
		history: (equipmentId: string) =>
			request<any[]>(`/maintenance/history/${encodeURIComponent(equipmentId)}`),
		createWorkOrder: (payload: {
			equipment_id: string;
			priority?: string;
			title: string;
			description?: string;
			assigned_to?: string;
			scheduled_at?: string;
		}) =>
			request<any>("/maintenance/work-orders", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		updateWorkOrder: (id: string, payload: Record<string, unknown>) =>
			request<any>(`/maintenance/work-orders/${encodeURIComponent(id)}`, {
				method: "PATCH",
				body: JSON.stringify(payload),
			}),
	},

	alerts: {
		list: (
			params: {
				status?: string;
				severity?: string;
				source?: string;
				facility_id?: string;
				equipment_id?: string;
				limit?: number;
				offset?: number;
			} = {},
		) => request<any>(`/alerts${qs(params)}`),
		stats: (params: { facility_id?: string; days?: number } = {}) =>
			request<any>(`/alerts/stats${qs(params)}`),
		byEquipment: (id: string, limit = 100) =>
			request<any[]>(
				`/alerts/equipment/${encodeURIComponent(id)}${qs({ limit })}`,
			),
		get: (id: string) => request<any>(`/alerts/${encodeURIComponent(id)}`),
		create: (payload: {
			alert_type: string;
			severity: string;
			title: string;
			message: string;
			recommendation?: string;
			equipment_id?: string;
			facility_id?: string;
			status?: string;
		}) =>
			request<any>("/alerts", { method: "POST", body: JSON.stringify(payload) }),
		replace: (id: string, payload: Record<string, unknown>) =>
			request<any>(`/alerts/${encodeURIComponent(id)}`, {
				method: "PUT",
				body: JSON.stringify(payload),
			}),
		patch: (id: string, payload: Record<string, unknown>) =>
			request<any>(`/alerts/${encodeURIComponent(id)}`, {
				method: "PATCH",
				body: JSON.stringify(payload),
			}),
		acknowledge: (id: string) =>
			request<any>(`/alerts/${encodeURIComponent(id)}/acknowledge`, {
				method: "PATCH",
			}),
		resolve: (id: string) =>
			request<any>(`/alerts/${encodeURIComponent(id)}/resolve`, {
				method: "PATCH",
			}),
		close: (id: string) =>
			request<any>(`/alerts/${encodeURIComponent(id)}/close`, { method: "PATCH" }),
		bulk: (payload: { alert_ids: string[]; action: string }) =>
			request<any>("/alerts/bulk", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		remove: (id: string) =>
			request<any>(`/alerts/${encodeURIComponent(id)}`, { method: "DELETE" }),
		bulkRemove: (ids: string[]) => {
			const q = new URLSearchParams();
			ids.forEach((id) => q.append("alert_ids", id));
			return request<any>(`/alerts/bulk?${q.toString()}`, { method: "DELETE" });
		},
		resolvedCount: (params: { facility_id?: string; days?: number } = {}) =>
			request<any>(`/alerts/resolved/count${qs(params)}`),
	},

	predictions: {
		failure24h: (payload: { equipment_id: string }) =>
			request<{
				equipment_id: string;
				equipment_type: string;
				horizon: string;
				failure_probability: number;
				severity: string;
				status: string;
				recommendation: string;
				timestamp: string;
				has_telemetry: boolean;
				telemetry_count: number;
			}>("/predict/failure/24h", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		failure72h: (payload: { equipment_id: string }) =>
			request<{
				equipment_id: string;
				equipment_type: string;
				horizon: string;
				failure_probability: number;
				severity: string;
				status: string;
				recommendation: string;
				timestamp: string;
				has_telemetry: boolean;
				telemetry_count: number;
			}>("/predict/failure/72h", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		failure168h: (payload: { equipment_id: string }) =>
			request<{
				equipment_id: string;
				equipment_type: string;
				horizon: string;
				failure_probability: number;
				severity: string;
				status: string;
				recommendation: string;
				timestamp: string;
				has_telemetry: boolean;
				telemetry_count: number;
			}>("/predict/failure/168h", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		failureAll: (payload: { equipment_id: string; [key: string]: unknown }) =>
			request<{
				equipment_id: string;
				equipment_type: string;
				timestamp: string;
				predictions: {
					"24h"?: { probability: number; severity: string; status: string };
					"72h"?: { probability: number; severity: string; status: string };
					"168h"?: { probability: number; severity: string; status: string };
					[key: string]: any;
				};
				overall_severity: string;
				recommendation: string;
				overall_status: string;
				max_probability: number;
			}>("/predict/failure/all", {
				method: "POST",
				body: JSON.stringify({ equipment_id: payload.equipment_id }),
			}),
		rul: (payload: { equipment_id: string }) =>
			request<{
				equipment_id: string;
				equipment_type: string;
				rul_hours: number;
				rul_days: number;
				severity: string;
				status: string;
				recommendation: string;
				confidence_score: number | null;
				timestamp: string;
				based_on: string;
			}>("/predict/rul", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		failureBatch: (equipment_ids: string[], horizon = "24h") => {
			const q = new URLSearchParams();
			equipment_ids.forEach((id) => q.append("equipment_ids", id));
			q.set("horizon", horizon);
			return request<any>(`/predict/failure/batch?${q.toString()}`, {
				method: "POST",
			});
		},
		rulBatch: (equipment_ids: string[]) => {
			const q = new URLSearchParams();
			equipment_ids.forEach((id) => q.append("equipment_ids", id));
			return request<any>(`/predict/rul/batch?${q.toString()}`, {
				method: "POST",
			});
		},
		config: () => request<any>("/predict/config"),
		history: (equipmentId: string, limit = 50) =>
			request<any[]>(
				`/predict/history/${encodeURIComponent(equipmentId)}${qs({ limit })}`,
			),
		health: () => request<any>("/predict/health"),
	},

	reports: {
		summary: () => request<any>("/reports/summary"),
		equipment: (
			params: {
				facility_id?: string;
				equipment_type?: string;
				status?: string;
			} = {},
		) => request<any>(`/reports/equipment${qs(params)}`),
		alerts: (
			params: {
				facility_id?: string;
				equipment_id?: string;
				severity?: string;
				status?: string;
			} = {},
		) => request<any>(`/reports/alerts${qs(params)}`),
	},

	users: {
		list: () => request<any[]>("/users"),
		create: (payload: {
			name: string;
			email: string;
			password: string;
			role: string;
			scope_type?: string;
			scope_id?: string | null;
		}) =>
			request<any>("/users", { method: "POST", body: JSON.stringify(payload) }),
		update: (
			id: string,
			payload: {
				name?: string;
				role?: string;
				scope_type?: string;
				scope_id?: string | null;
				active?: boolean;
			},
		) =>
			request<any>(`/users/${encodeURIComponent(id)}`, {
				method: "PATCH",
				body: JSON.stringify(payload),
			}),
	},

	notifications: {
		mine: () => request<any[]>("/notifications"),
		unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
		queue: (
			params: { status?: string; notification_type?: string; limit?: number } = {},
		) => request<any[]>(`/notifications/queue${qs(params)}`),
		read: (id: number) =>
			request<any>(`/notifications/${id}/read`, { method: "PATCH" }),
		readAll: () => request<any>("/notifications/read-all", { method: "PATCH" }),
		send: (payload: {
			subject: string;
			body: string;
			role?: string | null;
			user_ids?: string[];
			send_email_now?: boolean;
		}) =>
			request<any>("/notifications/send", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		remove: (id: number) =>
			request<any>(`/notifications/${id}`, { method: "DELETE" }),
		clearAll: () =>
			request<any>("/notifications/clear-all", { method: "DELETE" }),
		stats: () => request<any>("/notifications/stats"),
	},

	audit: { list: () => request<any[]>("/audit") },

	chat: {
		send: (
			message: string,
			conversation_id?: string,
			context: Record<string, unknown> = {},
		) =>
			request<{
				response: string;
				action?: string | null;
				data?: Record<string, unknown> | null;
				suggestions?: string[];
				conversation_id: string;
				timestamp: string;
			}>("/chat", {
				method: "POST",
				body: JSON.stringify({ message, conversation_id, context }),
			}),
		conversations: (limit = 20) =>
			request<any[]>(`/chat/conversations${qs({ limit })}`),
		conversation: (id: string, limit = 50) =>
			request<any>(
				`/chat/conversations/${encodeURIComponent(id)}${qs({ limit })}`,
			),
		deleteConversation: (id: string) =>
			request<any>(`/chat/conversations/${encodeURIComponent(id)}`, {
				method: "DELETE",
			}),
		suggestions: () =>
			request<{ suggestions: string[] } | string[]>("/chat/suggestions"),
		exportConversation: (id: string, format = "json") =>
			request<any>(
				`/chat/conversations/${encodeURIComponent(id)}/export${qs({ format })}`,
			),
	},
};

// Backwards-compatible domain helpers
export async function fetchEquipmentList(params?: {
	q?: string;
	county?: string;
	risk?: string;
	type?: string;
	facilityId?: string;
}): Promise<Equipment[]> {
	try {
		const rows = await api.equipment.list({
			search: params?.q,
			equipment_type: params?.type,
			facility_id: params?.facilityId,
		});
		return rows as Equipment[];
	} catch (error) {
		console.warn("fetchEquipmentList failed, returning empty list", error);
		return [];
	}
}

export async function fetchEquipmentById(
	id: string,
): Promise<{ data: Equipment; facility: Facility | null } | null> {
	try {
		const result = await api.equipment.detail(id);
		return {
			data: (result.equipment || result) as Equipment,
			facility: (result.facility ?? null) as Facility | null,
		};
	} catch {
		return null;
	}
}

export async function fetchFacilities(params?: {
	q?: string;
	county?: string;
	kephLevel?: string;
}): Promise<{
	total: number;
	page: number;
	pageSize: number;
	items: Facility[];
}> {
	try {
		const items = await api.facilities.list({
			name: params?.q,
			county: params?.county,
			keph_level: params?.kephLevel,
		});
		return {
			total: items.length,
			page: 1,
			pageSize: items.length,
			items: items as Facility[],
		};
	} catch (error) {
		console.warn("fetchFacilities failed, returning empty list", error);
		return {
			total: 0,
			page: 1,
			pageSize: 0,
			items: [],
		};
	}
}

export async function fetchAlerts(params?: {
	severity?: string;
	type?: string;
	includeAcknowledged?: boolean;
}): Promise<Alert[]> {
	try {
		const result = await api.alerts.list({ severity: params?.severity });
		return (
			Array.isArray(result) ? result : (result.items ?? result.alerts ?? [])
		) as Alert[];
	} catch (error) {
		console.warn("fetchAlerts failed, returning empty list", error);
		return [];
	}
}

export async function fetchAnalyticsSummary(): Promise<any> {
	try {
		const res: any = await api.dashboard.summary();
		if (res) {
			return {
				totalEquipment: res.total_equipment ?? res.totalEquipment ?? 150,
				totalFacilities: res.total_facilities ?? res.totalFacilities ?? 129,
				criticalRiskCount: res.critical_alerts ?? res.criticalRiskCount ?? 0,
				openAlerts: res.open_alerts ?? 0,
				pendingMaintenance: res.pending_maintenance ?? 0,
				role: res.role,
				scopeType: res.scope_type,
			};
		}
	} catch (e) {
		console.warn("fetchAnalyticsSummary failed, falling back", e);
	}
	return {
		totalEquipment: 150,
		totalFacilities: 129,
		criticalRiskCount: 18,
		openAlerts: 18,
		pendingMaintenance: 12,
	};
}

export async function acknowledgeAlert(alertId: string): Promise<any> {
	return api.alerts.acknowledge(alertId);
}

export async function predictEquipmentRul(
	payload: { equipment_id: string } | Record<string, unknown>,
): Promise<any> {
	return api.predictions.rul(payload as { equipment_id: string });
}

export async function submitMaintenanceRecord(payload: {
	equipmentId?: string;
	equipment_id?: string;
	type?: string;
	title?: string;
	notes?: string;
	technician?: string;
	actionPerformed?: string;
	priority?: string;
	durationHours?: number;
	partsCost?: number;
	downtimeHours?: number;
}): Promise<any> {
	const eqId = payload.equipment_id || payload.equipmentId || "";
	return api.maintenance.createWorkOrder({
		equipment_id: eqId,
		title:
			payload.title ||
			`${(payload.type || "Maintenance").toUpperCase()}: ${payload.actionPerformed || "Log Entry"}`,
		description:
			payload.notes || payload.actionPerformed || "Maintenance recorded",
		priority: payload.priority || (payload.type === "corrective" ? "high" : "medium"),
		assigned_to: payload.technician || undefined,
		scheduled_at: new Date().toISOString(),
	});
}

