import { NextResponse } from "next/server";
import { api } from "@/lib/api/backend-client";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const equipmentId = searchParams.get("equipmentId");

	try {
		const orders = await api.maintenance.list();
		const list = Array.isArray(orders) ? orders : [];
		const records = list
			.filter((o: any) => {
				const isCorrectEquipment = !equipmentId || o.equipment_id === equipmentId || o.equipmentId === equipmentId;
				const isCorrectType = (o.type || o.maintenance_type || "").toLowerCase().includes("corrective") || (o.notes || "").toLowerCase().includes("fail");
				return isCorrectEquipment && isCorrectType;
			})
			.map((o: any) => ({
				id: String(o.id || o.maintenance_id || `fail-${Date.now()}`),
				timestamp: o.created_at || o.timestamp || o.date || new Date().toISOString(),
				equipmentId: o.equipment_id || o.equipmentId,
				mode: o.action_taken || o.notes || "Component replacement / failure corrective action",
				severity: o.severity || "high",
				downtimeHours: Number(o.downtime_hours || o.downtimeHours || 3.0),
				estimatedRepairCost: Number(o.cost || o.partsCost || 8500),
				rationale: o.notes || "Corrective failure recovery record.",
			}));

		return NextResponse.json({
			meta: { count: records.length },
			data: records,
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				status: "error",
				message: error?.message || "Failed to fetch failure records",
				data: [],
				meta: { count: 0 },
			},
			{ status: 502 },
		);
	}
}

