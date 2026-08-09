import { createClient } from "@/utils/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const LOCAL_KEY = (id: string) => `provance_chat_${id}`;

class ChatService {
  async loadMessages(workflowId: string): Promise<ChatMessage[]> {
    if (isUUID(workflowId)) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("workflow_id", workflowId)
          .order("created_at", { ascending: true });
        if (data && data.length > 0) return data as ChatMessage[];
      } catch {}
    }
    try {
      const raw = localStorage.getItem(LOCAL_KEY(workflowId));
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  }

  async saveMessage(workflowId: string, msg: ChatMessage): Promise<void> {
    if (isUUID(workflowId)) {
      try {
        const supabase = createClient();
        await supabase.from("chat_messages").insert({
          workflow_id: workflowId,
          role: msg.role,
          content: msg.content,
        });
        return;
      } catch {}
    }
    try {
      const raw = localStorage.getItem(LOCAL_KEY(workflowId));
      const existing: ChatMessage[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(LOCAL_KEY(workflowId), JSON.stringify([...existing, msg]));
    } catch {}
  }
}

export const chatService = new ChatService();
