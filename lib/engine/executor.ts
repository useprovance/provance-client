import { buildGraph, topologicalSort, findStartNodes } from "./graph";
import { callAgent } from "./agent-registry";
import { agentService } from "@/services/agent.service";
import type { EngineCanvas, WorkflowRun, NodeRunResult } from "./types";

// If an output object contains an array of objects, extract those as individual items.
// DexScreener returns { tokens: [{token_address, chain, ...}] } — we iterate over tokens.
// If no array is found, treat the whole output as a single item.
function extractItems(output: Record<string, unknown>): Record<string, unknown>[] {
  for (const value of Object.values(output)) {
    if (Array.isArray(value) && value.length > 0 && value[0] !== null && typeof value[0] === "object") {
      return value as Record<string, unknown>[];
    }
  }
  return [output];
}

// Build the list of input items for a node by merging its parents' context.
// If any parent produced N items, we run the current node N times (one per item).
// Parents with only 1 item get merged into every iteration as static context.
function buildInputItems(
  parentIds: string[],
  context: Map<string, Record<string, unknown>[]>
): Record<string, unknown>[] {
  if (parentIds.length === 0) return [{}];

  // Find the parent with the most items (the one we iterate over)
  let iterItems: Record<string, unknown>[] = [{}];
  for (const parentId of parentIds) {
    const items = context.get(parentId) ?? [{}];
    if (items.length > iterItems.length) iterItems = items;
  }

  // Merge single-item parents into every iteration
  return iterItems.map((item) => {
    const merged: Record<string, unknown> = { ...item };
    for (const parentId of parentIds) {
      const items = context.get(parentId) ?? [{}];
      if (items.length === 1) Object.assign(merged, items[0]);
    }
    return merged;
  });
}

export async function executeWorkflow(
  workflowId: string,
  canvas: EngineCanvas,
  onNodeUpdate?: (result: NodeRunResult) => void
): Promise<WorkflowRun> {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const nodeResults: NodeRunResult[] = [];

  // Context stores an array of output items per node
  const context = new Map<string, Record<string, unknown>[]>();

  const graph = buildGraph(canvas);
  const ordered = topologicalSort(graph);
  const startNodes = new Set(findStartNodes(graph).map((n) => n.id));

  let runStatus: WorkflowRun["status"] = "running";
  let runError: string | undefined;

  for (const node of ordered) {
    // Trigger nodes kick off the run but don't call an agent
    if (node.type === "trigger") {
      context.set(node.id, [{}]);
      continue;
    }

    const agentId = node.nodeId;
    const agentLabel = agentService.getById(agentId)?.label ?? agentId;
    const graphNode = graph.get(node.id)!;

    // Build the list of inputs — one per iteration
    const inputItems = startNodes.has(node.id)
      ? [{ ...(node.config?.parameters ?? {}) }]
      : buildInputItems(graphNode.parents, context);

    const nodeOutputItems: Record<string, unknown>[] = [];
    let nodeErrored = false;

    for (let i = 0; i < inputItems.length; i++) {
      const input = inputItems[i];
      const nodeStart = new Date().toISOString();
      const t0 = Date.now();
      const iterLabel = inputItems.length > 1 ? `${agentLabel} [${i + 1}/${inputItems.length}]` : agentLabel;

      let result: NodeRunResult;

      try {
        const output = await callAgent(agentId, input);
        nodeOutputItems.push(output);

        result = {
          nodeId: node.id,
          label: iterLabel,
          status: "success",
          output,
          startedAt: nodeStart,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - t0,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        nodeOutputItems.push({});

        result = {
          nodeId: node.id,
          label: iterLabel,
          status: "error",
          output: {},
          error,
          startedAt: nodeStart,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - t0,
        };

        runStatus = "error";
        runError = `"${iterLabel}" failed: ${error}`;
        nodeErrored = true;
        nodeResults.push(result);
        onNodeUpdate?.(result);
        break;
      }

      nodeResults.push(result);
      onNodeUpdate?.(result);
    }

    if (nodeErrored) break;

    // Store extracted items so downstream nodes can iterate
    const extractedItems = nodeOutputItems.flatMap(extractItems);
    context.set(node.id, extractedItems);
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

  saveRun(workflowId, run);
  return run;
}

function saveRun(workflowId: string, run: WorkflowRun) {
  try {
    const key = `provance_runs_${workflowId}`;
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as WorkflowRun[];
    existing.unshift(run);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
  } catch {}
}
