// lib/chat/chat-adapter.ts
import { api } from "@/lib/api/backend-client";
import type { ChatMessage } from "@/types/chat";

export interface ChatAdapter {
  sendMessage: (text: string, history: ChatMessage[]) => Promise<ChatMessage>;
}

class BackendChatAdapter implements ChatAdapter {
  private conversationId: string | null = null;

  async sendMessage(text: string, history: ChatMessage[]): Promise<ChatMessage> {
    try {
      // Send to backend
      const response = await api.chat.send(
        text,
        this.conversationId || undefined,
        { language: "en" }
      );

      // Store conversation ID for subsequent messages
      if (response.conversation_id) {
        this.conversationId = response.conversation_id;
      }

      // Format response
      return {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedPrompts: response.suggestions || [],
        navigationAction: response.action ? {
          label: response.action.label || "View Details",
          autoNavigate: false,
          path: response.action.path || "",
        } : undefined,
      };
    } catch (error) {
      console.error("Backend chat error:", error);
      return {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to the backend. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
    }
  }
}

class MockChatAdapter implements ChatAdapter {
  async sendMessage(text: string, history: ChatMessage[]): Promise<ChatMessage> {
    // This is a fallback mock adapter if backend is not available
    const lowerText = text.toLowerCase();
    let response = "I'm sorry, I'm having trouble connecting to the backend. Please check your connection and try again.";

    // Simple fallback responses if backend is unreachable
    if (lowerText.includes("status") || lowerText.includes("state")) {
      response = "I'm unable to fetch equipment status from the backend. Please check if the backend service is running.";
    } else if (lowerText.includes("alert") || lowerText.includes("risk")) {
      response = "I'm unable to fetch alerts from the backend. Please check if the backend service is running.";
    } else if (lowerText.includes("maintenance") || lowerText.includes("servic")) {
      response = "I'm unable to fetch maintenance information from the backend. Please check if the backend service is running.";
    }

    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedPrompts: [
        "Try connecting to backend",
        "Check equipment status",
        "Show alerts",
      ],
    };
  }
}

let adapterInstance: ChatAdapter | null = null;

export function getChatAdapter(): ChatAdapter {
  if (!adapterInstance) {
    // Try to use backend adapter first
    adapterInstance = new BackendChatAdapter();
  }
  return adapterInstance;
}

export function setChatAdapter(adapter: ChatAdapter) {
  adapterInstance = adapter;
}