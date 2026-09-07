import { NextResponse } from "next/server";
import { fetchEquipmentList } from "@/lib/api/backend-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const county = searchParams.get("county") ?? undefined;
  const risk = searchParams.get("risk") ?? undefined;
  const type = searchParams.get("type") ?? undefined;

  const items = await fetchEquipmentList({ q, county, risk, type });
  return NextResponse.json({
    meta: { count: items.length },
    data: items,
  });
}
