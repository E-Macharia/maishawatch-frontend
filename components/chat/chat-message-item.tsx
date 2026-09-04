"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bot, User, ArrowRight, Activity, AlertTriangle, Building2, ShieldAlert, ChevronRight } from "lucide-react";
import type { ChatMessage, RichCardPayload } from "@/types/chat";

interface ChatMessageItemProps {
  message: ChatMessage;
  onNavigate?: (path: string) => void;
}

export function ChatMessageItem({ message, onNavigate }: ChatMessageItemProps) {
  const router = useRouter();
  const isUser = message.role === "user";

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  return (
    <div className={`flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-200 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold shadow-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border border-border/60"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-500" />}
      </div>

      {/* Message Bubble & Cards */}
      <div className={`flex flex-col max-w-[88%] sm:max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-xs leading-relaxed border shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-xs font-medium"
              : "bg-card text-foreground border-border/80 rounded-tl-xs"
          }`}
        >
          <div className="space-y-1.5 font-sans">
            {renderFormattedText(message.content, isUser)}
          </div>
        </div>

        {/* Rich Cards Section */}
        {message.cards && message.cards.length > 0 && (
          <div className="w-full mt-2.5 space-y-2.5">
            {message.cards.map((card, idx) => (
              <RenderRichCard key={idx} card={card} onNavigate={handleNavigation} />
            ))}
          </div>
        )}

        {/* Navigation Action Button */}
        {message.navigationAction && (
          <div className="mt-2.5">
            <button
              onClick={() => handleNavigation(message.navigationAction!.path)}
              className="group inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              <span>{message.navigationAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        <span className="text-[10px] text-muted-foreground/80 mt-1 px-1 font-mono">{message.timestamp}</span>
      </div>
    </div>
  );
}

function RenderRichCard({ card, onNavigate }: { card: RichCardPayload; onNavigate: (path: string) => void }) {
  if (card.type === "equipment") {
    const eq = card.data;
    const riskStyles = {
      critical: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
      high: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      medium: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
      low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    };

    return (
      <div className="p-3.5 rounded-xl border border-border/80 bg-background/90 shadow-xs flex flex-col gap-2.5 hover:border-primary/50 transition-all group">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Activity className="w-4 h-4 text-primary shrink-0" />
              <span className="font-bold text-xs text-foreground">{eq.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">
                {eq.id}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{eq.facilityName}</span> • {eq.county}
            </p>
          </div>
          <span
            className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border tracking-wide shrink-0 ${
              riskStyles[eq.riskLevel] || riskStyles.low
            }`}
          >
            {eq.riskLevel} ({eq.riskScore})
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2.5 rounded-lg border border-border/50">
          <div>
            <span className="text-muted-foreground font-medium">RUL Hours:</span>{" "}
            <span className="font-mono font-bold text-foreground">{eq.rulHours ? `${eq.rulHours}h` : "N/A"}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Discrepancy:</span>{" "}
            <span className={`font-mono font-bold ${eq.discrepancyFlagged ? "text-red-500" : "text-foreground"}`}>
              {eq.discrepancyPercent}%
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate(`/equipment/${eq.id}`)}
          className="w-full text-[11px] font-semibold py-1.5 px-3 rounded-lg bg-muted/80 hover:bg-primary hover:text-primary-foreground transition-all text-center flex items-center justify-center gap-1.5 text-foreground shadow-xs border border-border/40"
        >
          <span>Inspect Asset Details</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  if (card.type === "facility") {
    const fac = card.data;
    return (
      <div className="p-3.5 rounded-xl border border-border/80 bg-background/90 shadow-xs flex flex-col gap-2.5 hover:border-primary/50 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-bold text-xs text-foreground">{fac.name}</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 shrink-0">
            Level {fac.serviceLevel}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground flex justify-between items-center bg-muted/30 p-2 rounded-lg border border-border/40">
          <span>County: <strong className="text-foreground">{fac.county}</strong></span>
          <span>Assets: <strong className="text-foreground">{fac.equipmentCount || 0}</strong></span>
          {fac.highRiskCount ? <span className="text-red-500 font-bold">Critical: {fac.highRiskCount}</span> : null}
        </div>
        <button
          onClick={() => onNavigate(`/facilities?id=${fac.id}`)}
          className="w-full text-[11px] font-semibold py-1.5 px-3 rounded-lg bg-muted/80 hover:bg-primary hover:text-primary-foreground transition-all text-center flex items-center justify-center gap-1.5 text-foreground shadow-xs border border-border/40"
        >
          <span>View Facility Overview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (card.type === "metric") {
    const m = card.data;
    const intentStyles = {
      danger: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
      warning: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
      success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
      info: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
    };

    return (
      <div
        className={`p-3.5 rounded-xl border shadow-xs flex items-center justify-between ${
          intentStyles[m.intent || "info"]
        }`}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">{m.title}</p>
          <p className="text-base font-extrabold font-mono tracking-tight mt-0.5">{m.value}</p>
          {m.description && <p className="text-[11px] opacity-90 mt-0.5 font-medium">{m.description}</p>}
        </div>
        <ShieldAlert className="w-5 h-5 opacity-70 shrink-0" />
      </div>
    );
  }

  return null;
}

function renderFormattedText(text: string, isUser: boolean = false) {
  const lines = text.split("\n");
  const textColorClass = isUser ? "text-primary-foreground font-medium" : "text-foreground/95";
  const headerColorClass = isUser ? "text-primary-foreground font-bold border-primary-foreground/30" : "text-foreground font-bold border-border/60";

  return lines.map((line, i) => {
    // Handle header ###
    if (line.startsWith("### ")) {
      return (
        <h3 key={i} className={`font-bold text-xs mt-2.5 mb-1 border-b pb-1 tracking-tight flex items-center gap-1.5 ${headerColorClass}`}>
          {line.replace("### ", "")}
        </h3>
      );
    }

    // Bullet point line parsing
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      const rawText = line.replace(/^[\s-•]+/, "");
      return (
        <div key={i} className={`flex items-start gap-1.5 my-1 text-xs ${textColorClass}`}>
          <span className={`${isUser ? "text-primary-foreground" : "text-primary"} font-bold select-none`}>•</span>
          <div className="flex-1">{formatInline(rawText, isUser)}</div>
        </div>
      );
    }

    return (
      <div key={i} className={`min-h-[1.25em] text-xs ${textColorClass}`}>
        {formatInline(line, isUser)}
      </div>
    );
  });
}

function formatInline(text: string, isUser: boolean = false) {
  // Replace **bold** and `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  const boldClass = isUser ? "font-bold text-primary-foreground" : "font-bold text-foreground";
  const codeClass = isUser
    ? "font-mono bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded text-[11px] font-semibold border border-primary-foreground/30"
    : "font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] font-semibold border border-border/50 text-foreground";

  return parts.map((part, pIdx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={pIdx} className={boldClass}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={pIdx} className={codeClass}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={pIdx}>{part}</span>;
  });
}
