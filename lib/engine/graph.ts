import type { EngineCanvas, EngineNode } from "./types";

export interface GraphNode {
  node: EngineNode;
  children: string[];
  parents: string[];
}

export type WorkflowGraph = Map<string, GraphNode>;

export function buildGraph(canvas: EngineCanvas): WorkflowGraph {
  const graph: WorkflowGraph = new Map();

  for (const node of canvas.nodes) {
    graph.set(node.id, { node, children: [], parents: [] });
  }

  for (const edge of canvas.edges) {
    const source = graph.get(edge.source);
    const target = graph.get(edge.target);
    if (source) source.children.push(edge.target);
    if (target) target.parents.push(edge.source);
  }

  return graph;
}

export function topologicalSort(graph: WorkflowGraph): EngineNode[] {
  const visited = new Set<string>();
  const result: EngineNode[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const entry = graph.get(id);
    if (!entry) return;
    for (const parentId of entry.parents) visit(parentId);
    result.push(entry.node);
  }

  for (const id of graph.keys()) visit(id);

  return result;
}

export function findStartNodes(graph: WorkflowGraph): EngineNode[] {
  return [...graph.values()]
    .filter((g) => g.parents.length === 0)
    .map((g) => g.node);
}
