"use client";
import { useMemo, useState } from "react";
import { Check, ClipboardCheck, FileCheck2, ShieldCheck, Wrench, X } from "lucide-react";
import type { Alert, Equipment } from "@/types/maishawatch";

const CHECKS = [
  { id: "verify", label: "Equipment identity verified", hint: "Confirm the asset serial number and location against the physical machine.", icon: ShieldCheck },
  { id: "inspect", label: "Physical inspection completed", hint: "Confirm the technician inspected the reported fault condition.", icon: ClipboardCheck },
  { id: "maintenance", label: "Required maintenance completed", hint: "Confirm corrective or preventive work was actually performed.", icon: Wrench },
  { id: "test", label: "Post-maintenance test passed", hint: "Confirm the asset was tested and returned to an acceptable operating state.", icon: FileCheck2 },
] as const;

type Props = { alert: Alert; equipment: Equipment; onClose: () => void; onResolved: (alertId: string) => void };

export function AlertResolutionDialog({ alert, equipment, onClose, onResolved }: Props) {
  const [checked, setChecked] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const complete = checked.length === CHECKS.length && notes.trim().length >= 12;
  const progress = Math.round((checked.length / CHECKS.length) * 100);
  const title = useMemo(() => alert.type === "risk" ? "Risk alert resolution" : "Usage discrepancy resolution", [alert.type]);
  const toggle = (id: string) => setChecked((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  const resolve = () => {
    if (!complete) return;
    const record = { alertId: alert.id, resolvedAt: new Date().toISOString(), checks: checked, notes, equipmentId: equipment.id };
    const current = JSON.parse(localStorage.getItem("maisha-alert-resolution-log") || "[]");
    localStorage.setItem("maisha-alert-resolution-log", JSON.stringify([record, ...current]));
    const resolved = JSON.parse(localStorage.getItem("maisha-resolved-alerts") || "[]");
    localStorage.setItem("maisha-resolved-alerts", JSON.stringify(Array.from(new Set([...resolved, alert.id]))));
    onResolved(alert.id);
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
    <div className="w-full max-w-2xl overflow-hidden rounded-[5px] border border-white/[0.08] bg-[#0b1118] shadow-[0_30px_100px_rgba(0,0,0,.55)]">
      <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300">Resolution workflow</p><h2 className="mt-1 text-base font-semibold text-white">{title}</h2><p className="mt-1 text-xs text-slate-500">{equipment.name} · {equipment.serialNumber}</p></div>
        <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-[5px] text-slate-500 hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4"/></button>
      </div>
      <div className="px-5 pt-5"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Maintenance verification</span><span className="text-[10px] font-semibold text-blue-300">{progress}% complete</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-[5px] bg-white/[0.06]"><div className="h-full rounded-[5px] bg-gradient-to-r from-blue-300 to-cyan-200 transition-all" style={{width:`${progress}%`}}/></div></div>
      <div className="space-y-2 p-5">
        {CHECKS.map(({id,label,hint,icon:Icon})=>{const active=checked.includes(id);return <button key={id} type="button" onClick={()=>toggle(id)} className={`flex w-full items-start gap-3 rounded-[5px] border p-3.5 text-left transition ${active?"border-emerald-400/20 bg-emerald-400/[0.05]":"border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]"}`}><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] ${active?"bg-emerald-300 text-slate-950":"bg-white/[0.04] text-slate-500"}`}>{active?<Check className="h-3.5 w-3.5"/>:<Icon className="h-3.5 w-3.5"/>}</span><span className="min-w-0"><span className="block text-xs font-semibold text-slate-200">{label}</span><span className="mt-1 block text-[10px] leading-5 text-slate-600">{hint}</span></span></button>})}
        <label className="block pt-2"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Resolution notes <span className="text-red-300">*</span></span><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} placeholder="Record the work completed, test result, and any follow-up requirement..." className="mt-2 w-full rounded-[5px] border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-xs leading-5 text-slate-200 outline-none placeholder:text-slate-700 focus:border-blue-400/30"/></label>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4"><p className="text-[10px] leading-4 text-slate-600">An alert can only be resolved after all verification steps are completed.</p><div className="flex gap-2"><button onClick={onClose} className="h-9 rounded-[5px] border border-white/[0.08] px-3 text-xs font-semibold text-slate-400 hover:bg-white/[0.04] hover:text-white">Cancel</button><button disabled={!complete} onClick={resolve} className="h-9 rounded-[5px] bg-white px-3 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-35 hover:bg-slate-200">Resolve verified alert</button></div></div>
    </div>
  </div>;
}
