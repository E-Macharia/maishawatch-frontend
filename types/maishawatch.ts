export type RiskLevel = "critical" | "high" | "medium" | "low";
export type EquipmentType =
	| "icu"
	| "theatre"
	| "dialysis"
	| "radiotherapy"
	| "imaging";
export type BackendEquipmentType =
	| "Hemodialysis"
	| "Ventilator"
	| "Ultrasound"
	| "CT"
	| "MRI"
	| "X-Ray"
	| "Patient Monitor"
	| "Anesthesia";
export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertType = "risk" | "discrepancy";
export type MaintenanceType = "preventive" | "inspection" | "corrective";

export interface MaintenanceRecord {
	id: string;
	date: string;
	type: MaintenanceType;
	notes: string;
	daysSincePrevious: number | null;
	actionPerformed?: string;
	technician?: string;
	durationHours?: number;
	partsCost?: number;
	downtimeHours?: number;
}

export interface UsagePoint {
	date: string;
	counterUsage: number;
	registerUsage: number;
	discrepancyPercent?: number;
	isLabeledDiscrepancyCase?: boolean;
}

export interface TelemetryPoint {
	date: string;
	riskScore: number | null;
	degradationIndex: number | null;
	utilizationRate: number | null;
	temperature: number | null;
	vibration: number | null;
	pressure: number | null;
	flowRate: number | null;
	powerConsumption: number | null;
	humidity: number | null;
}

export interface FailureEvent {
	id: string;
	timestamp: string;
	mode: string;
	severity: AlertSeverity;
	riskScore: number;
	downtimeHours: number;
	estimatedRepairCost: number;
	rationale: string;
}

export interface FacilityEligibility {
	hemodialysis: boolean | null;
	icuVentilator: boolean | null;
	anesthesiaTheatre: boolean | null;
	mriCt: boolean | null;
	xray: boolean | null;
	ultrasound: boolean | null;
	patientMonitor: boolean | null;
}

export interface Facility {
	id: string;
	name: string;
	county: string;
	serviceLevel: string;
	facilityType: string;
	department?: string;
	ownerType?: string;
	owner?: string;
	regulatoryBody?: string;
	beds?: number;
	cots?: number;
	bedsAndCots?: number;
	operationStatus?: string;
	openWholeDay?: string;
	openWeekends?: string;
	openPublicHolidays?: string;
	openLateNight?: string;
	subCounty?: string;
	constituency?: string;
	ward?: string;
	eligibility?: FacilityEligibility;
	equipmentEligibleAny?: boolean | null;
	serviceNames?: string[];
	latitude?: number | null;
	longitude?: number | null;
}

export interface Equipment {
	id: string;
	facilityId: string;
	name: string;
	type: EquipmentType;
	backendEquipmentType?: BackendEquipmentType | string;
	manufacturer?: string;
	model?: string;
	serialNumber: string;
	installDate: string;
	usageDays: number;
	counterUsage: number;
	registerUsage: number;
	discrepancyPercent: number;
	discrepancyFlagged: boolean;
	riskScore: number;
	riskLevel: RiskLevel;
	leadTimeDays: number;
	scenarioPattern: string;
	scenarioRationale: string;
	lastMaintenanceDate: string;
	maintenanceIntervalDays?: number;
	criticality?: string;
	department?: string;
	maintenanceDue?: boolean;
	operationalStatus?: string;
	conditionStatus?: string;
	degradationIndex?: number | null;
	rulHours?: number;
	utilizationRate?: number | null;
	latestErrorCode?: string;
	environment?: {
		temperature?: number | null;
		vibration?: number | null;
		pressure?: number | null;
		flowRate?: number | null;
		powerConsumption?: number | null;
		humidity?: number | null;
	};
	anomalyCounts?: {
		temperature: number;
		vibration: number;
		pressure: number;
		flow: number;
		power: number;
	};
	telemetryHistory: TelemetryPoint[];
	maintenanceLog: MaintenanceRecord[];
	usageHistory: UsagePoint[];
	failureEvents: FailureEvent[];
	failureCount?: number;
	totalDowntimeHours?: number;
	estimatedRepairCost?: number;

	failureProbability24h?: number | null;
	/** Failure probability within next 72 hours (0–1). */
	failureProbability72h?: number | null;
	/** Failure probability within next 168 hours / 7 days (0–1). */
	failureProbability168h?: number | null;
	/** Model-predicted remaining useful life in hours. */
	mlRulHours?: number | null;
	/** Risk level derived from model outputs. */
	mlRiskLevel?: RiskLevel | null;
	/** "model" when predictions came from scikit-learn models, otherwise "telemetry". */
	mlSource?: "model" | "telemetry";
}

export interface Alert {
	id: string;
	type: AlertType;
	severity: AlertSeverity;
	equipmentId: string;
	facilityId: string;
	message: string;
	scenarioRationale: string;
	createdAt: string;
}

export interface MaishaWatchDataset {
	meta: {
		generatedAt: string;
		facilityCount: number;
		equipmentCount: number;
		alertCount?: number;
		telemetryRows?: number;
		maintenanceRows?: number;
		usageRows?: number;
		failureRows?: number;
		source?: string;
		dataContract?: string;
		fixtureGeneratedAt?: string;
		note?: string;
	};
	facilities: Facility[];
	equipment: Equipment[];
	alerts: Alert[];
}
