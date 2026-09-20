import { NextRequest, NextResponse } from "next/server";
import { API_BASE, getAuthHeaders } from "@/lib/api/backend-client";

/**
 * Proxy to backend POST /equipment/evaluate
 */
export async function POST(req: NextRequest) {
  const base = (
    process.env.BACKEND_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://maishawatch-backend.onrender.com"
  ).replace(/\/$/, "");

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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    headers.Authorization = authHeader;
  } else if (process.env.BACKEND_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${process.env.BACKEND_AUTH_TOKEN}`;
  }

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
