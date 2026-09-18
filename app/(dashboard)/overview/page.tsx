import Link from "next/link";
import {
	Activity,
	AlertTriangle,
	ArrowRight,
	Building2,
	Gauge,
	ShieldAlert,
	Sparkles,
	Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Reveal } from "@/components/dashboard/motion";
import {
	ComparisonTrendChart,
	RiskBars,
	RiskDonut,
} from "@/components/dashboard/charts";
import { maishawatchData, getFacilityName } from "@/lib/data";
import { getFacilityRiskRanking, getOverviewMetrics } from "@/lib/data/metrics";
import {
	getOverviewChartData,
	getPriorityEquipment,
	getRiskPortfolio,
	getTypeBreakdown,
	formatEquipmentType,
} from "@/lib/data/insights";

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning, team.";
	if (hour < 18) return "Good afternoon, team.";
	return "Good evening, team.";
}

export default function OverviewPage() {
	const metrics = getOverviewMetrics();
	const priorities = getPriorityEquipment();
	const facilityRanking = getFacilityRiskRanking().slice(0, 5);
	const riskPortfolio = getRiskPortfolio();
	const trend = getOverviewChartData();
	const typeBreakdown = getTypeBreakdown();
	const activeAlerts = maishawatchData.alerts
		.filter((a) => a.severity === "critical" || a.severity === "high")
		.slice(0, 5);
	const averageRisk = Math.round(
		maishawatchData.equipment.reduce((sum, item) => sum + item.riskScore, 0) /
			maishawatchData.equipment.length,
	);
	const maintenanceOverdue = maishawatchData.equipment.filter(
		(item) => item.scenarioPattern === "maintenance-neglect",
	).length;
	const greeting = getGreeting();

	return (
		<div className="space-y-6">
			{/* Hero Command Banner */}
			<Reveal>
				<section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
					<div className="absolute inset-0 grid-fade opacity-20 pointer-events-none" />
					<div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
					<div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="max-w-2xl">
							<div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
								<Sparkles className="h-3.5 w-3.5" /> Biomedical Command Centre
							</div>
							<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
								{greeting}
							</h1>
							<p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
								Here&apos;s the operational posture across the monitored Kenyan hospital
								network. Focus first on assets with the shortest predicted failure
								window.
							</p>
						</div>
						<div className="grid grid-cols-2 gap-3 sm:flex">
							<div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
									Avg Risk
								</p>
								<p className="mt-1 text-xl font-extrabold text-foreground tabular-nums">
									{averageRisk}
									<span className="text-xs font-normal text-muted-foreground">
										{" "}
										/ 100
									</span>
								</p>
							</div>
							<div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
									Overdue
								</p>
								<p className="mt-1 text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
									{maintenanceOverdue}
									<span className="text-xs font-normal text-muted-foreground">
										{" "}
										assets
									</span>
								</p>
							</div>
						</div>
					</div>
				</section>
			</Reveal>

			{/* Primary KPI Grid */}
			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Reveal delay={0.04}>
					<MetricCard
						label="Equipment Monitored"
						value={metrics.equipmentCount}
						hint={`${metrics.facilityCount} facilities in scope`}
						icon={Activity}
						tone="blue"
						trend="Network coverage stable"
					/>
				</Reveal>
				<Reveal delay={0.08}>
					<MetricCard
						label="Critical Assets"
						value={metrics.criticalCount}
						hint="Shortest failure windows"
						icon={ShieldAlert}
						tone="red"
						trend="Priority Review Required"
					/>
				</Reveal>
				<Reveal delay={0.12}>
					<MetricCard
						label="Open Alerts"
						value={metrics.activeAlertCount}
						hint={`${metrics.discrepancyCount} with discrepancy flags`}
						icon={AlertTriangle}
						tone="amber"
						trend="Monitoring Active"
					/>
				</Reveal>
				<Reveal delay={0.16}>
					<MetricCard
						label="Facilities At Risk"
						value={facilityRanking.filter((f) => f.averageRisk >= 60).length}
						hint="Average risk score ≥ 60"
						icon={Building2}
						tone="emerald"
						trend="Network Stable"
					/>
				</Reveal>
			</section>

			{/* Secondary Telemetry Strip */}
			<Reveal delay={0.18}>
				<Card className="border-border bg-card shadow-xs">
					<CardContent className="p-0">
						<div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
							<div className="flex items-center gap-4 px-6 py-4">
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
									<Activity className="h-4 w-4" />
								</span>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										Sensor Anomalies
									</p>
									<p className="mt-1 text-lg font-bold text-foreground tabular-nums">
										{metrics.anomalyCount}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										Recent telemetry signals
									</p>
								</div>
							</div>
							<div className="flex items-center gap-4 px-6 py-4">
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
									<Wrench className="h-4 w-4" />
								</span>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										Recorded Downtime
									</p>
									<p className="mt-1 text-lg font-bold text-foreground tabular-nums">
										{metrics.downtimeHours}h
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										Failure-event downtime
									</p>
								</div>
							</div>
							<div className="flex items-center gap-4 px-6 py-4">
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
									<Gauge className="h-4 w-4" />
								</span>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										Average Utilization
									</p>
									<p className="mt-1 text-lg font-bold text-foreground tabular-nums">
										{metrics.utilization}%
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										Latest equipment telemetry
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</Reveal>

			{/* Analytics Charts Grid */}
			<section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
				<Reveal delay={0.18}>
					<Card className="min-h-[360px] border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<div className="flex items-center justify-between gap-4">
								<div>
									<CardTitle className="text-sm font-bold text-foreground">
										Utilization vs Reported Usage
									</CardTitle>
									<p className="mt-1 text-xs text-muted-foreground">
										Portfolio average from current scenario telemetry.
									</p>
								</div>
								<span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
									8-period view
								</span>
							</div>
						</CardHeader>
						<CardContent className="h-[280px] px-2 pb-4 pt-5">
							<ComparisonTrendChart data={trend} />
						</CardContent>
					</Card>
				</Reveal>

				<Reveal delay={0.22}>
					<Card className="min-h-[360px] border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<div>
								<CardTitle className="text-sm font-bold text-foreground">
									Risk Portfolio
								</CardTitle>
								<p className="mt-1 text-xs text-muted-foreground">
									Current modeled risk by asset.
								</p>
							</div>
						</CardHeader>
						<CardContent className="grid h-[280px] grid-cols-[1fr_210px] items-center gap-2 px-6 py-4">
							<div className="space-y-3.5">
								{riskPortfolio.map((item) => (
									<div
										key={item.name}
										className="flex items-center justify-between gap-3"
									>
										<div className="flex items-center gap-2">
											<span
												className="h-2.5 w-2.5 rounded-full"
												style={{ background: item.fill }}
											/>
											<span className="text-xs text-muted-foreground font-medium">
												{item.name}
											</span>
										</div>
										<span className="text-xs font-bold text-foreground">
											{item.value}
										</span>
									</div>
								))}
							</div>
							<div className="h-[235px] w-full max-w-[235px] justify-self-end">
								<RiskDonut data={riskPortfolio} />
							</div>
						</CardContent>
					</Card>
				</Reveal>
			</section>

			{/* Priority Queue & Hotspots */}
			<section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
				<Reveal delay={0.26}>
					<Card className="border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<div className="flex items-center justify-between gap-4">
								<div>
									<CardTitle className="text-sm font-bold text-foreground">
										Priority Intervention Queue
									</CardTitle>
									<p className="mt-1 text-xs text-muted-foreground">
										Assets ordered by predicted failure lead time.
									</p>
								</div>
								<Link
									href="/equipment"
									className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
								>
									View all <ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y divide-border">
								{priorities.slice(0, 6).map((item) => (
									<Link
										key={item.id}
										href={`/equipment/${item.id}`}
										className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-accent/40"
									>
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
											<Gauge className="h-4 w-4" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<p className="truncate text-xs font-bold text-foreground">
													{item.name}
												</p>
												<StatusBadge level={item.riskLevel} />
											</div>
											<p className="mt-1 truncate text-xs text-muted-foreground">
												{item.facilityName} • {formatEquipmentType(item.type)} •{" "}
												{item.serialNumber}
											</p>
										</div>
										<div className="shrink-0 text-right">
											<p className="text-sm font-bold text-foreground font-mono">
												{item.leadTimeDays}d
											</p>
											<p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
												lead time
											</p>
										</div>
									</Link>
								))}
							</div>
						</CardContent>
					</Card>
				</Reveal>

				<Reveal delay={0.3}>
					<Card className="border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-sm font-bold text-foreground">
										Network Hotspots
									</CardTitle>
									<p className="mt-1 text-xs text-muted-foreground">
										Highest average equipment risk.
									</p>
								</div>
								<Building2 className="h-4 w-4 text-muted-foreground" />
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y divide-border">
								{facilityRanking.map((facility, index) => (
									<Link
										key={facility.id}
										href={`/facilities/${facility.id}`}
										className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-accent/40"
									>
										<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">
											0{index + 1}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-xs font-bold text-foreground">
												{facility.name}
											</p>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{facility.county} • {facility.equipmentCount} assets
											</p>
										</div>
										<div className="text-right">
											<p
												className={`text-xs font-bold font-mono ${facility.averageRisk >= 70 ? "text-red-500" : "text-amber-500"}`}
											>
												{facility.averageRisk}
											</p>
											<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
												risk
											</p>
										</div>
									</Link>
								))}
							</div>
						</CardContent>
					</Card>
				</Reveal>
			</section>

			{/* Equipment Mix & Action Card */}
			<section className="grid gap-5 xl:grid-cols-[1.1fr_1fr_0.9fr]">
				<Reveal delay={0.34}>
					<Card className="h-[310px] border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<CardTitle className="text-sm font-bold text-foreground">
								Equipment Mix
							</CardTitle>
							<p className="mt-1 text-xs text-muted-foreground">
								Asset count by clinical area.
							</p>
						</CardHeader>
						<CardContent className="h-[245px] pt-4">
							<RiskBars data={typeBreakdown} />
						</CardContent>
					</Card>
				</Reveal>

				<Reveal delay={0.38}>
					<Card className="h-[310px] border-border bg-card shadow-xs">
						<CardHeader className="border-b border-border pb-4">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-sm font-bold text-foreground">
										Live Alerts
									</CardTitle>
									<p className="mt-1 text-xs text-muted-foreground">
										Highest urgency signals.
									</p>
								</div>
								<Link
									href="/alerts"
									className="text-xs font-bold text-primary hover:underline"
								>
									Open <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
								</Link>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y divide-border">
								{activeAlerts.map((alert) => (
									<Link
										key={alert.id}
										href={`/equipment/${alert.equipmentId}`}
										className="block px-6 py-3 transition-colors hover:bg-accent/40"
									>
										<div className="flex items-center justify-between gap-3">
											<div className="flex min-w-0 items-center gap-2">
												<span className="h-2 w-2 rounded-full bg-red-500" />
												<span className="truncate text-xs font-bold text-foreground">
													{getFacilityName(alert.facilityId)}
												</span>
											</div>
											<span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
												{alert.severity}
											</span>
										</div>
										<p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
											{alert.message}
										</p>
									</Link>
								))}
							</div>
						</CardContent>
					</Card>
				</Reveal>

				<Reveal delay={0.42}>
					<Card className="h-[310px] border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-xs">
						<CardHeader>
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30">
								<Wrench className="h-4 w-4" />
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-[10px] font-bold uppercase tracking-wider text-primary">
								Next Best Action
							</p>
							<h3 className="mt-2 text-lg font-bold tracking-tight text-foreground">
								Review the 9-day failure window.
							</h3>
							<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
								Several critical assets are entering their modeled intervention window.
								Open the equipment queue and inspect shortest lead times.
							</p>
							<Link
								href="/equipment"
								className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
							>
								Open intervention queue <ArrowRight className="h-3.5 w-3.5" />
							</Link>
						</CardContent>
					</Card>
				</Reveal>
			</section>
		</div>
	);
}
