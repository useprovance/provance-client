import { createBrowserClient } from "@supabase/ssr";
import type { WorkflowRun } from "@/lib/engine/types";

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
  level?: "info" | "warn" | "error";
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

const CANVAS_KEY = (id: string) => `provance_canvas_${id}`;
const VIEWPORT_KEY = (id: string) => `provance_viewport_${id}`;
const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export class WorkflowService {
  private logCallback?: (entry: LogEntry) => void;
  private _db: ReturnType<typeof createBrowserClient> | null = null;
  private saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  private get db() {
    if (!this._db) {
      this._db = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
    }
    return this._db;
  }

  // ─── Canvas persistence ────────────────────────────────────────────────────

  loadCanvas(workflowId: string): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
    try {
      const raw = localStorage.getItem(CANVAS_KEY(workflowId));
      if (!raw) return { nodes: [], edges: [] };
      const parsed = JSON.parse(raw);
      const nodes: WorkflowNode[] = (parsed.nodes ?? []).map(
        (n: WorkflowNode & { data?: { agentId?: string } }) => {
          if (n.nodeId) return n;
          return {
            id: n.id,
            nodeId: n.data?.agentId ?? n.id,
            type: (n as { type?: string }).type as "agent" | "trigger" ?? "agent",
            position: n.position,
            config: {},
          };
        }
      );
      const edges: WorkflowEdge[] = (parsed.edges ?? []).map((e: WorkflowEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }));
      return { nodes, edges };
    } catch {}
    return { nodes: [], edges: [] };
  }

  async fetchCanvas(workflowId: string): Promise<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null> {
    if (!isUUID(workflowId)) return null;
    try {
      const { data, error } = await this.db
        .from("workflows")
        .select("canvas")
        .eq("id", workflowId)
        .single();
      if (error || !data?.canvas) return null;
      const canvas = data.canvas as { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
      // Update localStorage cache
      localStorage.setItem(CANVAS_KEY(workflowId), JSON.stringify(canvas));
      return canvas;
    } catch {
      return null;
    }
  }

  saveCanvas(workflowId: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    try {
      localStorage.setItem(CANVAS_KEY(workflowId), JSON.stringify({ nodes, edges }));
      this.debouncedSaveToDb(workflowId, { nodes, edges });
    } catch {}
  }

  // ─── Viewport persistence ──────────────────────────────────────────────────

  loadViewport(workflowId: string): CanvasViewport | null {
    try {
      const raw = localStorage.getItem(VIEWPORT_KEY(workflowId));
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  async fetchViewport(workflowId: string): Promise<CanvasViewport | null> {
    if (!isUUID(workflowId)) return null;
    try {
      const { data, error } = await this.db
        .from("workflows")
        .select("viewport")
        .eq("id", workflowId)
        .single();
      if (error || !data?.viewport) return null;
      const vp = data.viewport as CanvasViewport;
      localStorage.setItem(VIEWPORT_KEY(workflowId), JSON.stringify(vp));
      return vp;
    } catch {
      return null;
    }
  }

  saveViewport(workflowId: string, viewport: CanvasViewport) {
    try {
      localStorage.setItem(VIEWPORT_KEY(workflowId), JSON.stringify(viewport));
    } catch {}
    if (isUUID(workflowId)) {
      void this.db
        .from("workflows")
        .upsert({ id: workflowId, viewport, updated_at: new Date().toISOString() })
        .then(() => {});
    }
  }

  // ─── Canvas mutations (sync, callers don't need to await) ──────────────────

  addNode(workflowId: string, node: WorkflowNode) {
    const canvas = this.loadCanvas(workflowId);
    this.saveCanvas(workflowId, [...canvas.nodes, node], canvas.edges);
  }

  removeNode(workflowId: string, nodeId: string) {
    const canvas = this.loadCanvas(workflowId);
    this.saveCanvas(
      workflowId,
      canvas.nodes.filter((n) => n.id !== nodeId),
      canvas.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
  }

  updateNodePosition(workflowId: string, nodeId: string, position: { x: number; y: number }) {
    const canvas = this.loadCanvas(workflowId);
    this.saveCanvas(
      workflowId,
      canvas.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
      canvas.edges
    );
  }

  addEdge(workflowId: string, edge: WorkflowEdge) {
    const canvas = this.loadCanvas(workflowId);
    this.saveCanvas(workflowId, canvas.nodes, [...canvas.edges, edge]);
  }

  async updateNodeConfig(workflowId: string, nodeId: string, config: Record<string, Record<string, string>>) {
    if (!isUUID(workflowId)) return;
    try {
      const { data } = await this.db.from("workflows").select("canvas").eq("id", workflowId).single();
      if (!data?.canvas) return;
      const canvas = data.canvas as { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
      const nodes = canvas.nodes.map((n) => (n.id === nodeId ? { ...n, config } : n));
      await this.db.from("workflows").update({ canvas: { ...canvas, nodes }, updated_at: new Date().toISOString() }).eq("id", workflowId);
    } catch {}
  }

  // ─── Run history ───────────────────────────────────────────────────────────

  async saveRun(workflowId: string, run: WorkflowRun): Promise<void> {
    if (!isUUID(workflowId)) return;
    try {
      await this.db.from("run_history").upsert({
        id: run.id,
        workflow_id: workflowId,
        status: run.status,
        started_at: run.startedAt,
        finished_at: run.finishedAt ?? null,
        error: run.error ?? null,
        node_results: run.nodeResults,
      });
    } catch {}
  }

  async fetchRuns(workflowId: string): Promise<WorkflowRun[]> {
    if (!isUUID(workflowId)) return [];
    try {
      const { data, error } = await this.db
        .from("run_history")
        .select("id, workflow_id, status, started_at, finished_at, error, node_results")
        .eq("workflow_id", workflowId)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error || !data) return [];
      return data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        workflowId: r.workflow_id as string,
        status: r.status as WorkflowRun["status"],
        startedAt: r.started_at as string,
        finishedAt: (r.finished_at as string | null) ?? undefined,
        error: (r.error as string | null) ?? undefined,
        nodeResults: (r.node_results as WorkflowRun["nodeResults"]) ?? [],
      }));
    } catch {
      return [];
    }
  }

  // ─── Logger ────────────────────────────────────────────────────────────────

  registerLogger(callback: (entry: LogEntry) => void) {
    this.logCallback = callback;
  }

  log(message: string, level: LogEntry["level"] = "info") {
    this.logCallback?.({
      message,
      level,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });
  }

  // ─── Static CRUD ───────────────────────────────────────────────────────────


  // ─── Private helpers ───────────────────────────────────────────────────────

  private debouncedSaveToDb(workflowId: string, canvas: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) {
    if (!isUUID(workflowId)) return;
    if (this.saveTimers[workflowId]) clearTimeout(this.saveTimers[workflowId]);
    this.saveTimers[workflowId] = setTimeout(() => {
      void this.db
        .from("workflows")
        .upsert({ id: workflowId, canvas, updated_at: new Date().toISOString() })
        .then(() => {});
    }, 500);
  }
}

export const workflowService = new WorkflowService();
