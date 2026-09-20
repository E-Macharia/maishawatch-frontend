import { NextResponse } from "next/server";
import { api } from "@/lib/api/backend-client";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q") ?? undefined;
	const type = searchParams.get("type") ?? undefined;

	try {
		const items = await api.equipment.list({
			search: q,
			equipment_type: type,
		});
		const list = Array.isArray(items) ? items : [];
		return NextResponse.json({
			meta: { count: list.length },
			data: list,
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				status: "error",
				message: error?.message || "Failed to fetch equipment from backend",
				data: [],
				meta: { count: 0 },
			},
			{ status: 502 },
		);
	}
}

