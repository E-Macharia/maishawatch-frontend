"use client";

import React, { useState } from "react";
import { Wrench, Calendar, DollarSign, UserCheck, AlertTriangle, Check, Loader2, X, ClipboardList } from "lucide-react";
import { useLiveData } from "@/lib/data/live-context";
import { useToast } from "@/components/ui/toast-context";
import { api } from "@/lib/api/backend-client";
import type { Equipment, Facility, Alert } from "@/types/maishawatch";

export function WorkOrderModal({
	equipment,
	facility,
	alert,
	trigger,
	onSuccess,
}: {
	equipment: Equipment;
	facility?: Facility;
	alert?: Alert;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}) {
	const { refresh, getFacilityName } = useLiveData();
	const { success, error } = useToast();
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const [title, setTitle] = useState(
		alert
			? `Corrective Action: ${alert.message}`
			: `Maintenance Protocol: ${equipment.name}`,
	);
	const [maintenanceType, setMaintenanceType] = useState<"corrective" | "preventive" | "calibration">(
		equipment.riskLevel === "critical" || alert ? "corrective" : "preventive",
	);
	const [priority, setPriority] = useState<"urgent" | "high" | "medium" | "low">(
		equipment.riskLevel === "critical" ? "urgent" : equipment.riskLevel === "high" ? "high" : "medium",
	);
	const [technician, setTechnician] = useState("Eng. J. Kiprop (Biomedical Lead)");
	const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
	const [estimatedCost, setEstimatedCost] = useState("8500");
	const [notes, setNotes] = useState(
		alert?.scenarioRationale || equipment.scenarioRationale || "Comprehensive sensor diagnostics, filter inspection, and calibration sequence.",
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		try {
			const payload = {
				equipment_id: equipment.id,
				facility_id: equipment.facilityId,
				title: title.trim(),
				type: maintenanceType,
				priority,
				assigned_technician: technician,
				scheduled_date: scheduledDate,
				estimated_cost: Number(estimatedCost) || 0,
				notes: notes.trim(),
				status: "Scheduled",
			};

			await api.maintenance.createWorkOrder(payload);

			success(
				"Work Order Dispatched",
				`Order for ${equipment.name} assigned to ${technician} and recorded in live backend.`,
			);

			await refresh();
			setOpen(false);
			if (onSuccess) onSuccess();
		} catch (err: any) {
			console.error("Failed to create work order:", err);
			error(
				"Dispatch Failed",
				err?.message || "Could not dispatch work order to backend.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const facilityName = facility?.name || getFacilityName(equipment.facilityId);

	return (
		<>
			{trigger ? (
				<div onClick={() => setOpen(true)}>{trigger}</div>
			) : (
				<button
					onClick={() => setOpen(true)}
					className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
				>
					<Wrench className="h-3.5 w-3.5" />
					<span>Dispatch Work Order</span>
				</button>
			)}

			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
					<div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
							<div className="flex items-center gap-2.5">
								<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
									<ClipboardList className="h-4 w-4" />
								</div>
								<div>
									<h2 className="text-base font-bold text-foreground">Dispatch Maintenance Order</h2>
									<p className="text-xs text-muted-foreground">{equipment.name} • {facilityName}</p>
								</div>
							</div>
							<button
								onClick={() => setOpen(false)}
								className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
							<div>
								<label className="text-xs font-bold text-foreground block mb-1.5">
									Work Order Title
								</label>
								<input
									type="text"
									required
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Maintenance Category
									</label>
									<select
										value={maintenanceType}
										onChange={(e) => setMaintenanceType(e.target.value as any)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
									>
										<option value="corrective">Corrective Maintenance</option>
										<option value="preventive">Preventive Inspection</option>
										<option value="calibration">Sensor Calibration</option>
									</select>
								</div>

								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Urgency / Priority
									</label>
									<select
										value={priority}
										onChange={(e) => setPriority(e.target.value as any)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
									>
										<option value="urgent">Urgent / Immediate</option>
										<option value="high">High Priority</option>
										<option value="medium">Medium</option>
										<option value="low">Low Priority</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Assigned Technician
									</label>
									<div className="relative">
										<UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
										<input
											type="text"
											required
											value={technician}
											onChange={(e) => setTechnician(e.target.value)}
											className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
										/>
									</div>
								</div>

								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Scheduled Date
									</label>
									<div className="relative">
										<Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
										<input
											type="date"
											required
											value={scheduledDate}
											onChange={(e) => setScheduledDate(e.target.value)}
											className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
										/>
									</div>
								</div>
							</div>

							<div>
								<label className="text-xs font-bold text-foreground block mb-1.5">
									Estimated Cost (KES)
								</label>
								<div className="relative">
									<DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
									<input
										type="number"
										value={estimatedCost}
										onChange={(e) => setEstimatedCost(e.target.value)}
										className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
										placeholder="8500"
									/>
								</div>
							</div>

							<div>
								<label className="text-xs font-bold text-foreground block mb-1.5">
									Biomedical Engineering Notes & Instructions
								</label>
								<textarea
									rows={3}
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
									placeholder="Describe required service tasks, part replacements, or test procedures."
								/>
							</div>

							{/* Footer */}
							<div className="pt-3 border-t border-border flex items-center justify-end gap-3">
								<button
									type="button"
									onClick={() => setOpen(false)}
									className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
								>
									{submitting ? (
										<>
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
											<span>Dispatching...</span>
										</>
									) : (
										<>
											<Check className="h-3.5 w-3.5" />
											<span>Confirm & Dispatch</span>
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
