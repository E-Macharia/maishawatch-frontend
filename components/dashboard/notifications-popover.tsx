"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCheck, ExternalLink, X, Radio } from "lucide-react";
import { maishawatchData, getEquipmentName, getFacilityName } from "@/lib/data";
import { api } from "@/lib/api/backend-client";

interface LiveNotification {
  id: number | string;
  title?: string;
  message: string;
  notification_type?: string;
  is_read?: boolean;
  created_at?: string;
  equipment_id?: string;
  facility_id?: string;
}

export function NotificationsPopover() {
  const { alerts: liveAlerts, getEquipmentName, getFacilityName } = useLiveData();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Restore locally tracked read status
  useEffect(() => {
    try {
      setRead(JSON.parse(localStorage.getItem("maisha-notification-read") || "[]"));
    } catch {}
  }, []);

  // Fetch live notifications from backend
  useEffect(() => {
    let mounted = true;

    async function fetchLive() {
      try {
        const [items, countRes] = await Promise.all([
          api.notifications.mine().catch(() => null),
          api.notifications.unreadCount().catch(() => null),
        ]);

        if (mounted) {
          if (Array.isArray(items)) {
            setLiveNotifications(items);
            setIsLiveConnected(true);
          }
          if (countRes && typeof countRes.count === "number") {
            setUnreadCount(countRes.count);
          }
        }
      } catch (err) {
        console.warn("Could not fetch live notifications, using local signals", err);
      }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 30000); // Polling every 30s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fallback / standard alert signals
  const fallbackAlerts = useMemo(
    () => maishawatchData.alerts.filter((a) => a.severity === "critical" || a.severity === "high").slice(0, 6),
    []
  );

  // Active items to display
  const displayItems = useMemo(() => {
    if (liveNotifications.length > 0) {
      return liveNotifications.slice(0, 8).map((n) => ({
        id: String(n.id),
        title: n.title || (n.equipment_id ? getEquipmentName(n.equipment_id) : "System Notice"),
        message: n.message,
        severity: n.notification_type || "alert",
        equipmentId: n.equipment_id,
        facilityId: n.facility_id,
        isUnread: n.is_read !== undefined ? !n.is_read : !read.includes(String(n.id)),
      }));
    }

    return fallbackAlerts.map((a) => ({
      id: a.id,
      title: getEquipmentName(a.equipmentId),
      message: a.message,
      severity: a.severity,
      equipmentId: a.equipmentId,
      facilityId: a.facilityId,
      isUnread: !read.includes(a.id),
    }));
  }, [liveNotifications, fallbackAlerts, read]);

  const effectiveUnreadCount = liveNotifications.length > 0
    ? (unreadCount || displayItems.filter((i) => i.isUnread).length)
    : displayItems.filter((i) => i.isUnread).length;

  const markAll = async () => {
    const ids = displayItems.map((a) => a.id);
    setRead(ids);
    setUnreadCount(0);
    localStorage.setItem("maisha-notification-read", JSON.stringify(ids));

    try {
      await api.notifications.readAll();
    } catch {
      // Offline fallback is already handled
    }
  };

  const mark = async (id: string) => {
    const next = Array.from(new Set([...read, id]));
    setRead(next);
    setUnreadCount((c) => Math.max(0, c - 1));
    localStorage.setItem("maisha-notification-read", JSON.stringify(next));

    const numId = Number(id);
    if (!isNaN(numId)) {
      try {
        await api.notifications.read(numId);
      } catch {}
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {effectiveUnreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {effectiveUnreadCount > 9 ? "9+" : effectiveUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-foreground">Notifications</p>
                {isLiveConnected && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <Radio className="h-2 w-2 animate-pulse" /> Live API
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{effectiveUnreadCount} unread operational signals</p>
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
            {displayItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active notifications
              </div>
            ) : (
              displayItems.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 transition-colors ${
                    item.isUnread ? "bg-primary/5" : "hover:bg-accent/40"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-foreground">
                          {item.title}
                        </p>
                        {item.isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {item.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/80 font-medium">
                        {item.facilityId ? getFacilityName(item.facilityId) : "National"} • <span className="uppercase font-bold text-red-500">{item.severity}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        {item.isUnread && (
                          <button
                            onClick={() => mark(item.id)}
                            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                        {item.equipmentId && (
                          <Link
                            onClick={() => mark(item.id)}
                            href={`/equipment/${item.equipmentId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                          >
                            Inspect <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
