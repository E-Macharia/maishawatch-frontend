import { NextResponse } from "next/server";
import { api, submitMaintenanceRecord } from "@/lib/api/backend-client";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const equipmentId = searchParams.get("equipmentId");

	try {
		const orders = await api.maintenance.list();
		const list = Array.isArray(orders) ? orders : [];
		const filtered = equipmentId
			? list.filter(
					(o: any) =>
						o.equipment_id === equipmentId || o.equipmentId === equipmentId,
				)
			: list;
		return NextResponse.json({
			meta: { count: filtered.length },
			data: filtered,
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				status: "error",
				message: error?.message || "Failed to fetch maintenance records",
				data: [],
				meta: { count: 0 },
			},
			{ status: 502 },
		);
	}
}


export async function POST(request: Request) {
	try {
		const body = await request.json();
		const result = await submitMaintenanceRecord(body);
		return NextResponse.json(result, { status: 201 });
	} catch (error: any) {
		return NextResponse.json(
			{
				status: "error",
				message: error?.message || "Failed to submit maintenance log",
			},
			{ status: 500 },
		);
	}
}
