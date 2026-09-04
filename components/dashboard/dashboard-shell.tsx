"use client";
import React from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { defaultNavGroups } from "@/lib/config/navigation";
import { DashboardShellProps } from "@/types/navigation";
import { cn } from "@/lib/utils";
function ShellContent({ children, navGroups = defaultNavGroups, user }: DashboardShellProps) { const { isCollapsed } = useSidebar(); return <div className="min-h-screen bg-background text-foreground antialiased"><Sidebar navGroups={navGroups} user={user}/><div className={cn("min-h-screen transition-all duration-300", isCollapsed?"lg:pl-[76px]":"lg:pl-[248px]")}><Topbar/><main className="mx-auto w-full max-w-[1600px] px-4 pb-8 pt-5 sm:px-6 lg:px-8">{children}</main></div></div>; }
export default function DashboardShell(props: DashboardShellProps) { return <SidebarProvider><ShellContent {...props}/></SidebarProvider>; }
