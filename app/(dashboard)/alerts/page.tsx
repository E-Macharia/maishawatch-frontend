"use client";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import { AlertTriangle,ArrowUpRight,BellRing,CheckCircle2,CircleAlert,Search,X,Send } from "lucide-react";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Reveal } from "@/components/dashboard/motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/dashboard/pagination";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { maishawatchData,getFacilityName,getEquipmentName,facilityById,equipmentById } from "@/lib/data";
import { AlertResolutionDialog } from "@/components/dashboard/alert-resolution-dialog";
import { HospitalAlertDialog } from "@/components/dashboard/hospital-alert-dialog";

const PAGE_SIZE=8;

export default function AlertsPage(){
  const [severity,setSeverity]=useState("all");
  const [type,setType]=useState("all");
  const [query,setQuery]=useState("");
  const [resolved,setResolved]=useState<string[]>([]);
  const [page,setPage]=useState(1);
  const [selected,setSelected]=useState<(typeof maishawatchData.alerts)[number]|null>(null);
  const [notify,setNotify]=useState<(typeof maishawatchData.alerts)[number]|null>(null);

  useEffect(()=>{try{setResolved(JSON.parse(localStorage.getItem("maisha-resolved-alerts")||"[]"))}catch{}},[]);
  const filtered=useMemo(()=>maishawatchData.alerts.filter(a=>!resolved.includes(a.id)&&(severity==="all"||a.severity===severity)&&(type==="all"||a.type===type)&&(!query||`${getEquipmentName(a.equipmentId)} ${getFacilityName(a.facilityId)} ${a.message}`.toLowerCase().includes(query.toLowerCase()))),[severity,type,query,resolved]);
  const pageCount=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const rows=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const critical=maishawatchData.alerts.filter(x=>x.severity==="critical"&&!resolved.includes(x.id)).length;
  const discrepancies=maishawatchData.alerts.filter(x=>x.type==="discrepancy"&&!resolved.includes(x.id)).length;
  const resolve=(id:string)=>{setResolved(x=>Array.from(new Set([...x,id])));setSelected(null);setPage(1);};

  return <div className="space-y-5">
    {selected&&<AlertResolutionDialog alert={selected} equipment={equipmentById.get(selected.equipmentId)!} onClose={()=>setSelected(null)} onResolved={resolve}/>}
    {notify&&<HospitalAlertDialog alert={notify} equipment={equipmentById.get(notify.equipmentId)!} facility={facilityById.get(notify.facilityId)!} onClose={()=>setNotify(null)}/>}
    <Reveal><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">Operational signals</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Alerts</h1><p className="mt-2 text-sm text-slate-500">Turn risk signals into a verified maintenance and hospital-notification workflow.</p></div></Reveal>
    <section className="grid gap-3 sm:grid-cols-3">
      <MetricCard label="Open alerts" value={maishawatchData.alerts.length-resolved.length} hint="Signals requiring review" icon={BellRing} tone="amber"/>
      <MetricCard label="Critical" value={critical} hint="Highest urgency" icon={AlertTriangle} tone="red"/>
      <MetricCard label="Discrepancies" value={discrepancies} hint="Usage reconciliation" icon={CircleAlert} tone="blue"/>
    </section>
    <Reveal delay={.08}><Card className="border-white/[0.07] bg-white/[0.025] ring-0">
      <CardHeader className="border-b border-white/[0.06] pb-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div><CardTitle className="text-sm font-semibold text-white">Signal queue</CardTitle><p className="mt-1 text-[13px] text-slate-500">{filtered.length} open signals match the current view.</p></div>
        <div className="flex flex-wrap gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600"/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Search alert, asset, facility..." className="h-9 w-64 rounded-[5px] border border-white/[0.08] bg-black/10 pl-9 pr-8 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-400/30"/>{query&&<button onClick={()=>{setQuery("");setPage(1)}} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600"><X className="h-3.5 w-3.5"/></button>}</div>
          <FilterSelect value={severity} onChange={v=>{setSeverity(v);setPage(1)}} options={[{value:"all",label:"All severity"},{value:"critical",label:"Critical"},{value:"high",label:"High"},{value:"medium",label:"Moderate"},{value:"low",label:"Low"}]}/>
          <FilterSelect value={type} onChange={v=>{setType(v);setPage(1)}} options={[{value:"all",label:"All types"},{value:"risk",label:"Risk"},{value:"discrepancy",label:"Discrepancy"}]}/>
        </div>
      </div></CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/[0.05]">{rows.map(alert=><div key={alert.id} className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3"><div className={alert.severity==="critical"?"flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-red-400/10 text-red-300":"flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-amber-400/10 text-amber-300"}>{alert.type==="risk"?<AlertTriangle className="h-4 w-4"/>:<CircleAlert className="h-4 w-4"/>}</div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[13px] font-semibold text-slate-200">{getEquipmentName(alert.equipmentId)}</p><span className="rounded-[5px] border border-white/[0.06] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.14em] text-slate-600">{alert.type}</span></div><p className="mt-1 text-[11px] leading-5 text-slate-500">{alert.message}</p><p className="mt-2 text-[10px] text-slate-700">{getFacilityName(alert.facilityId)} · {new Date(alert.createdAt).toLocaleString("en-KE",{dateStyle:"medium",timeStyle:"short"})}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0"><StatusBadge level={alert.severity}/><Link href={`/equipment/${alert.equipmentId}`} className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-white/[0.07] px-2.5 text-[10px] font-semibold text-slate-400 hover:bg-white/[0.05] hover:text-white">Inspect <ArrowUpRight className="h-3 w-3"/></Link><button onClick={()=>setNotify(alert)} className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-blue-400/15 bg-blue-400/[0.04] px-2.5 text-[10px] font-semibold text-blue-200 hover:bg-blue-400/[0.08]"><Send className="h-3 w-3"/> Notify</button><button onClick={()=>setSelected(alert)} className="inline-flex h-8 items-center gap-1.5 rounded-[5px] bg-white px-2.5 text-[10px] font-semibold text-slate-950 hover:bg-slate-200"><CheckCircle2 className="h-3 w-3"/> Resolve</button></div>
        </div>)}{rows.length===0&&<div className="py-20 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-300"/><p className="mt-3 text-sm font-semibold text-slate-300">Queue cleared</p><p className="mt-1 text-xs text-slate-600">No open signals match these filters.</p></div>}</div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} pageSize={PAGE_SIZE} total={filtered.length}/>
      </CardContent>
    </Card></Reveal>
  </div>;
}
