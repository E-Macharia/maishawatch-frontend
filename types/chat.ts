import { RiskLevel } from "./maishawatch";

export type MessageRole = "user" | "assistant" | "system";

export interface NavigationAction {
  label: string;
  path: string;
  autoNavigate?: boolean;
}

export interface EquipmentCardPayload {
  id: string;
  name: string;
  type: string;
  facilityName: string;
  county: string;
  riskLevel: RiskLevel;
  riskScore: number;
  rulHours?: number;
  discrepancyPercent?: number;
  discrepancyFlagged?: boolean;
  maintenanceDue?: boolean;
  status: string;
}

export interface FacilityCardPayload {
  id: string;
  name: string;
  county: string;
  serviceLevel: string;
  beds?: number;
  operationStatus?: string;
  equipmentCount?: number;
  highRiskCount?: number;
}

export interface MetricSummaryPayload {
  title: string;
  value: string | number;
  change?: string;
  description?: string;
  intent?: "danger" | "warning" | "success" | "info";
}

export type RichCardPayload =
  | { type: "equipment"; data: EquipmentCardPayload }
  | { type: "facility"; data: FacilityCardPayload }
  | { type: "metric"; data: MetricSummaryPayload };

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  cards?: RichCardPayload[];
  navigationAction?: NavigationAction;
  suggestedPrompts?: string[];
}

export interface ChatAdapter {
  sendMessage(userQuery: string, history?: ChatMessage[]): Promise<ChatMessage>;
}
