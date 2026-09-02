import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/maishawatch";
const styles: Record<RiskLevel,string> = { critical:"border-red-400/15 bg-red-400/10 text-red-300", high:"border-orange-400/15 bg-orange-400/10 text-orange-300", medium:"border-amber-400/15 bg-amber-400/10 text-amber-300", low:"border-emerald-400/15 bg-emerald-400/10 text-emerald-300" };
const labels: Record<RiskLevel,string> = { critical:"Critical", high:"High", medium:"Moderate", low:"Low" };
export function StatusBadge({level}:{level:RiskLevel}){ return <span className={cn("inline-flex items-center gap-1.5 rounded-[5px] border px-2 py-1 text-[10px] font-semibold",styles[level])}><span className="h-1.5 w-1.5 rounded-[5px] bg-current"/>{labels[level]}</span>; }
