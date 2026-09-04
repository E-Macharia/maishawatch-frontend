"use client";

import React, { useEffect, useRef } from "react";
import { Bot, Sparkles } from "lucide-react";
import { ChatMessageItem } from "./chat-message-item";
import type { ChatMessage } from "@/types/chat";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onNavigate?: (path: string) => void;
}

export function ChatMessageList({ messages, isLoading, onNavigate }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border/60">
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} onNavigate={onNavigate} />
      ))}

      {isLoading && (
        <div className="flex gap-3 items-center mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border border-border/60 flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="bg-card text-foreground border border-border/80 rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex items-center gap-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span className="text-muted-foreground font-medium">Analyzing snapshot data...</span>
            <div className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
