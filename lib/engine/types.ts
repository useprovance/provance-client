export type NodeStatus = "pending" | "running" | "success" | "error" | "skipped";

export interface PermitSignature {
  owner: string;
  spender: string;
  value: string;      // bigint as decimal string
  deadline: number;
  nonce: number;
  v: number;
  r: string;
  s: string;
}

export interface PaymentContext {
  runId: string;
  /** chainId → signed EIP-2612 permit */
  permitByChain: Record<number, PermitSignature>;
  /** chainId → how many paid calls have been settled so far (mutable) */
  callCountByChain: Record<number, number>;
}

export interface EngineNode {
  id: string;
  nodeId: string;
  type: "agent" | "trigger" | "flow";
  position: { x: number; y: number };
  action?: { key: string; label: string };
  config: Record<string, Record<string, string>>;
}

export interface EngineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface EngineCanvas {
  nodes: EngineNode[];
  edges: EngineEdge[];
}

export interface NodeRunResult {
  nodeId: string;
  label: string;
  status: NodeStatus;
  input: Record<string, unknown>;
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
