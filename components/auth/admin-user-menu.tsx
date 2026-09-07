"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ShieldCheck,
  Lock,
  LogOut,
  User,
  ChevronDown,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function AdminUserMenu() {
  const { user, isAuthenticated, isAdmin, openLoginModal, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return (
      <button
        onClick={openLoginModal}
        className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-2xs"
      >
        <Lock className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Admin Sign In</span>
        <span className="sm:hidden">Login</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 sm:px-2.5 sm:py-1.5 hover:bg-accent text-foreground transition-colors shadow-2xs"
        aria-expanded={dropdownOpen}
      >
        <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
          <ShieldCheck className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
        </div>
        <div className="hidden text-left md:block">
          <p className="text-xs font-bold leading-tight text-foreground truncate max-w-[130px]">
            {user?.name || "Administrator"}
          </p>
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
            {isAdmin ? "National Admin" : "User"}
          </p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="border-b border-border pb-3 mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Live Session
              </span>
              <span className="text-[10px] text-muted-foreground">National Scope</span>
            </div>
            <p className="mt-1.5 text-xs font-bold text-foreground truncate">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{user?.email}</p>
          </div>

          <div className="space-y-1 text-xs">
            <div className="rounded-lg p-2 bg-accent/40 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Role Permission</span>
                <span className="text-primary font-bold">Write / Execute</span>
              </div>
              <p className="text-[10px]">Connected to live Render backend with JWT authentication.</p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-border">
            <button
              onClick={() => {
                logout();
                setDropdownOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out of Admin Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
