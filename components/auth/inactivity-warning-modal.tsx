"use client";

import React from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Clock, ShieldAlert, LogOut, ArrowRight } from "lucide-react";

export function InactivityWarningModal() {
  const { showInactivityWarning, secondsRemaining, extendSession, logout } = useAuth();

  if (!showInactivityWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-card p-6 sm:p-8 shadow-2xl text-foreground animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="inactivity-warning-title"
        aria-describedby="inactivity-warning-desc"
      >
        {/* Amber Alert Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2
              id="inactivity-warning-title"
              className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2"
            >
              Session Expiring Soon
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              30-minute security inactivity safeguard
            </p>
          </div>
        </div>

        {/* Informative Body */}
        <div className="space-y-4">
          <p id="inactivity-warning-desc" className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            You have been inactive for over <strong className="text-foreground font-semibold">28 minutes</strong>. For your security and compliance, your workspace will automatically lock in:
          </p>

          {/* Countdown Display Card */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              <span>Time remaining:</span>
            </div>
            <span className="font-mono text-2xl font-black tracking-widest text-amber-600 dark:text-amber-400">
              {formattedCountdown}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground/80 leading-normal">
            Click <strong>Extend Session</strong> to keep working, or interaction in any other open MaishaWatch tab will automatically refresh your session.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={extendSession}
            className="w-full sm:flex-1 h-11 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Extend Session</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full sm:w-auto h-11 px-4 rounded-2xl border border-border bg-card hover:bg-accent text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log out now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
