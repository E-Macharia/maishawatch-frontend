"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Activity, Bell, FileText, ChevronLeft, ChevronRight, HeartPulse, X, LucideIcon, ShieldCheck, Globe } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { NavGroup, UserProfile } from "@/types/navigation";
import { cn } from "@/lib/utils";
import { maishawatchData } from "@/lib/data";

const ICON_MAP: Record<string, LucideIcon> = { LayoutDashboard, Building2, Activity, Bell, FileText, Globe };

export default function Sidebar({ navGroups, user: _user }: { navGroups: NavGroup[]; user?: UserProfile }) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleSidebar, closeMobileSidebar } = useSidebar();
  const alertCount = maishawatchData.alerts.length;
  return <>
    {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden" onClick={closeMobileSidebar} />}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[18px_0_55px_rgba(0,0,0,.16)] backdrop-blur-xl transition-all duration-300", isCollapsed ? "lg:w-[76px]" : "lg:w-[248px]", isMobileOpen ? "w-[248px] translate-x-0" : "-translate-x-full lg:translate-x-0")}>
      <div className="flex h-[72px] items-center justify-between border-b border-white/[0.06] px-4">
        <Link href="/overview" onClick={closeMobileSidebar} className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-gradient-to-br from-blue-400 to-cyan-300 text-slate-950 shadow-[0_10px_30px_rgba(96,165,250,.24)]"><HeartPulse className="h-4 w-4"/></div>
          {!isCollapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold tracking-tight text-white">MaishaWatch</p><p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.15em] text-slate-500">Equipment intelligence</p></div>}
        </Link>
        <button onClick={toggleSidebar} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden h-8 w-8 items-center justify-center rounded-[5px] text-slate-500 hover:bg-white/[0.05] hover:text-white lg:flex">{isCollapsed?<ChevronRight className="h-4 w-4"/>:<ChevronLeft className="h-4 w-4"/>}</button>
        <button onClick={closeMobileSidebar} aria-label="Close navigation" className="flex h-8 w-8 items-center justify-center rounded-[5px] text-slate-500 hover:bg-white/[0.05] hover:text-white lg:hidden"><X className="h-4 w-4"/></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group, groupIdx) => <div key={groupIdx} className="mb-7">
          {group.groupLabel && !isCollapsed && <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">{group.groupLabel}</div>}
          <div className="space-y-1">
            {group.items.map(item => {
              const Icon = ICON_MAP[item.iconName] || Activity;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const badge = item.href === "/alerts" ? alertCount : item.badge;
              return <Link key={item.href} href={item.href} onClick={closeMobileSidebar} title={isCollapsed?item.title:undefined} className={cn("group relative flex items-center gap-3 rounded-[5px] px-3 py-2.5 text-[13px] font-medium transition-all", isActive ? "bg-white/[0.075] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200")}>
                {isActive && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-[5px] bg-gradient-to-b from-blue-300 to-cyan-300"/>}
                <Icon className={cn("h-4 w-4 shrink-0", isActive?"text-blue-300":"text-slate-500 group-hover:text-slate-300")}/>
                {!isCollapsed && <span className="flex-1 truncate">{item.title}</span>}
                {badge!==undefined&&!isCollapsed&&<span className="min-w-6 rounded-[5px] border border-white/[0.06] bg-white/[0.025] px-1.5 py-0.5 text-center text-[11px] font-semibold text-slate-500">{typeof badge === "number" && badge > 99 ? "99+" : badge}</span>}
              </Link>;
            })}
          </div>
        </div>)}
      </div>
      <div className="border-t border-white/[0.06] px-3 py-4">
        {!isCollapsed ? <div className="rounded-[5px] border border-white/[0.06] bg-gradient-to-br from-blue-400/[0.08] to-cyan-300/[0.03] p-4">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300"/><span className="text-xs font-semibold text-slate-200">Monitoring active</span></div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">Network risk signals are being monitored across the current scope.</p>
        </div> : <div className="flex justify-center"><div title="Monitoring active" className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-300"><ShieldCheck className="h-4 w-4"/></div></div>}
      </div>
    </aside>
  </>;
}
