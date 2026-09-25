import { NextResponse } from "next/server";
import { api } from "@/lib/api/backend-client";

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ equipmentId: string }> },
) {
	const { equipmentId } = await params;
	try {
		const item = await api.equipment.detail(equipmentId);
		return NextResponse.json({ data: item });
	} catch (error: any) {
		return NextResponse.json(
			{ error: error?.message || "Equipment not found" },
			{ status: 404 },
		);
	}
}

