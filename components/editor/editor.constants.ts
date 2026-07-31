import type { Node, Edge } from "@xyflow/react";

export type AgentNodeData = {
   label: string;
   icon: string;
   isTrigger?: boolean;
};

export type AgentNode = Node<AgentNodeData, "agent">;
export type AgentEdge = Edge;

export const INITIAL_NODES: AgentNode[] = [
   {
      id: "trigger",
      type: "agent",
      position: { x: 400, y: 60 },
      data: { label: "DeFi Protocol Trigger", icon: "/icons/agents/trigger.svg", isTrigger: true },
   },
   {
      id: "defillama",
      type: "agent",
      position: { x: 400, y: 200 },
      data: { label: "DefiLlama Agent", icon: "/icons/agents/defillama.svg" },
   },
   {
      id: "dune",
      type: "agent",
      position: { x: 220, y: 340 },
      data: { label: "Dune Analytics Agent", icon: "/icons/agents/dune.svg" },
   },
   {
      id: "goplus",
      type: "agent",
      position: { x: 580, y: 340 },
      data: { label: "GoPlus Agent", icon: "/icons/agents/goplus.png" },
   },
   {
      id: "openai",
      type: "agent",
      position: { x: 400, y: 480 },
      data: { label: "OpenAI Agent", icon: "/icons/agents/openai.svg" },
   },
   {
      id: "telegram",
      type: "agent",
      position: { x: 400, y: 620 },
      data: { label: "Telegram Agent", icon: "/icons/agents/telegram.svg" },
   },
];

export const EDGE_STYLE = { stroke: "rgba(227,216,197,0.3)", strokeWidth: 1.5 };

export const INITIAL_EDGES: AgentEdge[] = [
   { id: "e-trigger-defillama", source: "trigger", target: "defillama", type: "smoothstep", style: EDGE_STYLE },
   { id: "e-defillama-dune", source: "defillama", target: "dune", type: "smoothstep", style: EDGE_STYLE },
   { id: "e-defillama-goplus", source: "defillama", target: "goplus", type: "smoothstep", style: EDGE_STYLE },
   { id: "e-dune-openai", source: "dune", target: "openai", type: "smoothstep", style: EDGE_STYLE },
   { id: "e-goplus-openai", source: "goplus", target: "openai", type: "smoothstep", style: EDGE_STYLE },
   { id: "e-openai-telegram", source: "openai", target: "telegram", type: "smoothstep", style: EDGE_STYLE },
];
