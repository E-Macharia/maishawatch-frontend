"use client";
import { useState } from "react";
import { Mail, MessageSquare, Send, X } from "lucide-react";
import type { Alert, Equipment, Facility } from "@/types/maishawatch";

type Props = { alert: Alert; equipment: Equipment; facility: Facility; onClose: () => void };

export function HospitalAlertDialog({ alert, equipment, facility, onClose }: Props) {
  const [message, setMessage] = useState(`MaishaWatch critical alert: ${equipment.name} at ${facility.name} requires immediate biomedical engineering review. Risk level: ${alert.severity}. ${alert.message}`);
  const [sent, setSent] = useState<string[]>([]);
  const email = `biomedical.${facility.county.toLowerCase().replace(/\s+/g, "-")}@hospital.demo`;
  const phone = "+254700000000";
  const record = (channel:string) => {
    const existing = JSON.parse(localStorage.getItem("maisha-hospital-alert-log") || "[]");
    localStorage.setItem("maisha-hospital-alert-log", JSON.stringify([{alertId:alert.id,facilityId:facility.id,channel,sentAt:new Date().toISOString(),message},...existing]));
    setSent(items=>Array.from(new Set([...items,channel])));
  };
  const sendEmail=()=>{record("email");window.location.href=`mailto:${email}?subject=${encodeURIComponent(`MaishaWatch critical equipment alert — ${equipment.name}`)}&body=${encodeURIComponent(message)}`;};
  const sendSms=()=>{record("sms");window.location.href=`sms:${phone}?body=${encodeURIComponent(message)}`;};

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
    <div className="w-full max-w-xl rounded-[5px] border border-white/[0.08] bg-[#0b1118] shadow-[0_30px_100px_rgba(0,0,0,.55)]">
      <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">Hospital notification</p><h2 className="mt-1 text-base font-semibold text-white">Notify {facility.name}</h2><p className="mt-1 text-xs text-slate-500">Choose an immediate communication channel for this alert.</p></div><button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-[5px] text-slate-500 hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4"/></button></div>
      <div className="space-y-4 p-5">
        <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-[5px] border border-white/[0.06] bg-white/[0.02] p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">Email destination</p><p className="mt-1 break-all text-xs text-slate-300">{email}</p></div><div className="rounded-[5px] border border-white/[0.06] bg-white/[0.02] p-3"><p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">SMS destination</p><p className="mt-1 text-xs text-slate-300">{phone}</p></div></div>
        <label className="block"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Message</span><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={6} className="mt-2 w-full rounded-[5px] border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-xs leading-5 text-slate-200 outline-none focus:border-blue-400/30"/></label>
        <div className="grid gap-2 sm:grid-cols-2"><button onClick={sendEmail} className="flex h-10 items-center justify-center gap-2 rounded-[5px] bg-white text-xs font-semibold text-slate-950 hover:bg-slate-200"><Mail className="h-3.5 w-3.5"/> Send email {sent.includes("email")&&<span className="text-emerald-600">✓</span>}</button><button onClick={sendSms} className="flex h-10 items-center justify-center gap-2 rounded-[5px] border border-white/[0.08] bg-white/[0.025] text-xs font-semibold text-slate-200 hover:bg-white/[0.05]"><MessageSquare className="h-3.5 w-3.5"/> Send SMS {sent.includes("sms")&&<span className="text-emerald-300">✓</span>}</button></div>
        <div className="flex items-start gap-2 rounded-[5px] border border-blue-400/10 bg-blue-400/[0.035] p-3"><Send className="mt-0.5 h-3.5 w-3.5 text-blue-300"/><p className="text-[10px] leading-5 text-slate-500">Communication activity is recorded with the alert so the team has an auditable notification trail.</p></div>
      </div>
    </div>
  </div>;
}
