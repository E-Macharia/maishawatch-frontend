"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
} from "react";
import type {
	Equipment,
	Facility,
	Alert,
	EquipmentType,
	RiskLevel,
	TelemetryPoint,
	UsagePoint,
	MaintenanceRecord,
	FailureEvent,
} from "@/types/maishawatch";
import { api, API_BASE } from "@/lib/api/backend-client";

function normalizeEquipmentType(rawType?: string): EquipmentType {
	if (!rawType) return "icu";
	const lower = rawType.toLowerCase();
	if (lower.includes("dialysis") || lower.includes("hemo")) return "dialysis";
	if (lower.includes("theatre") || lower.includes("anesthesia"))
		return "theatre";
	if (
		lower.includes("imaging") ||
		lower.includes("ct") ||
		lower.includes("mri") ||
		lower.includes("x-ray") ||
		lower.includes("ultrasound")
	)
		return "imaging";
	if (lower.includes("radio") || lower.includes("oncol"))
		return "radiotherapy";
	return "icu";
}

function generateTelemetryFromRaw(raw: any): TelemetryPoint[] {
	const points: TelemetryPoint[] = [];
	const baseDate = new Date();
	const isCritical = (raw.criticality || "").toLowerCase() === "high";

	for (let i = 14; i >= 0; i--) {
		const d = new Date(baseDate);
		d.setDate(d.getDate() - i);
		points.push({
			date: d.toISOString().split("T")[0],
			riskScore: isCritical ? 75 + (14 - i) : 25 + Math.floor(Math.random() * 15),
			degradationIndex: isCritical ? 0.65 + (14 - i) * 0.02 : 0.2 + (14 - i) * 0.005,
			utilizationRate: 0.65 + Math.random() * 0.25,
			temperature: isCritical ? 38 + Math.random() * 5 : 22 + Math.random() * 3,
			vibration: isCritical ? 0.8 + Math.random() * 0.4 : 0.2 + Math.random() * 0.1,
			pressure: 100 + Math.random() * 15,
			flowRate: 25 + Math.random() * 5,
			powerConsumption: 40 + Math.random() * 10,
			humidity: 45 + Math.random() * 8,
		});
	}
	return points;
}

function generateUsageHistory(raw: any): UsagePoint[] {
	const points: UsagePoint[] = [];
	const baseHours = raw.operating_hours_at_start || 5000;
	const discrepancy = Number(raw.discrepancy_pct_target || 0);
	const baseDate = new Date();

	for (let i = 10; i >= 0; i--) {
		const d = new Date(baseDate);
		d.setDate(d.getDate() - i * 3);
		const counter = Math.round(baseHours - i * 120);
		const register = Math.round(counter * (1 - discrepancy));
		points.push({
			date: d.toISOString().split("T")[0],
			counterUsage: counter,
			registerUsage: register,
			discrepancyPercent: Math.round(discrepancy * 100),
			isLabeledDiscrepancyCase: discrepancy > 0.1,
		});
	}
	return points;
}

function generateMaintenanceLog(raw: any): MaintenanceRecord[] {
	const lastDate = raw.last_maintenance_date || "2026-03-01";
	return [
		{
			id: `maint-${raw.equipment_id || "001"}-1`,
			date: lastDate,
			type: "preventive",
			notes: "Scheduled routine calibration and component inspection.",
			daysSincePrevious: 60,
			actionPerformed: "Replaced filter set and calibrated sensor arrays.",
			technician: "Senior Biomedical Engineer",
			durationHours: 2.5,
			partsCost: 3500,
			downtimeHours: 0,
		},
	];
}

function generateFailureEvents(raw: any): FailureEvent[] {
	if ((raw.criticality || "").toLowerCase() !== "high") return [];
	return [
		{
			id: `fail-${raw.equipment_id || "001"}-1`,
			timestamp: "2026-02-15T08:30:00Z",
			mode: "Thermal regulation threshold exceeded",
			severity: "high",
			riskScore: 78,
			downtimeHours: 3.5,
			estimatedRepairCost: 8500,
			rationale: raw.scenario_rationale || "Injected maintenance stress pattern.",
		},
	];
}

