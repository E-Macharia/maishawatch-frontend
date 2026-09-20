"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCheck, ExternalLink, X } from "lucide-react";
import { useLiveData } from "@/lib/data/live-context";

export function NotificationsPopover() {
  const { alerts: liveAlerts, getEquipmentName, getFacilityName } = useLiveData();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRead(JSON.parse(localStorage.getItem("maisha-notification-read") || "[]"));
    } catch {}
  }, []);

  const alerts = useMemo(
    () => liveAlerts.filter((a) => a.severity === "critical" || a.severity === "high").slice(0, 6),
    [liveAlerts]
  );


  const unread = alerts.filter((a) => !read.includes(a.id));

  const markAll = () => {
    const ids = alerts.map((a) => a.id);
    setRead(ids);
    localStorage.setItem("maisha-notification-read", JSON.stringify(ids));
  };

  const mark = (id: string) => {
    const next = Array.from(new Set([...read, id]));
    setRead(next);
    localStorage.setItem("maisha-notification-read", JSON.stringify(next));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
            <div>
              <p className="text-xs font-bold text-foreground">Notifications</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{unread.length} unread operational signals</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={markAll}
                title="Mark all as read"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
            {alerts.map((alert) => {
              const isUnread = !read.includes(alert.id);
              return (
                <div
                  key={alert.id}
                  className={`px-4 py-3 transition-colors ${
                    isUnread ? "bg-primary/5" : "hover:bg-accent/40"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-foreground">
                          {getEquipmentName(alert.equipmentId)}
                        </p>
                        {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {alert.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/80 font-medium">
                        {getFacilityName(alert.facilityId)} • <span className="uppercase font-bold text-red-500">{alert.severity}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        {isUnread && (
                          <button
                            onClick={() => mark(alert.id)}
                            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                        <Link
                          onClick={() => mark(alert.id)}
                          href={`/equipment/${alert.equipmentId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          Inspect <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border px-4 py-3 bg-muted/20">
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary hover:underline block text-center"
            >
              Open Alert Centre →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
