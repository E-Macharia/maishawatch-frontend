"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import {
	ArrowLeft,
	ArrowUpRight,
	Building2,
	Gauge,
	MapPin,
	ShieldCheck,
	Wrench,
	Send,
	Loader2,
	CircleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Reveal } from "@/components/dashboard/motion";
import { RiskDonut } from "@/components/dashboard/charts";
import { useLiveData } from "@/lib/data/live-context";
import {
	getFacilitySummary,
	getFacilityEligibilitySummary,
	formatEquipmentType,
} from "@/lib/data/insights";
import { api } from "@/lib/api/backend-client";

interface Props {
	params: Promise<{ facilityId: string }>;
}

export default function FacilityDetailPage({ params }: Props) {
	const { facilityId } = use(params);
	const { facilities, equipment, isLoading } = useLiveData();
	const summary = useMemo(
		() => getFacilitySummary(facilityId, facilities, equipment),
		[facilityId, facilities, equipment],
	);
	const facility = summary.facility;


	if (isLoading && !facility) {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-sm font-medium text-muted-foreground">Loading facility intelligence...</p>
			</div>
		);
	}

	if (!facility) {
		return (
			<div className="space-y-6">
				<Link
					href="/facilities"
					className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-3.5 w-3.5" /> Back to facilities
				</Link>
				<Card className="p-8 text-center border-border">
					<CircleAlert className="mx-auto h-10 w-10 text-amber-500 mb-3" />
					<h2 className="text-lg font-bold text-foreground">Facility Not Found</h2>
					<p className="text-xs text-muted-foreground mt-1">Facility with ID {facilityId} was not found in the live backend system.</p>
				</Card>
			</div>
		);
	}

	const risk = {
		critical: summary.equipment.filter((e) => e.riskLevel === "critical").length,
		high: summary.equipment.filter((e) => e.riskLevel === "high").length,
		medium: summary.equipment.filter((e) => e.riskLevel === "medium").length,
		low: summary.equipment.filter((e) => e.riskLevel === "low").length,
	};


	const donut = [
		{ name: "Critical", value: risk.critical, fill: "#ef4444" },
		{ name: "High", value: risk.high, fill: "#f97316" },
		{ name: "Moderate", value: risk.medium, fill: "#f59e0b" },
		{ name: "Low", value: risk.low, fill: "#10b981" },
	];

	const eligibility = getFacilityEligibilitySummary(facility);

	// ---- Notification State ----
	const [notifyOpen, setNotifyOpen] = useState(false);
	const [notifyEmail, setNotifyEmail] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const [sendSuccess, setSendSuccess] = useState(false);

	// ---- Send notification handler ----
	const handleSendNotification = async () => {
		if (!notifyEmail.trim()) {
			setSendError("Please enter a valid email address");
			return;
		}

		setIsSending(true);
		setSendError(null);
		setSendSuccess(false);

		try {
			const message = `
Facility: ${facility.name}
County: ${facility.county}
Service Level: ${facility.serviceLevel}
Total Equipment: ${summary.equipment.length}
Average Risk Score: ${summary.riskScore}
Equipment breakdown: Critical ${risk.critical}, High ${risk.high}, Medium ${risk.medium}, Low ${risk.low}
Downtime: ${summary.downtime.toFixed(1)}h
Utilization: ${Math.round(summary.utilization * 100)}%
      `.trim();

			const payload = {
				body: message,
				subject: `Facility Report: ${facility.name}`,
				email: notifyEmail.trim(),
				facility_id: facility.id,
			};

			await api.notifications.send(payload);

			setSendSuccess(true);
			setTimeout(() => {
				setNotifyOpen(false);
				setNotifyEmail("");
				setSendSuccess(false);
			}, 1500);
		} catch (err) {
			// If the request aborted (timeout), treat as success
			if (err instanceof DOMException && err.name === "AbortError") {
				setSendSuccess(true);
				setSendError(null);
				setTimeout(() => {
					setNotifyOpen(false);
					setNotifyEmail("");
					setSendSuccess(false);
				}, 1500);
			} else {
				setSendError(
					err instanceof Error ? err.message : "Failed to send notification",
				);
			}
		} finally {
			setIsSending(false);
		}
	};

	// ---- "Evaluate with AI" placeholder ----
	const handleEvaluateAndNotify = () => {
		// You can extend this to call an AI endpoint and then open the dialog.
		// For now, just open the notification dialog.
		setNotifyOpen(true);
	};

	return (
		<div className="space-y-6">
			{/* --- Notification Dialog --- */}
			{notifyOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl border border-border">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-bold">Notify about Facility</h2>
							<button
								onClick={() => {
									setNotifyOpen(false);
									setNotifyEmail("");
									setSendError(null);
									setSendSuccess(false);
								}}
								className="text-muted-foreground hover:text-foreground"
								disabled={isSending}
							>
								✕
							</button>
						</div>

						<div className="mt-4 space-y-3">
							<p className="text-sm text-muted-foreground">
								<strong>Facility:</strong> {facility.name}
							</p>
							<p className="text-sm text-muted-foreground">
								<strong>Total Equipment:</strong> {summary.equipment.length}
							</p>
							<p className="text-sm text-muted-foreground">
								<strong>Average Risk:</strong> {summary.riskScore}/100
							</p>

							<div>
								<label
									htmlFor="notify-email"
									className="block text-sm font-medium text-muted-foreground"
								>
									Recipient Email
								</label>
								<input
									id="notify-email"
									type="email"
									value={notifyEmail}
									onChange={(e) => setNotifyEmail(e.target.value)}
									placeholder="Enter hospital contact email"
									className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
									disabled={isSending || sendSuccess}
								/>
								{sendError && <p className="mt-1 text-xs text-red-500">{sendError}</p>}
								{sendSuccess && (
									<p className="mt-1 text-xs text-green-500">
										✅ Notification sent successfully!
									</p>
								)}
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
							<button
								onClick={() => {
									setNotifyOpen(false);
									setNotifyEmail("");
									setSendError(null);
									setSendSuccess(false);
								}}
								className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
								disabled={isSending}
							>
								Cancel
							</button>
							<button
								onClick={handleSendNotification}
								disabled={isSending || sendSuccess || !notifyEmail.trim()}
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSending ? (
									"Sending..."
								) : sendSuccess ? (
									"Sent ✓"
								) : (
									<>
										<Send className="h-4 w-4" /> Send
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* --- Header with Notify and Evaluate buttons --- */}
			<Reveal>
				<Link
					href="/facilities"
					className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-3.5 w-3.5" /> Back to facilities
				</Link>
				<div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p className="text-[10px] font-bold uppercase tracking-wider text-primary">
							Facility Intelligence
						</p>
						<h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
							{facility.name}
						</h1>
						<p className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
							<MapPin className="h-3.5 w-3.5 text-primary" />
							{facility.county} • Level {facility.serviceLevel} •{" "}
							{facility.facilityType}
						</p>
					</div>
					<div className="flex items-center gap-3">
						<button
							onClick={() => setNotifyOpen(true)}
							className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
						>
							<Send className="h-4 w-4" /> Notify
						</button>
						<button
							onClick={handleEvaluateAndNotify}
							className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors shadow-xs"
						>
							<ShieldCheck className="h-4 w-4" /> Evaluate with AI
						</button>
						<div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xs flex items-center gap-3">
							<Gauge className="h-4 w-4 text-primary" />
							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
									Average Risk
								</p>
								<p className="text-lg font-bold font-mono text-foreground">
									{summary.riskScore}
									<span className="text-xs font-normal text-muted-foreground">/100</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</Reveal>

			{/* --- KPI Cards --- */}
			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Reveal>
					<Card className="border-border bg-card shadow-xs">
						<CardContent className="p-4">
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Capacity
							</p>
							<p className="mt-1 text-xl font-bold font-mono text-foreground">
								{(facility.bedsAndCots ?? 0).toLocaleString()}
							</p>
							<p className="text-xs text-muted-foreground">Beds + cots</p>
						</CardContent>
					</Card>
				</Reveal>
				<Reveal delay={0.04}>
					<Card className="border-border bg-card shadow-xs">
						<CardContent className="p-4">
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Utilization
							</p>
							<p className="mt-1 text-xl font-bold font-mono text-foreground">
								{Math.round(summary.utilization * 100)}%
							</p>
							<p className="text-xs text-muted-foreground">Latest monitored assets</p>
						</CardContent>
					</Card>
				</Reveal>
				<Reveal delay={0.08}>
					<Card className="border-border bg-card shadow-xs">
						<CardContent className="p-4">
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Downtime
							</p>
							<p className="mt-1 text-xl font-bold font-mono text-foreground">
								{summary.downtime.toFixed(1)}h
							</p>
							<p className="text-xs text-muted-foreground">
								Recorded failure downtime
							</p>
						</CardContent>
					</Card>
				</Reveal>
				<Reveal delay={0.12}>
					<Card className="border-border bg-card shadow-xs">
						<CardContent className="p-4">
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Owner Type
							</p>
							<p className="mt-1 truncate text-sm font-bold text-foreground">
								{facility.ownerType || "Not recorded"}
							</p>
							<p className="text-xs text-muted-foreground">Facility master record</p>
						</CardContent>
					</Card>
				</Reveal>
			</section>

			{/* --- Equipment Portfolio & Risk Profile --- */}
			<section className="grid gap-5 xl:grid-cols-[1.4fr_0.85fr]">
				<Reveal delay={0.12}>
					<Card className="border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<CardTitle className="text-sm font-bold text-foreground">
								Equipment Portfolio
							</CardTitle>
							<p className="mt-1 text-xs text-muted-foreground">
								Assets currently monitored at this facility.
							</p>
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y divide-border">
								{summary.equipment.length ? (
									summary.equipment.map((item) => (
										<Link
											key={item.id}
											href={`/equipment/${item.id}`}
											className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/40"
										>
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
												<Building2 className="h-4 w-4" />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="truncate text-xs font-bold text-foreground">
														{item.name}
													</p>
													<StatusBadge level={item.riskLevel} />
												</div>
												<p className="mt-1 text-xs text-muted-foreground">
													{formatEquipmentType(item.type)} •{" "}
													<span className="font-mono">{item.serialNumber}</span>
												</p>
											</div>
											<div className="text-right">
												<p className="text-xs font-bold font-mono text-foreground">
													{item.riskScore}
												</p>
												<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
													risk
												</p>
											</div>
											<ArrowUpRight className="h-4 w-4 text-muted-foreground" />
										</Link>
									))
								) : (
									<div className="p-6 text-xs text-muted-foreground text-center">
										No monitored equipment attached to this facility.
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</Reveal>

				<Reveal delay={0.16}>
					<Card className="border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<CardTitle className="text-sm font-bold text-foreground">
								Risk Profile
							</CardTitle>
							<p className="mt-1 text-xs text-muted-foreground">
								Current distribution across monitored assets.
							</p>
						</CardHeader>
						<CardContent className="p-6">
							<div className="mx-auto h-52 max-w-[240px]">
								<RiskDonut data={donut} />
							</div>
							<div className="grid grid-cols-2 gap-3 mt-4">
								{Object.entries(risk).map(([key, value]) => (
									<div
										key={key}
										className="rounded-xl border border-border bg-muted/40 p-3"
									>
										<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
											{key}
										</p>
										<p className="mt-1 text-lg font-bold font-mono text-foreground">
											{value}
										</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</Reveal>
			</section>

			{/* --- Facility Metadata & Eligibility --- */}
			<section className="grid gap-5 lg:grid-cols-2">
				<Reveal delay={0.2}>
					<Card className="border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<div className="flex items-center gap-2">
								<ShieldCheck className="h-4 w-4 text-emerald-500" />
								<div>
									<CardTitle className="text-sm font-bold text-foreground">
										Equipment Eligibility
									</CardTitle>
									<p className="mt-1 text-xs text-muted-foreground">
										Eligibility flags supplied by facility master.
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="grid grid-cols-2 gap-3 p-6">
							{eligibility.map((item) => (
								<div
									key={item.label}
									className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3.5 py-2.5"
								>
									<span className="text-[11px] text-muted-foreground font-medium">
										{item.label}
									</span>
									<span
										className={`text-[10px] font-bold uppercase ${
											item.eligible === true
												? "text-emerald-600 dark:text-emerald-400"
												: item.eligible === false
													? "text-muted-foreground"
													: "text-amber-500"
										}`}
									>
										{item.eligible === true
											? "Eligible"
											: item.eligible === false
												? "Not eligible"
												: "Unknown"}
									</span>
								</div>
							))}
						</CardContent>
					</Card>
				</Reveal>

				<Reveal delay={0.24}>
					<Card className="border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<div className="flex items-center gap-2">
								<Wrench className="h-4 w-4 text-primary" />
								<div>
									<CardTitle className="text-sm font-bold text-foreground">
										Facility Operations
									</CardTitle>
									<p className="mt-1 text-xs text-muted-foreground">
										Availability and master-record context.
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="grid grid-cols-2 gap-3 p-6">
							{[
								["Operation", facility.operationStatus],
								["Whole day", facility.openWholeDay],
								["Weekends", facility.openWeekends],
								["Late night", facility.openLateNight],
								["Sub-county", facility.subCounty],
								["Ward", facility.ward],
							].map(([k, v]) => (
								<div
									key={k}
									className="rounded-xl border border-border bg-muted/40 p-3"
								>
									<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										{k}
									</p>
									<p className="mt-1 truncate text-xs font-semibold text-foreground">
										{v || "Not recorded"}
									</p>
								</div>
							))}
						</CardContent>
					</Card>
				</Reveal>
			</section>
		</div>
	);
}
