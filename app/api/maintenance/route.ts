import { NextResponse } from "next/server";
import { maishawatchData } from "@/lib/data";
import { submitMaintenanceRecord } from "@/lib/api/backend-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const equipmentId = searchParams.get("equipmentId");
  const records = maishawatchData.equipment.flatMap((e) =>
    equipmentId && e.id !== equipmentId
      ? []
      : e.maintenanceLog.map((m) => ({
          ...m,
          equipmentId: e.id,
          equipmentName: e.name,
          facilityId: e.facilityId,
        })),
  );
  return NextResponse.json({ meta: { count: records.length }, data: records });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitMaintenanceRecord(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || "Failed to submit maintenance log" },
      { status: 500 },
    );
  }
}
