import type { Node, Edge } from "@xyflow/react";
import type { WorkflowNode } from "@/services/workflow.service";

/**
 * getNodeAncestors
 *
 * IN:  nodeId  — the node ID whose ancestors we want
 *      nodes   — all WorkflowNodes in the canvas
 *      edges   — all WorkflowEdges in the canvas
 *
 * OUT: WorkflowNode[] — every ancestor in BFS order (closest first),
 *      triggers excluded
 *
 * Example:
 *   trigger → geckoterminal → goplus
 *   getNodeAncestors("goplus-id", nodes, edges)
 *   → [geckoterminal WorkflowNode]
 */
export function getNodeAncestors(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): WorkflowNode[] {
  const ancestors: WorkflowNode[] = [];
  const visited = new Set<string>();
  const queue: string[] = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const edge of edges.filter((e) => e.target === current)) {
      const parent = nodes.find((n) => n.id === edge.source);
      if (!parent || parent.type === "trigger") continue;

      ancestors.push(parent.data as WorkflowNode);
      queue.push(edge.source);
    }
  }

  return ancestors;
}

const CHOICE_NODE: Node = {
   id: "__choice__",
   type: "choice",
   position: { x: 0, y: 0 },
   data: {},
   draggable: false,
};

export function withChoiceSync(nodes: Node[]): Node[] {
   const real = nodes.filter((n) => n.id !== "__choice__");
   const hasChoice = nodes.some((n) => n.id === "__choice__");
   if (real.length === 0 && !hasChoice) return [CHOICE_NODE];
   if (real.length > 0 && hasChoice) return real;
   return nodes;
}
