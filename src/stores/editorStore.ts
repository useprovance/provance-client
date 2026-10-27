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
import type { Workflow } from "@/services/workflow.service";

interface EditorStore {
   nodes: Node[];
   edges: Edge[];
   onNodesChange: (changes: NodeChange[]) => void;
   onEdgesChange: (changes: EdgeChange[]) => void;
   onConnect: (connection: Connection) => void;
   initCanvas: (workflow: Workflow) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
   nodes: [],
   edges: [],
   onNodesChange: (changes) =>
      set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
   onEdgesChange: (changes) =>
      set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
   onConnect: (connection) =>
      set((state) => ({ edges: addEdge({ ...connection, type: "provance" }, state.edges) })),
   initCanvas: (workflow) =>
      set({
         nodes: workflow.canvas.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n,
         })),
         edges: workflow.canvas.edges.map((e) => ({ ...e, type: "provance" })),
      }),
}));
