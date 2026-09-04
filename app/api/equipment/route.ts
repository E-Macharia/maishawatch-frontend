import { NextResponse } from "next/server";
import { maishawatchData } from "@/lib/data";
export async function GET(request: Request){
  const {searchParams}=new URL(request.url); const query=(searchParams.get("q")??"").trim().toLowerCase(); const county=(searchParams.get("county")??"").trim().toLowerCase(); const risk=searchParams.get("risk");
  const items=maishawatchData.equipment.filter(e=>{const facility=maishawatchData.facilities.find(f=>f.id===e.facilityId); const hay=`${e.id} ${e.name} ${e.serialNumber} ${e.manufacturer??""} ${facility?.name??""} ${facility?.county??""}`.toLowerCase(); return (!query||hay.includes(query))&&(!county||facility?.county.toLowerCase()===county)&&(!risk||e.riskLevel===risk)});
  return NextResponse.json({meta:{count:items.length,source:maishawatchData.meta.source},data:items});
}
