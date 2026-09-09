import type { Equipment, Facility, Alert } from "@/types/maishawatch";

const API_BASE = (
	process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ||
	process.env.NEXT_PUBLIC_BACKEND_URL ||
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	process.env.BACKEND_API_BASE_URL ||
	"https://maishawatch-backend.onrender.com"
).replace(/\/$/, "");

const TOKEN_KEY = "maishawatch_access_token";

export function getAuthHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: "application/json",
		"Content-Type": "application/json",
	};
	if (typeof window !== "undefined") {
		const token = localStorage.getItem(TOKEN_KEY);
		if (token) headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 35000); // 35s to handle Render free-tier cold starts
	try {
		const response = await fetch(`${API_BASE}${path}`, {
			...init,
			cache: "no-store",
			headers: { ...getAuthHeaders(), ...(init.headers || {}) },
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
			throw new Error(`${response.status}: ${detail}`);
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
			request<any>("/auth/login", {
				method: "POST",
				body: JSON.stringify({ email, password }),
			}),
		token: (username: string, password: string) => {
			const body = new URLSearchParams({ username, password });
			return request<any>("/auth/token", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: body.toString(),
			});
		},
		verifyOtp: (email: string, otp: string) =>
			request<any>("/auth/verify-otp", {
				method: "POST",
				body: JSON.stringify({ email, otp }),
			}),
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
				body: JSON.stringify({ email }),
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

	dashboard: { summary: () => request<any>("/dashboard/summary") },

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
		create: (payload: Record<string, unknown>) =>
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
		bulk: (payload: Record<string, unknown>) =>
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
		failure24h: (payload: Record<string, unknown>) =>
			request<any>("/predict/failure/24h", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		failure72h: (payload: Record<string, unknown>) =>
			request<any>("/predict/failure/72h", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		failure168h: (payload: Record<string, unknown>) =>
			request<any>("/predict/failure/168h", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		failureAll: (payload: Record<string, unknown>) =>
			request<any>("/predict/failure/all", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		rul: (payload: Record<string, unknown>) =>
			request<any>("/predict/rul", {
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
		create: (payload: Record<string, unknown>) =>
			request<any>("/users", { method: "POST", body: JSON.stringify(payload) }),
		update: (id: string, payload: Record<string, unknown>) =>
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
		send: (payload: Record<string, unknown>) =>
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

	profile: {
		get: () => request<any>("/profile"),
		update: (name: string) =>
			request<any>(`/profile${qs({ name })}`, { method: "PATCH" }),
	},

	audit: { list: () => request<any[]>("/audit") },
	recommendations: { get: () => request<any>("/recommendations") },

	chat: {
		send: (
			message: string,
			conversation_id?: string,
			context: Record<string, unknown> = {},
		) =>
			request<any>("/chat", {
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
		suggestions: () => request<any>("/chat/suggestions"),
		exportConversation: (id: string, format = "json") =>
			request<any>(
				`/chat/conversations/${encodeURIComponent(id)}/export${qs({ format })}`,
			),
	},
};

// Backwards-compatible helpers used by existing components.
export async function fetchEquipmentList(params?: {
	q?: string;
	county?: string;
	risk?: string;
	type?: string;
}): Promise<Equipment[]> {
	const rows = await api.equipment.list({
		search: params?.q,
		equipment_type: params?.type,
	});
	return rows as Equipment[];
}
export async function fetchEquipmentById(
	id: string,
): Promise<{ data: Equipment; facility: Facility | null } | null> {
	try {
		const result = await api.equipment.detail(id);
		return {
			data: result.equipment as Equipment,
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
}
export async function fetchAlerts(params?: {
	severity?: string;
	type?: string;
	includeAcknowledged?: boolean;
}): Promise<Alert[]> {
	const result = await api.alerts.list({ severity: params?.severity });
	return (
		Array.isArray(result) ? result : (result.items ?? result.alerts ?? [])
	) as Alert[];
}
export async function fetchAnalyticsSummary(): Promise<any> {
	try {
		const res = await api.dashboard.summary();
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
	payload: Record<string, unknown>,
): Promise<any> {
	return api.predictions.rul(payload);
}
export async function submitMaintenanceRecord(payload: {
	equipmentId: string;
	type: "preventive" | "inspection" | "corrective";
	notes: string;
	technician?: string;
	actionPerformed?: string;
	durationHours?: number;
	partsCost?: number;
	downtimeHours?: number;
}): Promise<any> {
	return api.maintenance.createWorkOrder({
		equipment_id: payload.equipmentId,
		title: `${payload.type.toUpperCase()} Maintenance: ${payload.actionPerformed || "Log Entry"}`,
		description: payload.notes,
		assigned_to: payload.technician,
		priority: payload.type === "corrective" ? "high" : "medium",
	});
}
