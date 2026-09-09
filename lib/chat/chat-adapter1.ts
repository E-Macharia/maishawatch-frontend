import { processLocalQuery } from "./local-engine";
import type { ChatAdapter, ChatMessage } from "@/types/chat";

export class LocalSnapshotChatAdapter implements ChatAdapter {
  async sendMessage(userQuery: string): Promise<ChatMessage> {
    // Simulate slight natural latency (300ms) for responsive feel
    await new Promise((resolve) => setTimeout(resolve, 300));
    return processLocalQuery(userQuery);
  }
}

export class RemoteBackendChatAdapter implements ChatAdapter {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || "http://localhost:8000";
  }

  async sendMessage(userQuery: string, history?: ChatMessage[]): Promise<ChatMessage> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userQuery, history }),
      });

      if (!response.ok) {
        throw new Error(`Remote AI model error: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.warn("Failed to reach remote AI model backend, falling back to local snapshot engine.", err);
      return processLocalQuery(userQuery);
    }
  }
}

let adapterInstance: ChatAdapter | null = null;

export function getChatAdapter(): ChatAdapter {
  if (!adapterInstance) {
    const provider = process.env.NEXT_PUBLIC_CHAT_PROVIDER || "local";
    if (provider === "remote") {
      adapterInstance = new RemoteBackendChatAdapter();
    } else {
      adapterInstance = new LocalSnapshotChatAdapter();
    }
  }
  return adapterInstance;
}
