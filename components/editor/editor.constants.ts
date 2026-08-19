import type { Node, Edge } from "@xyflow/react";
import type { NodeConfig } from "@/services/agent.service";

export interface NodeDef {
   id: string;
   nodeType: "trigger";
   label: string;
   icon: string;
   config: NodeConfig[];
}

export const NODES: NodeDef[] = [
   {
      id: "trigger",
      nodeType: "trigger",
      label: "Workflow Trigger",
      icon: "/icons/agents/trigger.svg",
      config: [
         {
            key: "settings",
            label: "Settings",
            fields: [
               { key: "retries", label: "Retry on failure", type: "select", options: ["No retry", "1 retry", "3 retries", "5 retries"] },
               { key: "timeout", label: "Timeout (seconds)", type: "number", placeholder: "30" },
               { key: "notes", label: "Notes", type: "textarea", placeholder: "Add notes about this node..." },
            ],
         },
      ],
   },
];

export type AgentNodeData = {
   label: string;
   icon: string;
   agentId: string;
   action: { key: string; label: string };
};

export type AgentNode = Node<AgentNodeData, "agent">;
export type AgentEdge = Edge;

export const EDGE_STYLE = { stroke: "rgba(227,216,197,0.3)", strokeWidth: 1.5 };

export const INITIAL_NODES: AgentNode[] = [];
export const INITIAL_EDGES: AgentEdge[] = [];
