import { BaseApiService } from './api.service';
import type { UIMessage } from 'ai';

class AiService extends BaseApiService {
   async getChatHistory(workflowId: string): Promise<UIMessage[]> {
      try {
         const res = await this.api.get<{ messages: UIMessage[] }>('/ai/history', {
            params: { workflowId },
         });
         return res.data.messages ?? [];
      } catch {
         return [];
      }
   }
}

export const aiService = new AiService();
