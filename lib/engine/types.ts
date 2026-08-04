export type NodeStatus = "pending" | "running" | "success" | "error" | "skipped";

export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    icon: string;
    agentId?: string;
    config?: Record<string, unknown>;
  };
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowCanvas {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface NodeRunResult {
  nodeId: string;
  status: NodeStatus;
  output: Record<string, unknown>;
  error?: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: "running" | "success" | "error" | "cancelled";
  startedAt: string;
  finishedAt?: string;
  nodeResults: NodeRunResult[];
  error?: string;
}
