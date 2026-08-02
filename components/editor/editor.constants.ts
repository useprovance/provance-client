import type { Node, Edge } from "@xyflow/react";

export type AgentNodeData = {
   label: string;
   icon: string;
   isTrigger?: boolean;
};

export type AgentNode = Node<AgentNodeData, "agent">;
export type AgentEdge = Edge;

export const EDGE_STYLE = { stroke: "rgba(227,216,197,0.3)", strokeWidth: 1.5 };

export const INITIAL_NODES: AgentNode[] = [];
export const INITIAL_EDGES: AgentEdge[] = [];
