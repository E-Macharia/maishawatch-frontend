"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, X } from "lucide-react";
import type { Alert, Equipment, Facility } from "@/types/maishawatch";

type Props = { alert: Alert; equipment: Equipment; facility: Facility; onClose: () => void };

export function HospitalAlertDialog({ alert, equipment, facility, onClose }: Props) {
  const [message, setMessage] = useState(
    `MaishaWatch critical alert: ${equipment.name} at ${facility.name} requires immediate biomedical engineering review. Risk level: ${alert.severity}. ${alert.message}`
  );
  const [sent, setSent] = useState<string[]>([]);
  const email = `biomedical.${facility.county.toLowerCase().replace(/\s+/g, "-")}@hospital.demo`;
  const phone = "+254700000000";

  const record = (channel: string) => {
    const existing = JSON.parse(localStorage.getItem("maisha-hospital-alert-log") || "[]");
    localStorage.setItem(
      "maisha-hospital-alert-log",
      JSON.stringify([{ alertId: alert.id, facilityId: facility.id, channel, sentAt: new Date().toISOString(), message }, ...existing])
    );
    setSent((items) => Array.from(new Set([...items, channel])));
  };

  const sendEmail = () => {
    record("email");
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      `MaishaWatch critical equipment alert — ${equipment.name}`
    )}&body=${encodeURIComponent(message)}`;
  };

  const sendSms = () => {
    record("sms");
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Hospital Notification</p>
            <h2 className="mt-1 text-base font-bold text-foreground">Notify {facility.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Select communication channel to trigger urgent escalation.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Destination</p>
              <p className="mt-1 break-all text-xs font-mono font-semibold text-foreground">{email}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SMS Destination</p>
              <p className="mt-1 text-xs font-mono font-semibold text-foreground">{phone}</p>
            </div>
          </div>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notification Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs leading-relaxed text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs"
            />
          </label>

          <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
            <button
              onClick={sendEmail}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              <Mail className="h-4 w-4" /> Send Email {sent.includes("email") && <span className="text-emerald-300 font-bold">✓</span>}
            </button>
            <button
              onClick={sendSms}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" /> Send SMS {sent.includes("sms") && <span className="text-emerald-500 font-bold">✓</span>}
            </button>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <Send className="mt-0.5 h-4 w-4 text-primary shrink-0" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Communication activity is automatically recorded with the alert so the team has an auditable notification log.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
