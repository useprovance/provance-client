import { create } from "zustand";
import {
   addEdge,
   applyEdgeChanges,
   applyNodeChanges,
   type Connection,
   type Edge,
   type EdgeChange,
   type Node,
   type NodeChange,
} from "@xyflow/react";
import type { Workflow, WorkflowNode } from "@/services/workflow.service";

const CHOICE_NODE: Node = {
   id: "__choice__",
   type: "choice",
   position: { x: 0, y: 0 },
   data: {},
   draggable: false,
};

function withChoiceSync(nodes: Node[]): Node[] {
   const real = nodes.filter((n) => n.id !== "__choice__");
   const hasChoice = nodes.some((n) => n.id === "__choice__");
   if (real.length === 0 && !hasChoice) return [CHOICE_NODE];
   if (real.length > 0 && hasChoice) return real;
   return nodes;
}

interface EditorStore {
   nodes: Node[];
   edges: Edge[];
   onNodesChange: (changes: NodeChange[]) => void;
   onEdgesChange: (changes: EdgeChange[]) => void;
   onConnect: (connection: Connection) => void;
   initCanvas: (workflow: Workflow) => void;

   isModalOpen: boolean;
   sourceNodeId: string | null;
   openModal: (sourceNodeId?: string | null) => void;
   closeModal: () => void;
   addAgentNode: (
      agent: { agentId: string; label: string; image_url: string | null },
      action: { key: string; label: string; endpoint?: string }
   ) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
   nodes: [CHOICE_NODE],
   edges: [],
   isModalOpen: false,
   sourceNodeId: null,

   onNodesChange: (changes) =>
      set((state) => {
         // Block position/drag changes on the choice node
         const filtered = changes.filter(
            (c) => !(c.type === "position" && "id" in c && c.id === "__choice__")
         );
         return { nodes: applyNodeChanges(filtered, state.nodes) };
      }),

   onEdgesChange: (changes) =>
      set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

   onConnect: (connection) =>
      set((state) => ({ edges: addEdge({ ...connection, type: "provance" }, state.edges) })),

   initCanvas: (workflow) =>
      set({
         nodes: withChoiceSync(
            workflow.canvas.nodes.map((n) => ({
               id: n.id,
               type: n.type,
               position: n.position,
               data: n,
            }))
         ),
         edges: workflow.canvas.edges.map((e) => ({ ...e, type: "provance" })),
      }),

   openModal: (sourceNodeId = null) =>
      set({ isModalOpen: true, sourceNodeId }),

   closeModal: () =>
      set({ isModalOpen: false, sourceNodeId: null }),

   addAgentNode: (agent, action) => {
      const { nodes, edges, sourceNodeId } = get();
      const newId = crypto.randomUUID();

      const realNodes = nodes.filter((n) => n.id !== "__choice__");
      const sourceNode = sourceNodeId ? realNodes.find((n) => n.id === sourceNodeId) : null;
      const position = sourceNode
         ? { x: sourceNode.position.x + 280, y: sourceNode.position.y }
         : { x: 100 + realNodes.length * 60, y: 200 };

      const newNode: Node<WorkflowNode> = {
         id: newId,
         type: "agent",
         position,
         data: {
            id: newId,
            nodeId: agent.agentId,
            type: "agent",
            position,
            action,
            label: agent.label,
            image_url: agent.image_url,
            config: {},
         },
      };

      const newEdges = sourceNodeId
         ? [...edges, { id: `e-${sourceNodeId}-${newId}`, source: sourceNodeId, target: newId, type: "provance" }]
         : edges;

      // Remove choice node and add real node, then re-sync
      const updatedNodes = withChoiceSync([...realNodes, newNode]);
      set({ nodes: updatedNodes, edges: newEdges, isModalOpen: false, sourceNodeId: null });
   },
}));
