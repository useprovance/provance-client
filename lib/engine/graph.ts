import type { WorkflowCanvas, WorkflowNode } from "./types";

export interface GraphNode {
  node: WorkflowNode;
  children: string[];  // node IDs this node connects to
  parents: string[];   // node IDs that connect to this node
}

export type WorkflowGraph = Map<string, GraphNode>;

// Build adjacency map from nodes + edges
export function buildGraph(canvas: WorkflowCanvas): WorkflowGraph {
  const graph: WorkflowGraph = new Map();

  // Init every node
  for (const node of canvas.nodes) {
    graph.set(node.id, { node, children: [], parents: [] });
  }

  // Wire edges
  for (const edge of canvas.edges) {
    const source = graph.get(edge.source);
    const target = graph.get(edge.target);
    if (source) source.children.push(edge.target);
    if (target) target.parents.push(edge.source);
  }

  return graph;
}

// Return nodes in topological order (start → end)
export function topologicalSort(graph: WorkflowGraph): WorkflowNode[] {
  const visited = new Set<string>();
  const result: WorkflowNode[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const entry = graph.get(id);
    if (!entry) return;
    // Visit parents first
    for (const parentId of entry.parents) visit(parentId);
    result.push(entry.node);
  }

  for (const id of graph.keys()) visit(id);

  return result;
}

// Find nodes with no parents — these are the start nodes
export function findStartNodes(graph: WorkflowGraph): WorkflowNode[] {
  return [...graph.values()]
    .filter((g) => g.parents.length === 0)
    .map((g) => g.node);
}
