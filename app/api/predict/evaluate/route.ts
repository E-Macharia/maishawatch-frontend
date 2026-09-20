import { NextRequest, NextResponse } from "next/server";
import { API_BASE, getAuthHeaders } from "@/lib/api/backend-client";

/**
 * Proxy to backend POST /equipment/evaluate
 */
export async function POST(req: NextRequest) {
	let body: { equipmentId?: string; equipment_id?: string; facilityId?: string };
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const equipmentId = body.equipment_id || body.equipmentId;
	if (!equipmentId) {
		return NextResponse.json(
			{ error: "equipment_id is required" },
			{ status: 400 },
		);
	}

	const headers: Record<string, string> = {
		...getAuthHeaders(),
		"Content-Type": "application/json",
	};
	const authHeader = req.headers.get("authorization");
	if (authHeader) {
		headers.Authorization = authHeader;
	}

	try {
		const upstream = await fetch(`${API_BASE}/equipment/evaluate`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				equipment_id: equipmentId,
			}),
			cache: "no-store",
		});

		const text = await upstream.text();
		let data: unknown = null;
		try {
			data = text ? JSON.parse(text) : null;
		} catch {
			data = { detail: text || upstream.statusText };
		}

		return NextResponse.json(data, { status: upstream.status });
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Backend connection failed";
		return NextResponse.json(
			{
				error: `Could not reach backend at ${API_BASE}: ${message}`,
			},
			{ status: 503 },
		);
	}
}