export function adaptBackendEquipment(raw: any): Equipment {
	const id = String(raw.equipment_id || raw.id);
	const rawCriticality = (raw.criticality || "Medium").toLowerCase();

	const riskLevel: RiskLevel =
		raw.risk_level ||
		(rawCriticality === "high" || rawCriticality === "critical"
			? "high"
			: rawCriticality === "low"
				? "low"
				: "medium");

	const riskScore =
		raw.risk_score ??
		(riskLevel === "critical" ? 85 : riskLevel === "high" ? 72 : riskLevel === "medium" ? 48 : 22);

	const discrepancyPercent =
		raw.discrepancy_pct_target !== undefined
			? Math.round(Number(raw.discrepancy_pct_target) * 100)
			: 0;

	const discrepancyFlagged =
		raw.discrepancy_pct_target !== undefined
			? Number(raw.discrepancy_pct_target) > 0.1
			: false;

	const interval = raw.maintenance_interval_days || 90;
	const leadTimeDays = Math.max(3, Math.round(interval / 10));

	return {
		id,
		facilityId: String(raw.facility_id || "10083"),
		name:
			raw.name ||
			(raw.manufacturer && raw.model
				? `${raw.manufacturer} ${raw.model} (${raw.equipment_type})`
				: `${raw.equipment_type || "Medical Equipment"} ${id}`),
		type: normalizeEquipmentType(raw.equipment_type),
		backendEquipmentType: raw.equipment_type,
		manufacturer: raw.manufacturer || "Philips",
		model: raw.model || "Standard",
		serialNumber: raw.serial_number || `SN-${id}`,
		installDate: raw.installation_date || "2020-01-01",
		usageDays: 730,
		counterUsage: raw.operating_hours_at_start || 6500,
		registerUsage: Math.round((raw.operating_hours_at_start || 6500) * (1 - (raw.discrepancy_pct_target || 0))),
		discrepancyPercent,
		discrepancyFlagged,
		riskScore,
		riskLevel,
		leadTimeDays,
		scenarioPattern: raw.scenario_type || "Normal",
		scenarioRationale: raw.scenario_rationale || "Routine operating conditions.",
		lastMaintenanceDate: raw.last_maintenance_date || "2026-03-01",
		maintenanceIntervalDays: interval,
		criticality: raw.criticality || "Medium",
		department: raw.department || "Clinical Unit",
		telemetryHistory: generateTelemetryFromRaw(raw),
		maintenanceLog: generateMaintenanceLog(raw),
		usageHistory: generateUsageHistory(raw),
		failureEvents: generateFailureEvents(raw),
		operationalStatus: raw.status || "Operational",
		rulHours: riskLevel === "critical" ? 120 : riskLevel === "high" ? 360 : 720,
		totalDowntimeHours: rawCriticality === "high" ? 4.5 : 0,
		estimatedRepairCost: rawCriticality === "high" ? 12000 : 0,
	};
}

export function adaptBackendFacility(raw: any): Facility {
	const id = String(raw.facility_id || raw.id);
	return {
		id,
		name: raw.facility || raw.facility_name || raw.name || `Facility ${id}`,
		county: raw.county || "Nairobi",
		serviceLevel: raw.keph_level || "Level 4",
		facilityType: raw.facility_type || "Hospital",
		department: raw.department || "General Medicine",
		beds: raw.beds || 80,
		cots: raw.cots || 15,
		bedsAndCots: raw.beds_and_cots || 95,
		operationStatus: raw.status || "Operational",
		latitude: raw.latitude ?? -1.2864,
		longitude: raw.longitude ?? 36.8172,
		subCounty: raw.sub_county || raw.county,
		ward: raw.ward || "Central",
	};
}

export function adaptBackendAlert(raw: any): Alert {
	return {
		id: String(raw.id || raw.alert_id || `alert-${Date.now()}`),
		type: (raw.alert_type?.toLowerCase().includes("discrepancy") ? "discrepancy" : "risk"),
		severity: (raw.severity || "medium").toLowerCase() as any,
		equipmentId: String(raw.equipment_id || "ME-00001"),
		facilityId: String(raw.facility_id || "10083"),
		message: raw.message || raw.title || "Equipment notification",
		scenarioRationale: raw.recommendation || raw.message,
		createdAt: raw.created_at || raw.timestamp || new Date().toISOString(),
	};
}

interface LiveDataContextType {
	equipment: Equipment[];
	facilities: Facility[];
	alerts: Alert[];
	summary: any | null;
	isLoading: boolean;
	isLive: boolean;
	lastFetchedAt: Date | null;
	apiBaseUrl: string;
	error: string | null;
	autoRefresh: boolean;
	setAutoRefresh: (enabled: boolean) => void;
	refresh: () => Promise<void>;
	getFacilityName: (facilityId: string) => string;
	getEquipmentName: (equipmentId: string) => string;
	getFacilityById: (facilityId: string) => Facility | undefined;
	getEquipmentById: (equipmentId: string) => Equipment | undefined;
	getAlertsForEquipment: (equipmentId: string) => Alert[];
}

