import { buildGraph, topologicalSort, findStartNodes } from "./graph";
import { agentService } from "@/services/agent.service";
import type { EngineCanvas, WorkflowRun, NodeRunResult } from "./types";

async function orchestrateInput(
  sourceOutput: Record<string, unknown>,
  targetAgentId: string,
  actionKey?: string
): Promise<Record<string, unknown>> {
  try {
    console.log(`[orchestrator] calling AI to map input for "${targetAgentId}"...`);
    const res = await fetch("/api/ai/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceOutput, targetAgentId, actionKey }),
    });
    const json = await res.json() as { success: boolean; data: Record<string, unknown> };
    if (json.success) {
      console.log(`[orchestrator] "${targetAgentId}" mapped input:`, json.data);
      return json.data;
    }
    console.warn(`[orchestrator] AI mapping failed for "${targetAgentId}", using raw output`);
  } catch (err) {
    console.error(`[orchestrator] error for "${targetAgentId}":`, err);
  }
  return sourceOutput;
}

// Determine whether an output is a collection wrapper (like DexScreener { tokens: [...] })
// or a single entity result (like GoPlus { token_address, risk_flags: [], ... }).
// Heuristic: if the output has 4+ non-array fields it is an entity — always one item.
// If it has fewer, it is a wrapper — iterate over the first object array, or return [] if empty.
function extractItems(output: Record<string, unknown>): Record<string, unknown>[] {
  const values = Object.values(output);
  const nonArrayCount = values.filter((v) => !Array.isArray(v)).length;

  if (nonArrayCount >= 4) return [output]; // entity result

  for (const value of values) {
    if (!Array.isArray(value)) continue;
    if (value.length === 0) return []; // wrapper with empty list = nothing to pass downstream
    if (value[0] !== null && typeof value[0] === "object") return value as Record<string, unknown>[];
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

  const allItems = parentIds.map((id) => context.get(id) ?? [{}]);
  const maxLen = Math.max(...allItems.map((a) => a.length));

  // Zip all parents: iteration i gets item[i] from each parent (or item[0] if that parent has only 1)
  return Array.from({ length: maxLen }, (_, i) => {
    const merged: Record<string, unknown> = {};
    for (const items of allItems) {
      Object.assign(merged, items[i] ?? items[0]);
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

    const staticConfig = (node.config?.parameters ?? {}) as Record<string, string>;
    const links = (node.config?.["__links"] ?? {}) as Record<string, string>;

    // Static config always wins — if a field is set manually it overrides any link
    const staticOverrides = staticConfig;

    const isStartNode = startNodes.has(node.id);
    const parentItems = isStartNode ? [{}] : buildInputItems(graphNode.parents, context);

    if (parentItems.length === 0) {
      const skipped: NodeRunResult = {
        nodeId: node.id,
        label: agentLabel,
        status: "skipped",
        input: {},
        output: {},
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
      };
      nodeResults.push(skipped);
      onNodeUpdate?.(skipped);
      context.set(node.id, []);
      continue;
    }

    const resolvedItems = await Promise.all(
      parentItems.map(async (item, itemIndex) => {
        const orchestrated = isStartNode ? item : await orchestrateInput(item, agentId, node.action?.key);
        // Linked fields: format is "nodeId::outputKey"
        // Pull the value directly from that specific ancestor's stored context output
        const linkedValues = Object.fromEntries(
          Object.entries(links)
            .map(([field, prefixedKey]) => {
              if (!prefixedKey.includes("::")) return [field, item[prefixedKey]];
              const sep = prefixedKey.indexOf("::");
              const nodeId = prefixedKey.slice(0, sep);
              const key = prefixedKey.slice(sep + 2);
              // Look up from exact ancestor context first, fall back to merged item
              const ancestorItems = context.get(nodeId);
              const val = ancestorItems
                ? (ancestorItems[itemIndex] ?? ancestorItems[0])?.[key]
                : item[key];
              return [field, val];
            })
            .filter(([, v]) => v !== undefined)
        );
        const merged = { ...item, ...orchestrated, ...linkedValues, ...staticOverrides };

        // Resolve {{nodeId::outputKey}} in string values using the full context map
        return Object.fromEntries(
          Object.entries(merged).map(([k, v]) => {
            if (typeof v !== "string" || !v.includes("{{")) return [k, v];
            const resolved = v.replace(/\{\{([^}]+)\}\}/g, (_, ref: string) => {
              if (!ref.includes("::")) {
                // bare {{key}} — look up from the merged input directly
                const val = merged[ref];
                return val !== undefined ? String(val) : "";
              }
              const sep = ref.indexOf("::");
              const nodeId = ref.slice(0, sep);
              const key = ref.slice(sep + 2);
              const nodeCtx = context.get(nodeId);
              const val = nodeCtx ? (nodeCtx[0]?.[key] ?? "") : "";
              return String(val);
            });
            return [k, resolved];
          })
        );
      })
    );
    const nodeOutputItems: Record<string, unknown>[] = [];
    let nodeErrored = false;

    for (let i = 0; i < resolvedItems.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 1000));
      const input = resolvedItems[i];
      const nodeStart = new Date().toISOString();
      const t0 = Date.now();
      const iterLabel = resolvedItems.length > 1 ? `${agentLabel} [${i + 1}/${resolvedItems.length}]` : agentLabel;

      let result: NodeRunResult;

      try {
        const output = await agentService.run(agentId, node.action?.key, input);
        nodeOutputItems.push(output);

        result = {
          nodeId: node.id,
          label: iterLabel,
          status: "success",
          input,
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
          input,
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

    // Store output merged with inherited parent data so all ancestor fields
    // accumulate and stay available to every downstream node
    const extractedItems = nodeOutputItems.flatMap((output, idx) => {
      const inherited = parentItems[idx] ?? parentItems[0] ?? {};
      return extractItems({ ...inherited, ...output });
    });
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
