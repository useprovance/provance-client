import { BaseApiService } from './api.service';

export interface WorkflowNode extends Record<string, unknown> {
   id: string;
   nodeId: string;
   type: "agent" | "trigger";
   position: { x: number; y: number };
   action: { key: string; label: string; endpoint?: string };
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
}

export const workflowService = new WorkflowService();
