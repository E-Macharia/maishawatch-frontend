import { NextResponse } from "next/server";
import { api } from "@/lib/api/backend-client";

export async function GET() {
	try {
		const summary = await api.dashboard.summary();
		return NextResponse.json({
			data: {
				backendSummary: summary,
			},
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				status: "error",
				message: error?.message || "Failed to fetch analytics summary from backend",
			},
			{ status: 502 },
		);
	}
}

