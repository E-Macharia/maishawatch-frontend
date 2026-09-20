"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
	id?: string;
	title: string;
	description?: string;
	type?: ToastType;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

interface ToastItem extends ToastOptions {
	id: string;
	type: ToastType;
}

interface ToastContextType {
	toast: (options: ToastOptions) => string;
	success: (title: string, description?: string) => string;
	error: (title: string, description?: string) => string;
	warning: (title: string, description?: string) => string;
	info: (title: string, description?: string) => string;
	dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const dismiss = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const addToast = useCallback(
		(options: ToastOptions): string => {
			const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
			const type = options.type || "info";
			const duration = options.duration ?? 4500;

			const newToast: ToastItem = {
				...options,
				id,
				type,
			};

			setToasts((prev) => [newToast, ...prev].slice(0, 5));

			if (duration > 0) {
				setTimeout(() => {
					dismiss(id);
				}, duration);
			}

			return id;
		},
		[dismiss],
	);

	const success = useCallback(
		(title: string, description?: string) =>
			addToast({ title, description, type: "success" }),
		[addToast],
	);

	const error = useCallback(
		(title: string, description?: string) =>
			addToast({ title, description, type: "error" }),
		[addToast],
	);

	const warning = useCallback(
		(title: string, description?: string) =>
			addToast({ title, description, type: "warning" }),
		[addToast],
	);

	const info = useCallback(
		(title: string, description?: string) =>
			addToast({ title, description, type: "info" }),
		[addToast],
	);

	return (
		<ToastContext.Provider
			value={{
				toast: addToast,
				success,
				error,
				warning,
				info,
				dismiss,
			}}
		>
			{children}

			{/* Toast Viewport Container */}
			<div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
				<AnimatePresence>
					{toasts.map((t) => {
						const isSuccess = t.type === "success";
						const isError = t.type === "error";
						const isWarning = t.type === "warning";

						const icon = isSuccess ? (
							<CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
						) : isError ? (
							<XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
						) : isWarning ? (
							<AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
						) : (
							<Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
						);

						const borderColor = isSuccess
							? "border-emerald-500/20 bg-card/95"
							: isError
								? "border-red-500/20 bg-card/95"
								: isWarning
									? "border-amber-500/20 bg-card/95"
									: "border-border bg-card/95";

						return (
							<motion.div
								key={t.id}
								initial={{ opacity: 0, y: 20, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
								className={`pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md ${borderColor}`}
							>
								<div className="flex gap-3 min-w-0">
									{icon}
									<div className="min-w-0">
										<p className="text-xs font-bold text-foreground leading-tight">
											{t.title}
										</p>
										{t.description && (
											<p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
												{t.description}
											</p>
										)}
										{t.action && (
											<button
												onClick={() => {
													t.action?.onClick();
													dismiss(t.id);
												}}
												className="mt-2 text-[11px] font-bold text-primary hover:underline"
											>
												{t.action.label}
											</button>
										)}
									</div>
								</div>
								<button
									onClick={() => dismiss(t.id)}
									className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
									aria-label="Close notification"
								>
									<X className="h-3.5 w-3.5" />
								</button>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
