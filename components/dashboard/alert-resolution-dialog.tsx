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
  const title = useMemo(() => (alert.type === "risk" ? "Risk Alert Resolution" : "Usage Discrepancy Resolution"), [alert.type]);
  const toggle = (id: string) => setChecked((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));

  const resolve = () => {
    if (!complete) return;
    const record = { alertId: alert.id, resolvedAt: new Date().toISOString(), checks: checked, notes, equipmentId: equipment.id };
    const current = JSON.parse(localStorage.getItem("maisha-alert-resolution-log") || "[]");
    localStorage.setItem("maisha-alert-resolution-log", JSON.stringify([record, ...current]));
    const resolved = JSON.parse(localStorage.getItem("maisha-resolved-alerts") || "[]");
    localStorage.setItem("maisha-resolved-alerts", JSON.stringify(Array.from(new Set([...resolved, alert.id]))));
    onResolved(alert.id);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Resolution Workflow</p>
            <h2 className="mt-1 text-base font-bold text-foreground">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{equipment.name} • {equipment.serialNumber}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pt-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Maintenance Verification</span>
            <span className="text-[11px] font-bold text-primary">{progress}% complete</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-2.5 p-6">
          {CHECKS.map(({ id, label, hint, icon: Icon }) => {
            const active = checked.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  active
                    ? "border-emerald-500/30 bg-emerald-500/10 text-foreground"
                    : "border-border bg-card hover:bg-accent/50 text-foreground"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    active ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {active ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-foreground">{label}</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{hint}</span>
                </span>
              </button>
            );
          })}

          <label className="block pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Resolution Notes <span className="text-red-500">*</span>
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Record work completed, test result, and follow-up recommendations (min 12 chars)..."
              className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4 bg-muted/20">
          <p className="text-[11px] text-muted-foreground">An alert can only be resolved after all verification steps are complete.</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 rounded-xl border border-border px-4 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!complete}
              onClick={resolve}
              className="h-9 rounded-xl bg-primary text-primary-foreground px-4 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              Resolve Verified Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
