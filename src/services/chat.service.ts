import { BaseApiService } from './api.service';
import type { UIMessage } from 'ai';

export interface ChatOutput {
   type: string;
   id: string;
}

export interface Chat {
   id: string;
   title: string;
   outputs: ChatOutput[];
   created_at: string;
   updated_at: string;
}

class ChatService extends BaseApiService {
   async list(): Promise<Chat[]> {
      const res = await this.api.get<Chat[]>('/chats');
      return res.data;
   }

   async create(firstMessage: string): Promise<Chat> {
      const res = await this.api.post<Chat>('/chats', { firstMessage });
      return res.data;
   }

   async getMessages(chatId: string): Promise<UIMessage[]> {
      const res = await this.api.get<{ messages: UIMessage[] }>(`/chats/${chatId}/messages`);
      return res.data.messages ?? [];
   }

   async saveMessages(chatId: string, messages: UIMessage[]): Promise<void> {
      await this.api.post(`/chats/${chatId}/messages`, { messages });
   }

   async rename(chatId: string, title: string): Promise<Chat> {
      const res = await this.api.patch<Chat>(`/chats/${chatId}`, { title });
      return res.data;
   }

   async addOutput(chatId: string, output: ChatOutput): Promise<void> {
      await this.api.post(`/chats/${chatId}/outputs`, output);
   }

   async remove(chatId: string): Promise<void> {
      await this.api.delete(`/chats/${chatId}`);
   }
}

export const chatService = new ChatService();