const LiveDataContext = createContext<LiveDataContextType | undefined>(undefined);

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const [facilities, setFacilities] = useState<Facility[]>([]);
	const [alerts, setAlerts] = useState<Alert[]>([]);
	const [summary, setSummary] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isLive, setIsLive] = useState(false);
	const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [autoRefresh, setAutoRefresh] = useState(true);

	const loadData = useCallback(async (isSilent = false) => {
		if (!isSilent) setIsLoading(true);
		setError(null);

		try {
			// Fetch live data directly from backend API
			const [eqResult, facResult, alertsResult, summaryResult] = await Promise.allSettled([
				api.equipment.list(),
				api.facilities.list(),
				api.alerts.list(),
				api.dashboard.summary(),
			]);

			let adaptedEquipment: Equipment[] = [];
			let adaptedFacilities: Facility[] = [];
			let adaptedAlerts: Alert[] = [];

			if (eqResult.status === "fulfilled" && Array.isArray(eqResult.value)) {
				adaptedEquipment = eqResult.value.map(adaptBackendEquipment);
				setEquipment(adaptedEquipment);
			}

			if (facResult.status === "fulfilled" && Array.isArray(facResult.value)) {
				adaptedFacilities = facResult.value.map(adaptBackendFacility);
				setFacilities(adaptedFacilities);
			}

			if (alertsResult.status === "fulfilled") {
				const val = alertsResult.value;
				const list = Array.isArray(val) ? val : val?.items || val?.alerts || [];
				adaptedAlerts = list.map(adaptBackendAlert);
			}

			// If no explicit alerts in DB table, derive real-time active signals from live equipment risk & discrepancies
			if (adaptedAlerts.length === 0 && adaptedEquipment.length > 0) {
				const generatedAlerts: Alert[] = [];
				adaptedEquipment.forEach((eq) => {
					if (eq.riskLevel === "critical" || eq.riskScore >= 75) {
						generatedAlerts.push({
							id: `live-alert-${eq.id}-risk`,
							type: "risk",
							severity: "critical",
							equipmentId: eq.id,
							facilityId: eq.facilityId,
							message: `Critical telemetry failure risk detected on ${eq.name}`,
							scenarioRationale: eq.scenarioRationale || "High risk score exceeding critical operational threshold.",
							createdAt: new Date().toISOString(),
						});
					} else if (eq.discrepancyFlagged) {
						generatedAlerts.push({
							id: `live-alert-${eq.id}-discrepancy`,
							type: "discrepancy",
							severity: "high",
							equipmentId: eq.id,
							facilityId: eq.facilityId,
							message: `Usage counter discrepancy of ${eq.discrepancyPercent}% flagged on ${eq.name}`,
							scenarioRationale: `Discrepancy of ${eq.discrepancyPercent}% exceeds standard 10% tolerance between counter and manual register.`,
							createdAt: new Date().toISOString(),
						});
					}
				});
				adaptedAlerts = generatedAlerts;
			}

			setAlerts(adaptedAlerts);

			if (summaryResult.status === "fulfilled" && summaryResult.value) {
				setSummary(summaryResult.value);
			}

			setIsLive(true);
			setLastFetchedAt(new Date());
		} catch (err: any) {
			console.error("LiveDataProvider failed to fetch from backend API:", err);
			setError(err?.message || "Failed to load live data from API");
		} finally {
			if (!isSilent) setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Auto-refresh interval (polling every 30 seconds when enabled)
	useEffect(() => {
		if (!autoRefresh) return;
		const interval = setInterval(() => {
			loadData(true);
		}, 30000);
		return () => clearInterval(interval);
	}, [autoRefresh, loadData]);

	const facilityMap = useMemo(() => new Map(facilities.map((f) => [f.id, f])), [facilities]);
	const equipmentMap = useMemo(() => new Map(equipment.map((e) => [e.id, e])), [equipment]);

	const getFacilityName = useCallback(
		(facilityId: string) => facilityMap.get(facilityId)?.name || `Facility ${facilityId}`,
		[facilityMap],
	);

	const getEquipmentName = useCallback(
		(equipmentId: string) => equipmentMap.get(equipmentId)?.name || `Equipment ${equipmentId}`,
		[equipmentMap],
	);

	const getFacilityById = useCallback(
		(facilityId: string) => facilityMap.get(facilityId),
		[facilityMap],
	);

	const getEquipmentById = useCallback(
		(equipmentId: string) => equipmentMap.get(equipmentId),
		[equipmentMap],
	);

	const getAlertsForEquipment = useCallback(
		(equipmentId: string) => alerts.filter((a) => a.equipmentId === equipmentId),
		[alerts],
	);

	return (
		<LiveDataContext.Provider
			value={{
				equipment,
				facilities,
				alerts,
				summary,
				isLoading,
				isLive,
				lastFetchedAt,
				apiBaseUrl: API_BASE,
				error,
				autoRefresh,
				setAutoRefresh,
				refresh: () => loadData(false),
				getFacilityName,
				getEquipmentName,
				getFacilityById,
				getEquipmentById,
				getAlertsForEquipment,
			}}
		>
			{children}
		</LiveDataContext.Provider>
	);

}

export function useLiveData() {
	const context = useContext(LiveDataContext);
	if (!context) {
		throw new Error("useLiveData must be used within a LiveDataProvider");
	}
	return context;
}
