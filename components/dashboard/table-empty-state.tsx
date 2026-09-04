"use client";

import { SlidersHorizontal } from "lucide-react";

interface TableEmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export function TableEmptyState({
  title = "No matching records found",
  description = "Try adjusting your search query or clearing active filters.",
  onReset,
}: TableEmptyStateProps) {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center animate-in fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/80 shadow-xs mb-3">
        <SlidersHorizontal className="h-5 w-5" />
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-4 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-xs"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
