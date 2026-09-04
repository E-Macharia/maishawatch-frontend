import { NextResponse } from "next/server"; import { getOverviewMetrics } from "@/lib/data/metrics"; import { getCountyRiskRanking } from "@/lib/data/insights";
export async function GET(){return NextResponse.json({data:{overview:getOverviewMetrics(),countyRisk:getCountyRiskRanking()}});}
