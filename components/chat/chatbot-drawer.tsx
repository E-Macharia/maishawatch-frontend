"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, X, Send, Sparkles, RotateCcw, Minimize2, Maximize2 } from "lucide-react";
import { getChatAdapter } from "@/lib/chat/chat-adapter";
import { ChatMessageList } from "./chat-message-list";
import { ChatPromptSuggestions } from "./chat-prompt-suggestions";
import type { ChatMessage } from "@/types/chat";
import { maishawatchData } from "@/lib/data";

const initialMessage: ChatMessage = {
  id: "welcome-1",
  role: "assistant",
  content: `### Welcome to **MaishaWatch AI**
I am your interactive risk-monitoring assistant, connected directly to the **MaishaWatch Backend Dataset** (12,394 facilities, 150 equipment assets, 324,000 telemetry readings).

How can I help you today? You can click any suggested prompt below or type your question.`,
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  suggestedPrompts: [
    "Show critical risk equipment",
    "Which equipment is overdue for maintenance?",
    "Show usage discrepancies",
    "Which facilities in Nairobi need support?",
  ],
};

export function ChatbotDrawer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      try {
        const readIds: string[] = JSON.parse(localStorage.getItem("maisha-notification-read") || "[]");
        const activeAlerts = maishawatchData.alerts.filter((a) => a.severity === "critical" || a.severity === "high").slice(0, 6);
        const unread = activeAlerts.filter((a) => !readIds.includes(a.id));
        setUnreadCount(unread.length);
      } catch {
        const activeAlerts = maishawatchData.alerts.filter((a) => a.severity === "critical" || a.severity === "high").slice(0, 6);
        setUnreadCount(activeAlerts.length);
      }
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  };

  const handleSend = async (text?: string) => {
    const textToSend = (text || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const adapter = getChatAdapter();
      const responseMsg = await adapter.sendMessage(textToSend, messages);
      setMessages((prev) => [...prev, responseMsg]);

      // If response includes auto-navigation action, handle smooth routing
      if (responseMsg.navigationAction?.autoNavigate) {
        router.push(responseMsg.navigationAction.path);
      }
    } catch (err) {
      console.error("Chat engine error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, an error occurred while querying the dataset. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([initialMessage]);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestions = lastAssistantMsg?.suggestedPrompts || initialMessage.suggestedPrompts || [];

  return (
    <>
      {/* Floating Action Trigger Button */}
      <div className="fixed bottom-5 right-5 z-50">
        {!isOpen && (
          <button
            onClick={handleToggle}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-border/40"
            aria-label="Open MaishaWatch AI"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-500 group-hover:rotate-12 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </span>
              )}
            </div>
            <span className="tracking-wide">MaishaWatch AI</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </button>
        )}
      </div>

      {/* Modal Backdrop Blur Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm sm:backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={handleToggle}
          aria-hidden="true"
        />
      )}

      {/* Expandable Chat Window Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col bg-background/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden animate-in slide-in-from-bottom-5 zoom-in-95 ${
            isExpanded
              ? "w-[calc(100vw-32px)] sm:w-[580px] h-[calc(100vh-64px)] sm:h-[700px]"
              : "w-[calc(100vw-32px)] sm:w-[440px] h-[580px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-card/95 border-b border-border/80 select-none shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-foreground tracking-tight">MaishaWatch AI</h3>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" title="Online Snapshot Engine" />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Connected to Backend Snapshot</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse" : "Expand"}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleToggle}
                title="Close chat"
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <ChatMessageList messages={messages} isLoading={isLoading} onNavigate={handleNavigate} />

          {/* Quick Suggestions Chips */}
          <ChatPromptSuggestions prompts={suggestions} onSelectPrompt={(p) => handleSend(p)} />

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3.5 bg-card/95 border-t border-border/80 flex items-center gap-2.5 shadow-lg"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask MaishaWatch AI about equipment, facilities, risk..."
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
