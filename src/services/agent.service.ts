import { BaseApiService } from './api.service';

export interface ProvanceField {
   key: string;
   label: string;
   type: "text" | "textarea" | "number" | "select" | "boolean";
   required?: boolean;
   placeholder?: string;
   options?: string[];
   default?: unknown;
}

export interface ProvanceConfigTab {
   key: string;
   label: string;
   fields: ProvanceField[];
}

export interface ProvanceOutputField {
   type: "string" | "number" | "boolean" | "object" | "array";
   label: string;
   description?: string;
   properties?: Record<string, ProvanceOutputField>;
}

export interface ProvanceAction {
   key: string;
   name: string;
   description: string;
   endpoint: string;
   method: "POST" | "GET";
   x402?: boolean;
   payment?: {
      amount: number;
      chainId: number;
      token: string;
      tokenAddress: string;
      walletAddress: string;
   };
   config: ProvanceConfigTab[];
   result?: Record<string, ProvanceOutputField>;
}

export interface ProvanceServices {
   web?: { endpoint: string };
   mcp?: { endpoint: string; version: string; tools: string[]; prompts: string[]; resources: string[] };
   a2a?: { endpoint: string; version: string; skills: string[] };
   oasf?: { endpoint: string; version: string; skills: string[]; domains: string[] };
   [key: string]: unknown;
}

export interface Agent {
   id: string;
   agent_id: string;
   token_id: string;
   chain_id: number;
   chain_type: string;
   contract_address: string;
   owner_address: string;
   agent_wallet: string | null;
   name: string;
   description: string;
   image_url: string | null;
   is_active: boolean;
   is_verified: boolean;
   x402_supported: boolean;
   supported_protocols: string[];
   tags: string[];
   image?: string;
   x402_support?: boolean;
   supported_trust?: string[];
   services: ProvanceServices;
   registrations: { agentId: number; agentRegistry: string }[];
   created_at: string;
   updated_at: string;
}

export interface AgentPreview {
   agent_id: string;
   chain_id: number;
   chain_type: string;
   contract_address: string;
   owner_address: string;
   token_id: string;
   supported_protocols: string[];
   name: string | null;
   description: string | null;
   image_url: string | null;
   is_active: boolean;
   services: ProvanceServices;
   registrations: { agentId: number; agentRegistry: string }[];
   x402_support: boolean;
   supported_trust: string[];
   agent_wallet: string | null;
}

class AgentService extends BaseApiService {
   async getAll(): Promise<Agent[]> {
      try {
         const res = await this.api.get<{ agents: Agent[] }>('/agents');
         return res.data.agents;
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async exploreAll(): Promise<Agent[]> {
      try {
         const res = await this.api.get<{ agents: Agent[] }>('/agents/explore');
         return res.data.agents;
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async getById(id: string): Promise<Agent> {
      try {
         const res = await this.api.get<{ agent: Agent }>(`/agents/${id}`);
         return res.data.agent;
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async remove(id: string): Promise<void> {
      try {
         await this.api.delete(`/agents/${id}`);
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async lookup(agentId: string): Promise<{ agent: AgentPreview; message: string }> {
      try {
         const res = await this.api.get<{ agent: AgentPreview; message: string }>(
            `/agents/claim?agent_id=${encodeURIComponent(agentId)}`
         );
         return res.data;
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async claim(agentId: string, signature: string): Promise<Agent> {
      try {
         const res = await this.api.post<{ agent: Agent }>('/agents/claim', { agent_id: agentId, signature });
         return res.data.agent;
      } catch (error) {
         throw this.handleError(error);
      }
   }
}

export const agentService = new AgentService();
