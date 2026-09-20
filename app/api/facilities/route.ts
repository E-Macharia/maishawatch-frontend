import { NextResponse } from "next/server";
import { api } from "@/lib/api/backend-client";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const q = (searchParams.get("q") ?? "").toLowerCase();
	const county = (searchParams.get("county") ?? "").toLowerCase();
	const keph_level =
		searchParams.get("kephLevel") || searchParams.get("keph_level") || undefined;

	try {
		const items = await api.facilities.list({
			name: q || undefined,
			county: county || undefined,
			keph_level,
		});
		const list = Array.isArray(items) ? items : [];
		return NextResponse.json({ meta: { count: list.length }, data: list });
	} catch (error: any) {
		return NextResponse.json(
			{
				status: "error",
				message: error?.message || "Failed to fetch facilities from backend",
				data: [],
				meta: { count: 0 },
			},
			{ status: 502 },
		);
	}
}

