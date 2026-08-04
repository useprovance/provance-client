import { buildGraph, topologicalSort, findStartNodes } from "./graph";
import { callAgent } from "./agent-registry";
import type { WorkflowCanvas, WorkflowRun, NodeRunResult } from "./types";

// Merges all parent outputs into one flat object as input for the next node
function mergeInputs(
  parentIds: string[],
  context: Map<string, Record<string, unknown>>
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const parentId of parentIds) {
    const output = context.get(parentId);
    if (output) Object.assign(merged, output);
  }
  return merged;
}

export async function executeWorkflow(
  workflowId: string,
  canvas: WorkflowCanvas,
  onNodeUpdate?: (result: NodeRunResult) => void
): Promise<WorkflowRun> {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const nodeResults: NodeRunResult[] = [];

  // Output context — stores each node's output keyed by node ID
  const context = new Map<string, Record<string, unknown>>();

  const graph = buildGraph(canvas);
  const ordered = topologicalSort(graph);
  const startNodes = new Set(findStartNodes(graph).map((n) => n.id));

  let runStatus: WorkflowRun["status"] = "running";
  let runError: string | undefined;

  for (const node of ordered) {
    const agentId = node.data.agentId;
    const nodeStart = new Date().toISOString();
    const t0 = Date.now();

    // If no agentId, skip (UI-only nodes)
    if (!agentId) {
      context.set(node.id, {});
      continue;
    }

    // Gather input: start nodes use their config, others merge parent outputs
    const graphNode = graph.get(node.id)!;
    const input = startNodes.has(node.id)
      ? { ...(node.data.config ?? {}) }
      : mergeInputs(graphNode.parents, context);

    let result: NodeRunResult;

    try {
      const output = await callAgent(agentId, input);
      context.set(node.id, output);

      result = {
        nodeId: node.id,
        status: "success",
        output,
        startedAt: nodeStart,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - t0,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      context.set(node.id, {});

      result = {
        nodeId: node.id,
        status: "error",
        output: {},
        error,
        startedAt: nodeStart,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - t0,
      };

      runStatus = "error";
      runError = `Node "${node.data.label}" failed: ${error}`;
      nodeResults.push(result);
      onNodeUpdate?.(result);
      break; // stop execution on error
    }

    nodeResults.push(result);
    onNodeUpdate?.(result);
  }

  if (runStatus === "running") runStatus = "success";

  const run: WorkflowRun = {
    id: runId,
    workflowId,
    status: runStatus,
    startedAt,
    finishedAt: new Date().toISOString(),
    nodeResults,
    error: runError,
  };

  // Persist to localStorage
  saveRun(workflowId, run);

  return run;
}

function saveRun(workflowId: string, run: WorkflowRun) {
  try {
    const key = `provance_runs_${workflowId}`;
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as WorkflowRun[];
    existing.unshift(run); // newest first
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50))); // keep last 50
  } catch {}
}
