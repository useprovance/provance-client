import { BaseApiService } from './api.service';
import type { BudgetSnapshot } from './budget.service';

export interface WorkflowLog {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface PermitSignature {
  owner: `0x${string}`;
  spender: `0x${string}`;
  tokenAddress: `0x${string}`;
  chainId: number;
  amount: bigint;
  nonce: bigint;
  deadline: bigint;
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
}


export type BlockRunOptions = {nodeId:string;inputMode:'manual'|'saved';input?:Record<string,unknown>;sourceRunId?:string;sourceItemIndex?:number};
export type BlockRunScope = {kind:'block';nodeId:string;label:string;sourceRunId?:string;sourceItemIndex?:number};

export type WorkflowRun = {
  scope?: BlockRunScope;
  id: string;
  status: 'running' | 'success' | 'error';
  startedAt: string;
  nodeResults: NodeRunResult[];
};

export type NodeRunResult = {
  nodeId: string;
  label: string;
  status: 'success' | 'error' | 'skipped';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
  startedAt: string;
  durationMs: number;
};

export type PendingPayment = {
  runId: string;
  nodeId: string;
  itemCount: number;
  pricePerCall: number;
  totalAmount: number;
  token: string;
  tokenAddress: `0x${string}`;
  walletAddress: `0x${string}`;
  chainId: number;
};

export type PendingApproval = {runId:string;nodeId:string;callIndex:number;label:string;input:Record<string,unknown>;maxFeeUsd:string;approvalId?:string;providerPolicy?:{scheme?:'exact'|'free';network:string|null;asset:string|null;payTo:string|null;url:string;policyHash:string;registryRevision:string}};

export type RunEvent =
  | { type: "budget"; budget: BudgetSnapshot }
  | ({type:"approval_required"} & Omit<PendingApproval,'runId'>)
  | { type: "node_start";       nodeId: string; input: Record<string, unknown> }
  | { type: "node_success";     nodeId: string; output: Record<string, unknown> }
  | { type: "node_error";       nodeId: string; error: string }
  | { type: "log";              level: "info" | "warn" | "error"; message: string }
  | { type: "complete";         status: "success" | "error"; nodeResults: NodeRunResult[] }
  | { type: "payment_required"; nodeId: string; itemCount: number; pricePerCall: number; totalAmount: number; token: string; tokenAddress: string; walletAddress: string; chainId: number }
  | { type: "stream_error" };

export interface WorkflowNode extends Record<string, unknown> {
   id: string;
   nodeId: string;
   type: "agent" | "trigger";
   position: { x: number; y: number };
   action: { key: string; label: string; endpoint?: string; x402?: boolean };
   label: string;
   image_url: string | null;
   config: Record<string, unknown>;
}

export interface WorkflowEdge {
   id: string;
   source: string;
   target: string;
}

export interface Workflow {
   id: string;
   name: string;
   description: string;
   published: boolean;
   runs: number;
   canvas: {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      maxExecutionFee?: string | null;
   };
   viewport: { x: number; y: number; zoom: number };
   created_at: string;
   updated_at: string;
}

export interface CreateWorkflowInput {
   name: string;
   description?: string;
}

export interface UpdateWorkflowInput {
   name?: string;
   description?: string;
   canvas?: Workflow["canvas"];
   viewport?: Workflow["viewport"];
}

class WorkflowService extends BaseApiService {
   async getAll(): Promise<Workflow[]> {
      try {
         const res = await this.api.get<{ workflows: Workflow[] }>('/workflows');
         return res.data.workflows;
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async getById(id: string): Promise<Workflow> {
      try {
         const res = await this.api.get<{ workflow: Workflow }>(`/workflows/${id}`);
         return res.data.workflow;
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async create(input: CreateWorkflowInput): Promise<Workflow> {
      try {
         const res = await this.api.post<{ workflow: Workflow }>('/workflows', input);
         return res.data.workflow;
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async update(id: string, input: UpdateWorkflowInput): Promise<Workflow> {
      try {
         const res = await this.api.patch<{ workflow: Workflow }>(`/workflows/${id}`, input);
         return res.data.workflow;
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async remove(id: string): Promise<void> {
      try {
         await this.api.delete(`/workflows/${id}`);
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async run(id: string, maxExecutionFee: string | null): Promise<{ runId: string; budget: BudgetSnapshot }> {
      try {
         const res = await this.api.post<{ runId: string; budget: BudgetSnapshot }>(`/workflows/${id}/run`, { maxExecutionFee });
         return res.data;
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async runBlock(id:string,options:BlockRunOptions,maxExecutionFee:string|null):Promise<{runId:string;budget:BudgetSnapshot;scope:BlockRunScope}>{
      try{
         const {nodeId,...input}=options;
         return (await this.api.post(`/workflows/${encodeURIComponent(id)}/nodes/${encodeURIComponent(nodeId)}/run`,{...input,maxExecutionFee})).data;
      }catch(error){throw this.handleError(error);}
   }

   async stopRun(runId: string): Promise<void> {
      try {
         await this.api.post(`/runs/${runId}/stop`, {});
      } catch {
         // best-effort — run may have already finished
      }
   }

   async submitPayment(runId: string, permit: PermitSignature, nodeId: string): Promise<void> {
      try {
         await this.api.post(`/runs/${runId}/payment`, {
            nodeId,
            callIndex: 0,
            permit: {
               owner:    permit.owner,
               spender:  permit.spender,
               value:    permit.amount.toString(),
               nonce:    permit.nonce.toString(),
               deadline: permit.deadline.toString(),
               v: permit.v,
               r: permit.r,
               s: permit.s,
            },
         });
      } catch (error) {
         throw this.handleError(error);
      }
   }

   async getRuns(workflowId: string): Promise<WorkflowRun[]> {
      try {
         const res = await this.api.get<{ runs: WorkflowRun[] }>(`/workflows/${workflowId}/runs`);
         return res.data.runs;
      } catch {
         return [];
      }
   }

   stream(runId: string, onEvent: (event: RunEvent) => void): () => void {
      const base = (this.api.defaults.baseURL ?? "").replace(/\/$/, "");
      const es = new EventSource(`${base}/runs/${runId}/stream`, { withCredentials: true });

      es.onmessage = (e) => {
         try {
            const event = JSON.parse(e.data) as RunEvent;
            onEvent(event);
            if (event.type === "complete") es.close();
         } catch { /* ignore malformed events */ }
      };

      es.onerror = () => {
         // EventSource reconnects with Last-Event-ID after transient disconnects.
         if(es.readyState===EventSource.CLOSED)onEvent({type:'stream_error'});
      };

      // Return a cleanup function so the caller can close the stream early
      return () => es.close();
   }
}

export const workflowService = new WorkflowService();
