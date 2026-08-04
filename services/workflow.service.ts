export interface Workflow {
  id: string;
  name: string;
  description: string;
  published: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
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
  nodeId: string;
  type: "agent" | "trigger";
  position: { x: number; y: number };
  config: Record<string, Record<string, string>>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}


export interface LogEntry {
  message: string;
  time: string;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

const CANVAS_KEY = (id: string) => `provance_canvas_${id}`;
const VIEWPORT_KEY = (id: string) => `provance_viewport_${id}`;

export class WorkflowService {
  private logCallback?: (entry: LogEntry) => void;

  // Canvas persistence
  loadCanvas(workflowId: string): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
    try {
      const raw = localStorage.getItem(CANVAS_KEY(workflowId));
      if (!raw) return { nodes: [], edges: [] };
      const parsed = JSON.parse(raw);
      // migrate old React Flow format to WorkflowNode format
      const nodes: WorkflowNode[] = (parsed.nodes ?? []).map((n: WorkflowNode & { data?: { agentId?: string } }) => {
        if (n.nodeId) return n;
        return {
          id: n.id,
          nodeId: n.data?.agentId ?? n.id,
          type: (n as { type?: string }).type as "agent" | "trigger" ?? "agent",
          position: n.position,
          config: {},
        };
      });
      const edges: WorkflowEdge[] = (parsed.edges ?? []).map((e: WorkflowEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }));
      return { nodes, edges };
    } catch {}
    return { nodes: [], edges: [] };
  }

  saveCanvas(workflowId: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    try {
      const existing = this.loadCanvas(workflowId);
      const savedConfig = Object.fromEntries(existing.nodes.map((n) => [n.id, n.config]));
      const merged = nodes.map((n) => ({
        ...n,
        config: Object.keys(n.config).length > 0 ? n.config : (savedConfig[n.id] ?? {}),
      }));
      localStorage.setItem(CANVAS_KEY(workflowId), JSON.stringify({ nodes: merged, edges }));
    } catch {}
  }

  loadViewport(workflowId: string): CanvasViewport | null {
    try {
      const raw = localStorage.getItem(VIEWPORT_KEY(workflowId));
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  saveViewport(workflowId: string, viewport: CanvasViewport) {
    try {
      localStorage.setItem(VIEWPORT_KEY(workflowId), JSON.stringify(viewport));
    } catch {}
  }

  addNode(workflowId: string, node: WorkflowNode) {
    const canvas = this.loadCanvas(workflowId);
    this.saveCanvas(workflowId, [...canvas.nodes, node], canvas.edges);
  }

  removeNode(workflowId: string, nodeId: string) {
    const canvas = this.loadCanvas(workflowId);
    this.saveCanvas(
      workflowId,
      canvas.nodes.filter((n) => n.id !== nodeId),
      canvas.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    );
  }

  updateNodePosition(workflowId: string, nodeId: string, position: { x: number; y: number }) {
    const canvas = this.loadCanvas(workflowId);
    const updated = canvas.nodes.map((n) =>
      n.id === nodeId ? { ...n, position } : n
    );
    this.saveCanvas(workflowId, updated, canvas.edges);
  }

  addEdge(workflowId: string, edge: WorkflowEdge) {
    const canvas = this.loadCanvas(workflowId);
    this.saveCanvas(workflowId, canvas.nodes, [...canvas.edges, edge]);
  }

  updateNodeConfig(workflowId: string, nodeId: string, config: Record<string, Record<string, string>>) {
    const canvas = this.loadCanvas(workflowId);
    const updated = canvas.nodes.map((n) =>
      n.id === nodeId ? { ...n, config } : n
    );
    this.saveCanvas(workflowId, updated, canvas.edges);
  }

  registerLogger(callback: (entry: LogEntry) => void) {
    this.logCallback = callback;
  }

  log(message: string) {
    this.logCallback?.({
      message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    });
  }

  static async create(input: CreateWorkflowInput): Promise<Workflow> {
    // TODO: wire to Supabase
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? "",
      published: false,
      nodes: [],
      edges: [],
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
}

export const workflowService = new WorkflowService();
