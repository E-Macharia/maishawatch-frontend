"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
	ArrowUpRight,
	Building2,
	MapPin,
	Search,
	ShieldAlert,
	X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Reveal } from "@/components/dashboard/motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/dashboard/pagination";
import { FilterSelect } from "@/components/dashboard/filter-select";
import { TableEmptyState } from "@/components/dashboard/table-empty-state";
import { getFacilityRiskRanking } from "@/lib/data/metrics";
import { maishawatchData } from "@/lib/data";

const PAGE_SIZE = 10;

export default function FacilitiesPage() {
	const facilities = getFacilityRiskRanking();
	const [query, setQuery] = useState("");
	const [county, setCounty] = useState("all");
	const [risk, setRisk] = useState("all");
	const [page, setPage] = useState(1);

	const counties = [...new Set(facilities.map((x) => x.county))].sort();

	const filtered = useMemo(
		() =>
			facilities.filter((f) => {
				const q = query.toLowerCase();
				const level =
					f.averageRisk >= 75
						? "critical"
						: f.averageRisk >= 55
							? "high"
							: f.averageRisk >= 35
								? "medium"
								: "low";
				return (
					(!q ||
						`${f.name} ${f.county} ${f.facilityType}`.toLowerCase().includes(q)) &&
					(county === "all" || f.county === county) &&
					(risk === "all" || level === risk)
				);
			}),
		[facilities, query, county, risk],
	);

	const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const reset = () => {
		setQuery("");
		setCounty("all");
		setRisk("all");
		setPage(1);
	};

	const elevated = facilities.filter((x) => x.averageRisk >= 60).length;

	return (
		<div className="space-y-6">
			{/* Header Banner */}
			<Reveal>
				<div>
					<p className="text-[10px] font-bold uppercase tracking-wider text-primary">
						Network View
					</p>
					<h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Facilities Directory
					</h1>
					<p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
						Compare operational risk, equipment exposure, and maintenance pressure
						across monitored hospitals.
					</p>
				</div>
			</Reveal>

			{/* KPI Cards */}
			<section className="grid gap-4 sm:grid-cols-3">
				<MetricCard
					label="Facilities Monitored"
					value={facilities.length}
					hint="Across monitored counties"
					icon={Building2}
				/>
				<MetricCard
					label="Elevated Risk"
					value={elevated}
					hint="Average risk score ≥ 60"
					icon={ShieldAlert}
					tone="red"
				/>
				<MetricCard
					label="Counties Represented"
					value={new Set(maishawatchData.facilities.map((x) => x.county)).size}
					hint="Active network coverage"
					icon={MapPin}
					tone="emerald"
				/>
			</section>

			{/* Facility Directory Table Card */}
			<Reveal delay={0.08}>
				<Card className="border-border bg-card shadow-xs">
					<CardHeader className="border-b border-border pb-4">
						<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
							<div>
								<CardTitle className="text-sm font-bold text-foreground">
									Facility Risk Register
								</CardTitle>
								<p className="mt-1 text-xs text-muted-foreground">
									{filtered.length} facilities match the current view.
								</p>
							</div>

							{/* Filter Toolbar */}
							<div className="flex flex-wrap items-center gap-2">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
									<input
										value={query}
										onChange={(e) => {
											setQuery(e.target.value);
											setPage(1);
										}}
										placeholder="Search facility or county..."
										className="h-9 w-60 rounded-lg border border-border bg-background pl-9 pr-8 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-xs"
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
									value={county}
									onChange={(v) => {
										setCounty(v);
										setPage(1);
									}}
									options={[
										{ value: "all", label: "All Counties" },
										...counties.map((c) => ({ value: c, label: c })),
									]}
								/>

								<FilterSelect
									value={risk}
									onChange={(v) => {
										setRisk(v);
										setPage(1);
									}}
									options={[
										{ value: "all", label: "All Risk" },
										{ value: "critical", label: "Critical" },
										{ value: "high", label: "High" },
										{ value: "medium", label: "Moderate" },
										{ value: "low", label: "Low" },
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
						<div className="overflow-x-auto">
							<table className="w-full min-w-[900px] text-left">
								<thead className="bg-muted/40 border-b border-border">
									<tr>
										{[
											"Facility",
											"County",
											"Service Level",
											"Assets",
											"Critical",
											"Risk",
											"",
										].map((h) => (
											<th
												key={h}
												className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{rows.map((f) => (
										<tr key={f.id} className="transition-colors hover:bg-accent/40">
											<td className="px-6 py-4">
												<Link href={`/facilities/${f.id}`}>
													<p className="text-xs font-bold text-foreground hover:underline">
														{f.name}
													</p>
													<p className="mt-0.5 text-[11px] text-muted-foreground">
														{f.facilityType}
													</p>
												</Link>
											</td>
											<td className="px-6 py-4 text-xs font-medium text-muted-foreground">
												{f.county}
											</td>
											<td className="px-6 py-4 text-xs capitalize text-muted-foreground">
												{f.serviceLevel.replace("_", " ")}
											</td>
											<td className="px-6 py-4 text-xs font-mono font-bold text-foreground">
												{f.equipmentCount}
											</td>
											<td className="px-6 py-4 text-xs font-mono font-bold text-red-500">
												{f.criticalCount}
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2">
													<StatusBadge
														level={
															f.averageRisk >= 75
																? "critical"
																: f.averageRisk >= 55
																	? "high"
																	: f.averageRisk >= 35
																		? "medium"
																		: "low"
														}
													/>
													<span className="text-xs font-mono font-bold text-foreground">
														{f.averageRisk}
													</span>
												</div>
											</td>
											<td className="px-6 py-4 text-right">
												<Link
													href={`/facilities/${f.id}`}
													className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-xs"
												>
													<ArrowUpRight className="h-3.5 w-3.5" />
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{rows.length === 0 && (
							<TableEmptyState
								title="No facilities match current filters"
								description="Try clearing search query or county/risk dropdowns."
								onReset={reset}
							/>
						)}

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
