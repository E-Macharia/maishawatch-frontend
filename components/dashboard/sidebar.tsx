"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	Building2,
	Activity,
	Bell,
	FileText,
	ChevronLeft,
	ChevronRight,
	HeartPulse,
	X,
	LucideIcon,
	ShieldCheck,
	Globe,
	Brain,
	Info,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { NavGroup, UserProfile } from "@/types/navigation";
import { cn } from "@/lib/utils";
import { maishawatchData } from "@/lib/data";

const ICON_MAP: Record<string, LucideIcon> = {
	LayoutDashboard,
	Building2,
	Activity,
	Bell,
	FileText,
	Globe,
	Brain,
	Info,
};

export default function Sidebar({
	navGroups,
	user: _user,
}: {
	navGroups: NavGroup[];
	user?: UserProfile;
}) {
	const pathname = usePathname();
	const { isCollapsed, isMobileOpen, toggleSidebar, closeMobileSidebar } =
		useSidebar();
	const alertCount = maishawatchData.alerts.length;

	return (
		<>
			{isMobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
					onClick={closeMobileSidebar}
				/>
			)}

			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl backdrop-blur-xl transition-all duration-300",
					isCollapsed ? "lg:w-[76px]" : "lg:w-[248px]",
					isMobileOpen
						? "w-[248px] translate-x-0"
						: "-translate-x-full lg:translate-x-0",
				)}
			>
				{/* Brand Header */}
				<div className="flex h-[72px] items-center justify-between border-b border-sidebar-border px-4">
					<Link
						href="/overview"
						onClick={closeMobileSidebar}
						className="flex min-w-0 items-center gap-3"
					>
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-slate-950 shadow-md">
							<HeartPulse className="h-4 w-4 text-white" />
						</div>
						{!isCollapsed && (
							<div className="min-w-0">
								<p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
									MaishaWatch
								</p>
								<p className="mt-0.5 truncate text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">
									Equipment intelligence
								</p>
							</div>
						)}
					</Link>

					<button
						onClick={toggleSidebar}
						aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
						className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:flex transition-colors"
					>
						{isCollapsed ? (
							<ChevronRight className="h-4 w-4" />
						) : (
							<ChevronLeft className="h-4 w-4" />
						)}
					</button>

					<button
						onClick={closeMobileSidebar}
						aria-label="Close navigation"
						className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Nav Navigation Links */}
				<div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 scrollbar-thin">
					{navGroups.map((group, groupIdx) => (
						<div key={groupIdx} className="mb-6">
							{group.groupLabel && !isCollapsed && (
								<div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
									{group.groupLabel}
								</div>
							)}
							<div className="space-y-1">
								{group.items.map((item) => {
									const Icon = ICON_MAP[item.iconName] || Activity;
									const isActive =
										pathname === item.href || pathname.startsWith(`${item.href}/`);
									const badge = item.href === "/alerts" ? alertCount : item.badge;

									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={closeMobileSidebar}
											title={isCollapsed ? item.title : undefined}
											className={cn(
												"group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
												isActive
													? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
													: "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
											)}
										>
											{isActive && (
												<span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-primary" />
											)}
											<Icon
												className={cn(
													"h-4 w-4 shrink-0 transition-colors",
													isActive
														? "text-primary font-bold"
														: "text-muted-foreground group-hover:text-sidebar-foreground",
												)}
											/>
											{!isCollapsed && (
												<span className="flex-1 truncate">{item.title}</span>
											)}
											{badge !== undefined && !isCollapsed && (
												<span className="min-w-5 rounded-md border border-sidebar-border bg-sidebar/50 px-1.5 py-0.5 text-center text-[10px] font-bold text-muted-foreground">
													{typeof badge === "number" && badge > 99 ? "99+" : badge}
												</span>
											)}
										</Link>
									);
								})}
							</div>
						</div>
					))}
				</div>

				{/* Monitoring Active Footer Card */}
				<div className="border-t border-sidebar-border px-3 py-4">
					{!isCollapsed ? (
						<div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3.5 shadow-xs">
							<div className="flex items-center gap-2">
								<ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
								<span className="text-xs font-bold text-sidebar-foreground">
									Monitoring Active
								</span>
							</div>
							<p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
								Network risk signals actively monitored across hospital scope.
							</p>
						</div>
					) : (
						<div className="flex justify-center">
							<div
								title="Monitoring active"
								className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
							>
								<ShieldCheck className="h-4 w-4" />
							</div>
						</div>
					)}
				</div>
			</aside>
		</>
	);
}
