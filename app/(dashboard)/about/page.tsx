import Link from "next/link";
import {
  ExternalLink,
  HeartPulse,
  Server,
  ShieldCheck,
  Building2,
  Activity,
  Brain,
  Database,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { maishawatchData } from "@/lib/data";

export default function AboutPage() {
  const { facilities, equipment, alerts } = maishawatchData;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <HeartPulse className="h-3.5 w-3.5" />
              PLP Capstone Project
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              About MaishaWatch
            </h1>
            <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Medical equipment utilization, predictive maintenance, and risk-monitoring platform for Kenyan healthcare facilities across all 47 counties.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://maishawatch-frontend.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
            >
              <span>Live Frontend</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://github.com/E-Macharia/maishawatch-frontend"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
            >
              <span>Frontend GitHub</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://github.com/E-Macharia/maishawatch-backend"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
            >
              <span>Backend GitHub</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Deployment & Live Links Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Vercel Production Deployment</h2>
              <p className="text-xs text-muted-foreground">Frontend web dashboard</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Hosted on Vercel with automated CI/CD from the GitHub repository. Provides high performance, zero-config SSR, and edge optimizations.
          </p>
          <div className="pt-2">
            <a
              href="https://maishawatch-frontend.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
            >
              <span>https://maishawatch-frontend.vercel.app/</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Render Backend API</h2>
              <p className="text-xs text-muted-foreground">FastAPI predictive maintenance service</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Hosted on Render running FastAPI, Scikit-learn ML models for RUL and failure probability prediction, JWT authentication, and telemetry endpoints.
          </p>
          <div className="pt-2">
            <a
              href="https://maishawatch-backend.onrender.com/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>https://maishawatch-backend.onrender.com/docs</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Network Scope & Live Metrics */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground">Network Intelligence Scope</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-medium">Hospitals & Clinics</span>
            </div>
            <p className="mt-2 text-2xl font-black text-foreground">
              {facilities.length.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Across all 47 counties</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">Equipment Assets</span>
            </div>
            <p className="mt-2 text-2xl font-black text-foreground">{equipment.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Tracked in registry</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database className="h-4 w-4" />
              <span className="text-xs font-medium">Telemetry Records</span>
            </div>
            <p className="mt-2 text-2xl font-black text-foreground">324,000</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Aggregated to daily trends</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span className="text-xs font-medium">Active Alerts</span>
            </div>
            <p className="mt-2 text-2xl font-black text-foreground">{alerts.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Risk & discrepancy flags</p>
          </div>
        </div>
      </div>

      {/* Core Capabilities */}
      <div className="rounded-3xl border border-border bg-card p-8 space-y-6">
        <h2 className="text-base font-bold text-foreground">Core Architecture & Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Predictive Maintenance & RUL</p>
              <p className="text-xs text-muted-foreground">
                Machine learning models compute 24h, 72h, and 168h failure probabilities alongside degradation indices.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Dual Mode Connectivity</p>
              <p className="text-xs text-muted-foreground">
                Seamless operation with a live FastAPI backend or completely standalone with high-fidelity local snapshot datasets.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Utilization vs. Register Auditing</p>
              <p className="text-xs text-muted-foreground">
                Flag discrepancies between physical equipment counters and patient register logbooks to prevent revenue leakage and overuse.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Kenya National Health Scope</p>
              <p className="text-xs text-muted-foreground">
                Hospital KEPH service tier eligibility mappings for ICU ventilators, dialysis machines, MRI/CT scanners, and theatres.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
