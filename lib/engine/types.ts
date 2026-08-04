export type NodeStatus = "pending" | "running" | "success" | "error";

export interface EngineNode {
  id: string;
  nodeId: string;
  type: "agent" | "trigger";
  position: { x: number; y: number };
  config: Record<string, Record<string, string>>;
}

export interface EngineEdge {
  id: string;
  source: string;
  target: string;
}

export interface EngineCanvas {
  nodes: EngineNode[];
  edges: EngineEdge[];
}

export interface NodeRunResult {
  nodeId: string;
  label: string;
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
  status: "running" | "success" | "error";
  startedAt: string;
  finishedAt?: string;
  nodeResults: NodeRunResult[];
  error?: string;
}
