"use client";

import React from "react";
import { Sparkles, CornerDownRight } from "lucide-react";

interface ChatPromptSuggestionsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

export function ChatPromptSuggestions({ prompts, onSelectPrompt }: ChatPromptSuggestionsProps) {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-muted/40 backdrop-blur-xs border-t border-border/60">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span>Suggested Prompts</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt)}
            className="group text-xs font-semibold px-3 py-1.5 rounded-xl bg-background/90 border border-border/80 text-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-150 text-left shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <CornerDownRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
