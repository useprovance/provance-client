import { buildGraph, topologicalSort, findStartNodes, getEdgesByTarget } from "./graph";
import { agentService } from "@/services/agent.service";
import type { EngineCanvas, WorkflowRun, NodeRunResult } from "./types";

async function orchestrateInput(
  sourceOutput: Record<string, unknown>,
  targetAgentId: string,
  actionKey?: string
): Promise<Record<string, unknown>> {
  try {
    console.log(`[orchestrator] calling AI to map input for "${targetAgentId}"...`);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/ai/orchestrate`, {
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
// For condition node parents, use the branch context key (true/false).
function buildInputItems(
  parentEdges: { source: string; sourceHandle?: string }[],
  context: Map<string, Record<string, unknown>[]>,
  flowNodes: Set<string>
): Record<string, unknown>[] {
  if (parentEdges.length === 0) return [{}];

  // If ANY condition parent's branch produced no items, the whole node is skipped.
  // This prevents false-branch nodes running when false=0 (even if other parents have data).
  for (const { source, sourceHandle } of parentEdges) {
    if (!flowNodes.has(source)) continue;
    const branch = sourceHandle === "false" ? `${source}/false` : `${source}/true`;
    if ((context.get(branch) ?? []).length === 0) return [];
  }

  const allItems = parentEdges.map(({ source, sourceHandle }) => {
    if (flowNodes.has(source)) {
      const branch = sourceHandle === "false" ? `${source}/false` : `${source}/true`;
      return context.get(branch) ?? [];
    }
    return context.get(source) ?? [{}];
  });

  // If all parents produced empty, this node gets no items
  if (allItems.every((items) => items.length === 0)) return [];

  const maxLen = Math.max(...allItems.map((a) => a.length));

  // Zip all parents: iteration i gets item[i] from each parent (or item[0] if that parent has only 1)
  return Array.from({ length: maxLen }, (_, i) => {
    const merged: Record<string, unknown> = {};
    for (const items of allItems) {
      if (items.length > 0) Object.assign(merged, items[i] ?? items[0]);
    }
    return merged;
  });
}

// Evaluate a condition: left [operator] right
function evaluateCondition(
  left: unknown,
  operator: string,
  right: unknown
): boolean {
  const leftStr = String(left ?? "");
  const rightStr = String(right ?? "");
  const leftNum = Number(left);
  const rightNum = Number(right);
  switch (operator) {
    case "equals": return left === right || leftStr === rightStr;
    case "not_equals": return left !== right && leftStr !== rightStr;
    case "contains": return leftStr.toLowerCase().includes(rightStr.toLowerCase());
    case "not_contains": return !leftStr.toLowerCase().includes(rightStr.toLowerCase());
    case "greater_than": return !isNaN(leftNum) && !isNaN(rightNum) && leftNum > rightNum;
    case "less_than": return !isNaN(leftNum) && !isNaN(rightNum) && leftNum < rightNum;
    case "is_empty": return leftStr === "" || left === null || left === undefined;
    case "is_not_empty": return leftStr !== "" && left !== null && left !== undefined;
    default: return false;
  }
}

export async function executeWorkflow(
  workflowId: string,
  canvas: EngineCanvas,
  onNodeUpdate?: (result: NodeRunResult) => void,
  onNodeStart?: (nodeId: string) => void
): Promise<WorkflowRun> {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const nodeResults: NodeRunResult[] = [];

  // Context stores an array of output items per node.
  // For condition nodes, also stores branch-specific contexts:
  //   context.get(id + "/true") — items that passed the condition
  //   context.get(id + "/false") — items that failed the condition
  const context = new Map<string, Record<string, unknown>[]>();

  const graph = buildGraph(canvas);
  const ordered = topologicalSort(graph);
  const startNodes = new Set(findStartNodes(graph).map((n) => n.id));
  const flowNodes = new Set(canvas.nodes.filter((n) => n.type === "flow").map((n) => n.id));

  let runStatus: WorkflowRun["status"] = "running";
  let runError: string | undefined;

  for (const node of ordered) {
    // Trigger nodes kick off the run but don't call an agent
    if (node.type === "trigger") {
      context.set(node.id, [{}]);
      continue;
    }

    const graphNode = graph.get(node.id)!;
    const isStartNode = startNodes.has(node.id);
    const parentItems = isStartNode ? [{}] : buildInputItems(graphNode.parents, context, flowNodes);

    // Condition node — evaluate branching logic
    if (node.type === "flow") {
      const condConfig = (node.config?.condition ?? {}) as Record<string, string>;
      const leftSource = condConfig.leftSource ?? "";
      const operator = condConfig.operator ?? "equals";
      const rightType = condConfig.rightType ?? "string";
      // Coerce the stored string to the chosen type for accurate comparison
      const rightValue: unknown =
        rightType === "boolean" ? condConfig.rightValue === "true" :
        rightType === "number"  ? Number(condConfig.rightValue ?? "") :
        (condConfig.rightValue ?? "");

      const trueItems: Record<string, unknown>[] = [];
      const falseItems: Record<string, unknown>[] = [];

      for (const item of parentItems) {
        // leftSource is "nodeId::key" — resolve via item
        let leftValue: unknown = undefined;
        if (leftSource.includes("::")) {
          const sep = leftSource.indexOf("::");
          const key = leftSource.slice(sep + 2);
          leftValue = item[key];
        } else if (leftSource) {
          leftValue = item[leftSource];
        }

        if (evaluateCondition(leftValue, operator, rightValue)) {
          trueItems.push(item);
        } else {
          falseItems.push(item);
        }
      }

      context.set(node.id + "/true", trueItems);
      context.set(node.id + "/false", falseItems);
      context.set(node.id, parentItems); // keep full context for display

      const result: NodeRunResult = {
        nodeId: node.id,
        label: "IF",
        status: "success",
        input: parentItems[0] ?? {},
        output: { true: trueItems.length, false: falseItems.length },
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
      };
      nodeResults.push(result);
      onNodeUpdate?.(result);
      continue;
    }

    const agentId = node.nodeId;
    const agentLabel = agentService.getById(agentId)?.label ?? agentId;

    const staticConfig = (node.config?.parameters ?? {}) as Record<string, string>;
    const links = (node.config?.["__links"] ?? {}) as Record<string, string>;
    const staticOverrides = staticConfig;

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
        const hasUpstreamData = Object.keys(item).length > 0;
        const orchestrated = (isStartNode || !hasUpstreamData) ? item : await orchestrateInput(item, agentId, node.action?.key);
        const linkedValues = Object.fromEntries(
          Object.entries(links)
            .map(([field, prefixedKey]) => {
              if (!prefixedKey.includes("::")) return [field, item[prefixedKey]];
              const sep = prefixedKey.indexOf("::");
              const nodeId = prefixedKey.slice(0, sep);
              const key = prefixedKey.slice(sep + 2);
              const ancestorItems = context.get(nodeId);
              const val = ancestorItems
                ? (ancestorItems[itemIndex] ?? ancestorItems[0])?.[key]
                : item[key];
              return [field, val];
            })
            .filter(([, v]) => v !== undefined)
        );
        const merged = { ...orchestrated, ...item, ...linkedValues, ...staticOverrides };

        return Object.fromEntries(
          Object.entries(merged).map(([k, v]) => {
            if (typeof v !== "string" || !v.includes("{{")) return [k, v];
            const resolved = v.replace(/\{\{([^}]+)\}\}/g, (_, ref: string) => {
              if (!ref.includes("::")) {
                const val = item[ref] ?? merged[ref];
                return val !== undefined ? String(val) : "";
              }
              const sep = ref.indexOf("::");
              const nodeId = ref.slice(0, sep);
              const key = ref.slice(sep + 2);
              const nodeCtx = context.get(nodeId);
              const val = nodeCtx ? ((nodeCtx[itemIndex] ?? nodeCtx[0])?.[key] ?? "") : "";
              return String(val);
            });
            return [k, resolved];
          })
        );
      })
    );
    const nodeOutputItems: Record<string, unknown>[] = [];
    let nodeErrored = false;

    onNodeStart?.(node.id);
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
