import { NextResponse } from "next/server";
import { api } from "@/lib/api/backend-client";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const severity = searchParams.get("severity") || undefined;
	const status = searchParams.get("status") || undefined;

	try {
		const result = await api.alerts.list({ severity, status });
		const list = Array.isArray(result)
			? result
			: result?.items || result?.alerts || [];
		return NextResponse.json({ meta: { count: list.length }, data: list });
	} catch (error: any) {
		return NextResponse.json(
			{
				status: "error",
				message: error?.message || "Failed to fetch alerts from backend",
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
		const result = await api.alerts.create(body);
		return NextResponse.json(result, { status: 201 });
	} catch (error: any) {
		return NextResponse.json(
			{
				status: "error",
				message: error?.message || "Failed to create alert",
			},
			{ status: 500 },
		);
	}
}

