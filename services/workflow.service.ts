export interface Workflow {
  id: string;
  name: string;
  description: string;
  published: boolean;
  nodeCount: number;
  lastRun: string | null;
  runs: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  published?: boolean;
}

export interface WorkflowNode {
  id: string;
  workflowId: string;
  agentId: string;
  label: string;
  icon: string;
  position: { x: number; y: number };
  createdAt: string;
}

export interface WorkflowEdge {
  id: string;
  workflowId: string;
  source: string;
  target: string;
}

export interface AddNodeInput {
  workflowId: string;
  agentId: string;
  label: string;
  icon: string;
  position: { x: number; y: number };
}

export interface UpdateNodePositionInput {
  nodeId: string;
  position: { x: number; y: number };
}

export class WorkflowService {
  static async create(input: CreateWorkflowInput): Promise<Workflow> {
    // TODO: wire to Supabase
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? "",
      published: false,
      nodeCount: 0,
      lastRun: null,
      runs: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async list(): Promise<Workflow[]> {
    // TODO: wire to Supabase
    return [];
  }

  static async get(id: string): Promise<Workflow | null> {
    // TODO: wire to Supabase
    void id;
    return null;
  }

  static async update(id: string, input: UpdateWorkflowInput): Promise<Workflow | null> {
    // TODO: wire to Supabase
    void id;
    void input;
    return null;
  }

  static async delete(id: string): Promise<void> {
    // TODO: wire to Supabase
    void id;
  }

  static async addNode(input: AddNodeInput): Promise<WorkflowNode> {
    // TODO: wire to Supabase
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      workflowId: input.workflowId,
      agentId: input.agentId,
      label: input.label,
      icon: input.icon,
      position: input.position,
      createdAt: now,
    };
  }

  static async removeNode(nodeId: string): Promise<void> {
    // TODO: wire to Supabase
    void nodeId;
  }

  static async updateNodePosition(input: UpdateNodePositionInput): Promise<void> {
    // TODO: wire to Supabase
    void input;
  }
}
