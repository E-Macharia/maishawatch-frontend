import { NextResponse } from "next/server"; import { getFacilitySummary } from "@/lib/data/insights";
export async function GET(_:Request,{params}:{params:Promise<{facilityId:string}>}){const {facilityId}=await params; const item=getFacilitySummary(facilityId); return item.facility?NextResponse.json({data:item}):NextResponse.json({error:"Facility not found"},{status:404});}
