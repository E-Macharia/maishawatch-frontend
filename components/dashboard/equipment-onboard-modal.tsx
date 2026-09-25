"use client";

import React, { useState } from "react";
import { Plus, Building2, Stethoscope, Hash, Calendar, Layers, ShieldAlert, Check, Loader2, X } from "lucide-react";
import { useLiveData } from "@/lib/data/live-context";
import { useToast } from "@/components/ui/toast-context";
import { api } from "@/lib/api/backend-client";

const EQUIPMENT_TYPES = [
	{ label: "MRI Scanner", value: "MRI" },
	{ label: "CT Scanner", value: "CT" },
	{ label: "Ventilator / Respiratory", value: "Ventilator" },
	{ label: "Hemodialysis Machine", value: "Hemodialysis" },
	{ label: "Ultrasound System", value: "Ultrasound" },
	{ label: "Digital X-Ray System", value: "X-Ray" },
	{ label: "Anesthesia Workstation", value: "Anesthesia" },
	{ label: "Patient ICU Monitor", value: "Patient Monitor" },
];

const MANUFACTURERS = ["Philips Healthcare", "GE HealthCare", "Siemens Healthineers", "Mindray", "Dräger", "Fresenius Medical Care"];

export function EquipmentOnboardModal({
	trigger,
	onSuccess,
}: {
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}) {
	const { facilities, equipment, refresh } = useLiveData();
	const { success, error } = useToast();
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Next ID suggestion
	const nextNum = (equipment.length + 1).toString().padStart(5, "0");
	const suggestedId = `ME-${nextNum}`;

	const [equipmentId, setEquipmentId] = useState(suggestedId);
	const [equipmentType, setEquipmentType] = useState("Ventilator");
	const [manufacturer, setManufacturer] = useState("Philips Healthcare");
	const [model, setModel] = useState("Trilogy Evo");
	const [serialNumber, setSerialNumber] = useState(`SN-${Date.now().toString().slice(-6)}`);
	const [facilityId, setFacilityId] = useState(facilities[0]?.id || "10083");
	const [department, setDepartment] = useState("Critical Care Unit");
	const [criticality, setCriticality] = useState("High");
	const [installDate, setInstallDate] = useState(new Date().toISOString().split("T")[0]);
	const [operatingHours, setOperatingHours] = useState("1200");
	const [maintenanceInterval, setMaintenanceInterval] = useState("90");

	const handleOpen = () => {
		const newNum = (equipment.length + 1).toString().padStart(5, "0");
		setEquipmentId(`ME-${newNum}`);
		setSerialNumber(`SN-${Date.now().toString().slice(-6)}`);
		if (facilities.length > 0 && !facilityId) {
			setFacilityId(facilities[0].id);
		}
		setOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!equipmentId.trim() || !facilityId) {
			error("Validation Error", "Please provide a valid Equipment ID and Facility.");
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				equipment_id: equipmentId.trim().toUpperCase(),
				equipment_type: equipmentType,
				manufacturer,
				model,
				serial_number: serialNumber.trim(),
				facility_id: facilityId,
				department,
				criticality,
				installation_date: installDate,
				operating_hours_at_start: Number(operatingHours) || 0,
				maintenance_interval_days: Number(maintenanceInterval) || 90,
				status: "Operational",
			};

			await api.equipment.create(payload);

			success(
				"Equipment Onboarded Successfully",
				`${equipmentType} (${equipmentId.toUpperCase()}) has been registered in the live backend system.`,
			);

			await refresh();
			setOpen(false);
			if (onSuccess) onSuccess();
		} catch (err: any) {
			console.error("Failed to onboard equipment:", err);
			error(
				"Registration Failed",
				err?.message || "Failed to register equipment with backend API.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			{trigger ? (
				<div onClick={handleOpen}>{trigger}</div>
			) : (
				<button
					onClick={handleOpen}
					className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
				>
					<Plus className="h-4 w-4" />
					<span>Onboard Asset</span>
				</button>
			)}

			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
					<div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
							<div className="flex items-center gap-2.5">
								<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
									<Stethoscope className="h-4 w-4" />
								</div>
								<div>
									<h2 className="text-base font-bold text-foreground">Onboard Medical Equipment</h2>
									<p className="text-xs text-muted-foreground">Register new clinical asset to the live telemetry stream</p>
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
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Equipment ID
									</label>
									<div className="relative">
										<Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
										<input
											type="text"
											required
											value={equipmentId}
											onChange={(e) => setEquipmentId(e.target.value)}
											className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
											placeholder="ME-00151"
										/>
									</div>
								</div>

								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Serial Number
									</label>
									<input
										type="text"
										required
										value={serialNumber}
										onChange={(e) => setSerialNumber(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
										placeholder="SN-123456"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Equipment Category
									</label>
									<select
										value={equipmentType}
										onChange={(e) => setEquipmentType(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
									>
										{EQUIPMENT_TYPES.map((t) => (
											<option key={t.value} value={t.value}>
												{t.label}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Manufacturer
									</label>
									<select
										value={manufacturer}
										onChange={(e) => setManufacturer(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
									>
										{MANUFACTURERS.map((m) => (
											<option key={m} value={m}>
												{m}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Model Name
									</label>
									<input
										type="text"
										required
										value={model}
										onChange={(e) => setModel(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
										placeholder="e.g. Achieva 1.5T / Servo-Air"
									/>
								</div>

								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Hospital Facility
									</label>
									<select
										value={facilityId}
										onChange={(e) => setFacilityId(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
									>
										{facilities.map((f) => (
											<option key={f.id} value={f.id}>
												{f.name} ({f.county})
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-3">
								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Department
									</label>
									<input
										type="text"
										value={department}
										onChange={(e) => setDepartment(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
										placeholder="ICU / Radiology"
									/>
								</div>

								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Criticality Tier
									</label>
									<select
										value={criticality}
										onChange={(e) => setCriticality(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
									>
										<option value="High">High Criticality</option>
										<option value="Medium">Medium</option>
										<option value="Low">Low</option>
									</select>
								</div>

								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Start Hours
									</label>
									<input
										type="number"
										value={operatingHours}
										onChange={(e) => setOperatingHours(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
										placeholder="1200"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Install Date
									</label>
									<input
										type="date"
										value={installDate}
										onChange={(e) => setInstallDate(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
									/>
								</div>

								<div>
									<label className="text-xs font-bold text-foreground block mb-1.5">
										Service Interval (Days)
									</label>
									<input
										type="number"
										value={maintenanceInterval}
										onChange={(e) => setMaintenanceInterval(e.target.value)}
										className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
										placeholder="90"
									/>
								</div>
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
											<span>Registering...</span>
										</>
									) : (
										<>
											<Check className="h-3.5 w-3.5" />
											<span>Register Asset</span>
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
