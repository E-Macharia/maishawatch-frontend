import { NextResponse } from "next/server"; import { getEquipmentById } from "@/lib/data/insights";
export async function GET(_:Request,{params}:{params:Promise<{equipmentId:string}>}){const {equipmentId}=await params; const item=getEquipmentById(equipmentId); return item?NextResponse.json({data:item}):NextResponse.json({error:"Equipment not found"},{status:404});}
