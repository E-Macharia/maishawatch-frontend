"use client";

import { useState } from "react";
import {
	Activity,
	AlertTriangle,
	Brain,
	CheckCircle2,
	Clock,
	Loader2,
	ShieldAlert,
	Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Equipment, RiskLevel } from "@/types/maishawatch";
import {
	getPredictionView,
	getRecommendationFromPrediction,
} from "@/lib/data/prediction-helpers";
import { api } from "@/lib/api/backend-client";

type Props = {
	equipment: Equipment;
	facilityId?: string;
	enableSimulation?: boolean;
};

function pct(v: number) {
	return `${Math.round(v * 100)}%`;
}

function barColor(p: number) {
	if (p >= 0.8) return "bg-red-500";
	if (p >= 0.6) return "bg-orange-500";
	if (p >= 0.3) return "bg-amber-400";
	return "bg-emerald-500";
}

function HorizonBar({
	label,
	probability,
}: {
	label: string;
	probability: number;
}) {
	const width = Math.min(100, Math.max(2, Math.round(probability * 100)));
	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between text-xs">
				<span className="font-medium text-muted-foreground">{label}</span>
				<span className="font-mono font-bold text-foreground">
					{pct(probability)}
				</span>
			</div>
			<div className="h-2.5 overflow-hidden rounded-full bg-muted">
				<div
					className={`h-full rounded-full transition-all ${barColor(probability)}`}
					style={{ width: `${width}%` }}
				/>
			</div>
		</div>
	);
}

export function PredictionPanel({
	equipment,
	facilityId,
	enableSimulation = true,
}: Props) {
	const view = getPredictionView(equipment);
	const recommendation = getRecommendationFromPrediction(view);
	const [busy, setBusy] = useState(false);
	const [result, setResult] = useState<{
		ok: boolean;
		message: string;
		data?: {
			failure_probability?: number;
			severity?: string;
			recommendation?: string;
			status?: string;
			horizon?: string;
		};
	} | null>(null);

	async function handleRunSimulation() {
		setBusy(true);
		setResult(null);
		try {
			const payload = {
				equipment_id: equipment.id,
				facility_id: facilityId ?? equipment.facilityId,
				// horizon: "all",  // optional, add if backend requires
			};

			console.log("Sending payload:", payload);

			const data = await api.predictions.failureAll(payload);

			const prob = data.failure_probability ?? 0;
			const severity = data.severity ?? "unknown";
			const horizon = data.horizon ?? "N/A";
			const rec = data.recommendation ?? "No recommendation";
			const status = data.status ?? "unknown";

			const message =
				`Failure probability: ${pct(prob)} over ${horizon}. ` +
				`Severity: ${severity}. Status: ${status}. ` +
				`Recommendation: ${rec}`;

			setResult({
				ok: true,
				message,
				data: {
					failure_probability: prob,
					severity,
					recommendation: rec,
					status,
					horizon,
				},
			});
		} catch (err) {
			console.error("Prediction error:", err);

			// Handle timeout (AbortError) gracefully
			if (err instanceof DOMException && err.name === "AbortError") {
				setResult({
					ok: false,
					message:
						"⏱️ The prediction request timed out. The server may still be processing your request. Please check the results later or try again.",
				});
			} else {
				const errorMsg =
					err instanceof Error ? err.message : "Could not reach prediction service.";
				setResult({
					ok: false,
					message: `❌ ${errorMsg}`,
				});
			}
		} finally {
			setBusy(false);
		}
	}

	const isCritical = view.level === "critical" || view.level === "high";

	return (
		<Card className="border-border bg-card shadow-xs">
			<CardHeader className="border-b border-border pb-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<div className="flex items-center gap-2">
							<Brain className="h-4 w-4 text-primary" />
							<CardTitle className="text-sm font-bold text-foreground">
								AI Failure Prediction
							</CardTitle>
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							Model forecasts failure risk before breakdown — with telemetry fallback
							when models are offline.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge level={view.level as RiskLevel} />
						<span
							className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
								view.source === "model"
									? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
									: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
							}`}
						>
							{view.source === "model" ? (
								<>
									<Sparkles className="h-3 w-3" /> Model
								</>
							) : (
								<>
									<Activity className="h-3 w-3" /> Telemetry fallback
								</>
							)}
						</span>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-5 p-6">
				{/* Horizon probabilities */}
				<div className="space-y-3">
					<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
						Predicted failure probability
					</p>
					<HorizonBar label="Next 24 hours" probability={view.p24} />
					<HorizonBar label="Next 72 hours" probability={view.p72} />
					<HorizonBar label="Next 7 days (168h)" probability={view.p168} />
				</div>

				{/* RUL */}
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="rounded-xl border border-border bg-muted/40 p-3.5">
						<div className="flex items-center gap-2">
							<Clock className="h-3.5 w-3.5 text-muted-foreground" />
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Remaining useful life
							</p>
						</div>
						<p className="mt-2 text-2xl font-extrabold font-mono text-foreground">
							{view.rulHours}
							<span className="ml-1 text-xs font-normal text-muted-foreground">
								hours
							</span>
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							≈ {view.rulDays} days · source: {view.source}
						</p>
					</div>
					<div className="rounded-xl border border-border bg-muted/40 p-3.5">
						<div className="flex items-center gap-2">
							<ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Max horizon risk
							</p>
						</div>
						<p className="mt-2 text-2xl font-extrabold font-mono text-foreground">
							{pct(view.maxProb)}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Highest of 24h / 72h / 168h windows
						</p>
					</div>
				</div>

				{/* Recommendation */}
				<div
					className={`rounded-xl border p-4 ${
						isCritical
							? "border-red-500/20 bg-red-500/10"
							: "border-primary/20 bg-primary/5"
					}`}
				>
					<div className="flex gap-3">
						<AlertTriangle
							className={`mt-0.5 h-4 w-4 shrink-0 ${
								isCritical ? "text-red-500" : "text-primary"
							}`}
						/>
						<div>
							<p className="text-xs font-bold text-foreground">Recommended action</p>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								{recommendation}
							</p>
						</div>
					</div>
				</div>

				{/* Simulation Button */}
				{enableSimulation && (
					<div className="space-y-2">
						<button
							type="button"
							disabled={busy}
							onClick={handleRunSimulation}
							className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
						>
							{busy ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Brain className="h-3.5 w-3.5" />
							)}
							{busy ? "Running simulation…" : "Run Failure Simulation"}
						</button>
						<p className="text-[11px] text-muted-foreground">
							Calls the backend ML evaluation and returns the latest risk assessment.
						</p>
						{result && (
							<div
								className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
									result.ok
										? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
										: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
								}`}
							>
								{result.ok ? (
									<CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
								) : (
									<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
								)}
								<span>{result.message}</span>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
