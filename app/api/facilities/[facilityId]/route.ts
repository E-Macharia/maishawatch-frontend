import { NextResponse } from "next/server";
import { api } from "@/lib/api/backend-client";

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ facilityId: string }> },
) {
	const { facilityId } = await params;
	try {
		const list = await api.facilities.list();
		const facility = Array.isArray(list)
			? list.find(
					(f: any) =>
						String(f.facility_id || f.id) === String(facilityId),
				)
			: null;
		if (!facility) {
			return NextResponse.json(
				{ error: "Facility not found" },
				{ status: 404 },
			);
		}
		return NextResponse.json({ data: facility });
	} catch (error: any) {
		return NextResponse.json(
			{ error: error?.message || "Facility not found" },
			{ status: 404 },
		);
	}
}

