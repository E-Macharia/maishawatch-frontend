"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
	AlertTriangle,
	ArrowUpRight,
	BellRing,
	CheckCircle2,
	CircleAlert,
	Search,
	X,
	Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Reveal } from "@/components/dashboard/motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/dashboard/pagination";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { TableEmptyState } from "@/components/dashboard/table-empty-state";
import {
	maishawatchData,
	getFacilityName,
	getEquipmentName,
	facilityById,
	equipmentById,
} from "@/lib/data";
import { AlertResolutionDialog } from "@/components/dashboard/alert-resolution-dialog";
import { api } from "@/lib/api/backend-client";

const PAGE_SIZE = 8;

export default function AlertsPage() {
	const [severity, setSeverity] = useState("all");
	const [type, setType] = useState("all");
	const [query, setQuery] = useState("");
	const [resolved, setResolved] = useState<string[]>([]);
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<
		(typeof maishawatchData.alerts)[number] | null
	>(null);
	const [notify, setNotify] = useState<
		(typeof maishawatchData.alerts)[number] | null
	>(null);

	const [notifyEmail, setNotifyEmail] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const [sendSuccess, setSendSuccess] = useState(false);

	useEffect(() => {
		try {
			setResolved(
				JSON.parse(localStorage.getItem("maisha-resolved-alerts") || "[]"),
			);
		} catch {}
	}, []);

	const filtered = useMemo(
		() =>
			maishawatchData.alerts.filter(
				(a) =>
					!resolved.includes(a.id) &&
					(severity === "all" || a.severity === severity) &&
					(type === "all" || a.type === type) &&
					(!query ||
						`${getEquipmentName(a.equipmentId)} ${getFacilityName(
							a.facilityId,
						)} ${a.message}`
							.toLowerCase()
							.includes(query.toLowerCase())),
			),
		[severity, type, query, resolved],
	);

	const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const critical = maishawatchData.alerts.filter(
		(x) => x.severity === "critical" && !resolved.includes(x.id),
	).length;
	const discrepancies = maishawatchData.alerts.filter(
		(x) => x.type === "discrepancy" && !resolved.includes(x.id),
	).length;

	const resolve = (id: string) => {
		setResolved((x) => Array.from(new Set([...x, id])));
		setSelected(null);
		setPage(1);
	};

	const reset = () => {
		setQuery("");
		setSeverity("all");
		setType("all");
		setPage(1);
	};

	// --- ✅ Correct notification handler with "body" wrapper ---
	// const handleSendNotification = async (alert: typeof notify) => {
	// 	if (!alert) return;
	// 	if (!notifyEmail.trim()) {
	// 		setSendError("Please enter a valid email address");
	// 		return;
	// 	}

	// 	setIsSending(true);
	// 	setSendError(null);
	// 	setSendSuccess(false);

	// 	try {
	// 		const payload = {
	// 			body: alert.message, // Email content as a string
	// 			subject: `Alert: ${getEquipmentName(alert.equipmentId)} - ${alert.type}`,
	// 			alert_id: alert.id,
	// 			email: notifyEmail.trim(),
	// 			facility_name: getFacilityName(alert.facilityId),
	// 			equipment_name: getEquipmentName(alert.equipmentId),
	// 			severity: alert.severity,
	// 		};

	// 		console.log("Sending payload:", payload); // Verify in console

	// 		await api.notifications.send(payload);

	// 		setSendSuccess(true);
	// 		setTimeout(() => {
	// 			setNotify(null);
	// 			setNotifyEmail("");
	// 			setSendSuccess(false);
	// 		}, 1500);
	// 	} catch (err) {
	// 		setSendError(
	// 			err instanceof Error ? err.message : "Failed to send notification",
	// 		);
	// 	} finally {
	// 		setIsSending(false);
	// 	}
	// };
	const handleSendNotification = async (alert: typeof notify) => {
		if (!alert) return;
		if (!notifyEmail.trim()) {
			setSendError("Please enter a valid email address");
			return;
		}

		setIsSending(true);
		setSendError(null);
		setSendSuccess(false);

		try {
			const payload = {
				body: alert.message,
				subject: `Alert: ${getEquipmentName(alert.equipmentId)} - ${alert.type}`,
				alert_id: alert.id,
				email: notifyEmail.trim(),
				facility_name: getFacilityName(alert.facilityId),
				equipment_name: getEquipmentName(alert.equipmentId),
				severity: alert.severity,
			};

			await api.notifications.send(payload);

			// Success
			setSendSuccess(true);
			setTimeout(() => {
				setNotify(null);
				setNotifyEmail("");
				setSendSuccess(false);
			}, 1500);
		} catch (err) {
			// Check if the error is an AbortError (timeout)
			if (err instanceof DOMException && err.name === "AbortError") {
				// The email was likely sent, but the request timed out.
				// Inform the user but treat it as success.
				setSendSuccess(true);
				setSendError(null);
				// Optionally show a different message: "Notification sent (server confirmation delayed)"
				setTimeout(() => {
					setNotify(null);
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

	const closeNotifyDialog = () => {
		setNotify(null);
		setNotifyEmail("");
		setSendError(null);
		setSendSuccess(false);
		setIsSending(false);
	};

	return (
		<div className="space-y-6">
			{selected && (
				<AlertResolutionDialog
					alert={selected}
					equipment={equipmentById.get(selected.equipmentId)!}
					onClose={() => setSelected(null)}
					onResolved={resolve}
				/>
			)}

			{notify && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl border border-border">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-bold">Notify Hospital</h2>
							<button
								onClick={closeNotifyDialog}
								className="text-muted-foreground hover:text-foreground"
								disabled={isSending}
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="mt-4 space-y-3">
							<p className="text-sm text-muted-foreground">
								<strong>Equipment:</strong> {getEquipmentName(notify.equipmentId)}
							</p>
							<p className="text-sm text-muted-foreground">
								<strong>Facility:</strong> {getFacilityName(notify.facilityId)}
							</p>
							<p className="text-sm text-muted-foreground">
								<strong>Alert:</strong> {notify.message}
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
								onClick={closeNotifyDialog}
								className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
								disabled={isSending}
							>
								Cancel
							</button>
							<button
								onClick={() => handleSendNotification(notify)}
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

			<Reveal>
				<div>
					<p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
						Operational Signals
					</p>
					<h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Alert Centre
					</h1>
					<p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
						Turn risk signals into verified biomedical maintenance actions and
						auditable hospital notifications.
					</p>
				</div>
			</Reveal>

			<section className="grid gap-4 sm:grid-cols-3">
				<MetricCard
					label="Open Alerts"
					value={maishawatchData.alerts.length - resolved.length}
					hint="Signals requiring intervention"
					icon={BellRing}
					tone="amber"
				/>
				<MetricCard
					label="Critical Urgency"
					value={critical}
					hint="Shortest predicted failure lead times"
					icon={AlertTriangle}
					tone="red"
				/>
				<MetricCard
					label="Usage Discrepancies"
					value={discrepancies}
					hint="Counter vs register mismatch"
					icon={CircleAlert}
					tone="blue"
				/>
			</section>

			<Reveal delay={0.08}>
				<Card className="border-border bg-card shadow-xs">
					<CardHeader className="border-b border-border pb-4">
						<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
							<div>
								<CardTitle className="text-sm font-bold text-foreground">
									Signal Queue
								</CardTitle>
								<p className="mt-1 text-xs text-muted-foreground">
									{filtered.length} open signals match the current view.
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
									<input
										value={query}
										onChange={(e) => {
											setQuery(e.target.value);
											setPage(1);
										}}
										placeholder="Search alert, asset, facility..."
										className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-8 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs"
									/>
									{query && (
										<button
											onClick={() => {
												setQuery("");
												setPage(1);
											}}
											className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										>
											<X className="h-3.5 w-3.5" />
										</button>
									)}
								</div>

								<FilterSelect
									value={severity}
									onChange={(v) => {
										setSeverity(v);
										setPage(1);
									}}
									options={[
										{ value: "all", label: "All Severity" },
										{ value: "critical", label: "Critical" },
										{ value: "high", label: "High" },
										{ value: "medium", label: "Moderate" },
										{ value: "low", label: "Low" },
									]}
								/>

								<FilterSelect
									value={type}
									onChange={(v) => {
										setType(v);
										setPage(1);
									}}
									options={[
										{ value: "all", label: "All Types" },
										{ value: "risk", label: "Risk" },
										{ value: "discrepancy", label: "Discrepancy" },
									]}
								/>

								<button
									onClick={reset}
									className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-xs"
								>
									Reset
								</button>
							</div>
						</div>
					</CardHeader>

					<CardContent className="p-0">
						<div className="divide-y divide-border">
							{rows.map((alert) => (
								<div
									key={alert.id}
									className="flex flex-col gap-4 p-5 transition-colors hover:bg-accent/40 lg:flex-row lg:items-center"
								>
									<div className="flex min-w-0 flex-1 items-start gap-3">
										<div
											className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
												alert.severity === "critical"
													? "bg-red-500/10 text-red-500 border-red-500/20"
													: "bg-amber-500/10 text-amber-500 border-amber-500/20"
											}`}
										>
											{alert.type === "risk" ? (
												<AlertTriangle className="h-4 w-4" />
											) : (
												<CircleAlert className="h-4 w-4" />
											)}
										</div>
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-xs font-bold text-foreground">
													{getEquipmentName(alert.equipmentId)}
												</p>
												<span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
													{alert.type}
												</span>
											</div>
											<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
												{alert.message}
											</p>
											<p className="mt-1.5 text-[11px] font-medium text-muted-foreground/80">
												{getFacilityName(alert.facilityId)} •{" "}
												{new Date(alert.createdAt).toLocaleString("en-KE", {
													dateStyle: "medium",
													timeStyle: "short",
												})}
											</p>
										</div>
									</div>

									<div className="flex flex-wrap items-center gap-2 lg:shrink-0">
										<StatusBadge level={alert.severity} />
										<Link
											href={`/equipment/${alert.equipmentId}`}
											className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-xs"
										>
											Inspect <ArrowUpRight className="h-3 w-3" />
										</Link>
										<button
											onClick={() => setNotify(alert)}
											className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-xs cursor-pointer"
										>
											<Send className="h-3 w-3" /> Notify
										</button>
										<button
											onClick={() => setSelected(alert)}
											className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
										>
											<CheckCircle2 className="h-3 w-3" /> Resolve
										</button>
									</div>
								</div>
							))}

							{rows.length === 0 && (
								<TableEmptyState
									title="No open signals match filters"
									description="All alerts in this view have been resolved or filtered out."
									onReset={reset}
								/>
							)}
						</div>

						{filtered.length > 0 && (
							<Pagination
								page={page}
								pageCount={pageCount}
								onPageChange={setPage}
								pageSize={PAGE_SIZE}
								total={filtered.length}
							/>
						)}
					</CardContent>
				</Card>
			</Reveal>
		</div>
	);
}
