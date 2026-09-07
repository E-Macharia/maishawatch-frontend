"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Search, ChevronRight, Command, X } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { maishawatchData } from "@/lib/data";
import { NotificationsPopover } from "./notifications-popover";
import { ThemeToggle } from "./theme-toggle";
import { AdminUserMenu } from "@/components/auth/admin-user-menu";

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleMobileSidebar } = useSidebar();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);

  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = useMemo(() => {
    return segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const label = seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return { href, label };
    });
  }, [segments]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const items = [
      ...maishawatchData.equipment.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: `${maishawatchData.facilities.find((f) => f.id === item.facilityId)?.name ?? "Unknown facility"} · ${item.serialNumber}`,
        href: `/equipment/${item.id}`,
        kind: "Equipment",
      })),
      ...maishawatchData.facilities.map((facility) => ({
        id: facility.id,
        title: facility.name,
        subtitle: `${facility.county} · Level ${facility.serviceLevel}`,
        href: `/facilities/${facility.id}`,
        kind: "Facility",
      })),
    ];
    return items.filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(term)).slice(0, 7);
  }, [q]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const submit = (value = q) => {
    const term = value.trim();
    if (!term) {
      router.push("/equipment");
      setMobileSearchOpen(false);
      return;
    }
    const first = results[0];
    if (first) {
      router.push(first.href);
      setFocused(false);
      setMobileSearchOpen(false);
      return;
    }
    router.push(`/equipment?query=${encodeURIComponent(term)}`);
    setFocused(false);
    setMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Dynamic Breadcrumb Navigation */}
        <div className="hidden items-center gap-2 text-[13px] text-muted-foreground sm:flex">
          <Link href="/overview" className="hover:text-foreground transition-colors">
            Workspace
          </Link>
          {breadcrumbs.map((b, idx) => (
            <span key={b.href} className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-foreground">{b.label}</span>
              ) : (
                <Link href={b.href} className="hover:text-foreground transition-colors">
                  {b.label}
                </Link>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop Global Search Bar */}
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="global-search"
            aria-label="Global search"
            value={q}
            onFocus={() => setFocused(true)}
            onChange={(e) => {
              setQ(e.target.value);
              setFocused(true);
            }}
            placeholder="Search equipment, facilities..."
            className="h-9 w-[300px] rounded-lg border border-border bg-card pl-9 pr-12 text-[13px] text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </span>

          {/* Search Dropdown Results */}
          {focused && q.trim() && (
            <div className="absolute left-0 right-0 top-11 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50">
              {results.length > 0 ? (
                results.map((result) => (
                  <button
                    key={`${result.kind}-${result.id}`}
                    type="button"
                    onClick={() => {
                      router.push(result.href);
                      setFocused(false);
                    }}
                    className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left hover:bg-accent transition-colors"
                  >
                    <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {result.kind}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-foreground">{result.title}</span>
                      <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{result.subtitle}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-[13px] text-muted-foreground">No matching equipment or facilities found.</div>
              )}
            </div>
          )}
        </form>

        {/* Mobile Search Icon Button */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Mobile Search Modal Drawer */}
        {mobileSearchOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-4 flex flex-col md:hidden animate-in fade-in">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search equipment, facilities..."
                  className="w-full h-10 rounded-xl border border-border bg-card pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {results.map((result) => (
                <button
                  key={`m-${result.kind}-${result.id}`}
                  onClick={() => {
                    router.push(result.href);
                    setMobileSearchOpen(false);
                  }}
                  className="flex w-full items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent text-left"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{result.kind}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">{result.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{result.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <AdminUserMenu />
        <ThemeToggle />
        <NotificationsPopover />

        {/* Network Facility Count Indicator */}
        <div className="hidden items-center gap-2.5 border-l border-border pl-3 sm:flex">
          <div className="text-right">
            <p className="text-[13px] font-semibold text-foreground">Kenya network</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {maishawatchData.facilities.length} facilities
            </p>
          </div>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      </div>
    </header>
  );
}
