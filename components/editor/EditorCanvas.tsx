"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
   ReactFlow,
   ReactFlowProvider,
   Background,
   BackgroundVariant,
   Panel,
   addEdge,
   useNodesState,
   useEdgesState,
   type Connection,
   type Node,
   type Edge,
   type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus } from "lucide-react";
import { AgentNodeComponent } from "./AgentNode";
import { AddAgentSheet } from "./AddAgentSheet";
import { NodeConfigSheet } from "./NodeConfigSheet";
import { EditorBottomPanel } from "./EditorBottomPanel";
import { EditorProvider, useEditor } from "./EditorContext";
import { Skeleton } from "@/components/ui/skeleton";

const CANVAS_KEY = (id: string) => `provance_canvas_${id}`;
const VIEWPORT_KEY = (id: string) => `provance_viewport_${id}`;

function readCanvas(workflowId: string): { nodes: Node[]; edges: Edge[] } {
   try {
      const raw = localStorage.getItem(CANVAS_KEY(workflowId));
      if (raw) return JSON.parse(raw);
   } catch {}
   return { nodes: [], edges: [] };
}

function writeCanvas(workflowId: string, nodes: Node[], edges: Edge[]) {
   try {
      localStorage.setItem(CANVAS_KEY(workflowId), JSON.stringify({ nodes, edges }));
   } catch {}
}

function readViewport(workflowId: string): Viewport | null {
   try {
      const raw = localStorage.getItem(VIEWPORT_KEY(workflowId));
      if (raw) return JSON.parse(raw);
   } catch {}
   return null;
}

function writeViewport(workflowId: string, viewport: Viewport) {
   try {
      localStorage.setItem(VIEWPORT_KEY(workflowId), JSON.stringify(viewport));
   } catch {}
}

function Canvas({ workflowId }: { workflowId: string }) {
   const savedViewport = useMemo(() => readViewport(workflowId), [workflowId]);

   const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
   const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
   const [ready, setReady] = useState(false);

   const nodeTypes = useMemo(() => ({ agent: AgentNodeComponent }), []);
   const { openSheet } = useEditor();

   useLayoutEffect(() => {
      const saved = readCanvas(workflowId);
      if (saved.nodes.length > 0 || saved.edges.length > 0) {
         setNodes(saved.nodes);
         setEdges(saved.edges);
      }
      setReady(true);
   }, [workflowId]);

   useEffect(() => {
      if (!ready) return;
      writeCanvas(workflowId, nodes as Node[], edges as Edge[]);
   }, [nodes, edges, workflowId, ready]);

   const onMoveEnd = useCallback((_: unknown, viewport: Viewport) => {
      writeViewport(workflowId, viewport);
   }, [workflowId]);

   const onConnect = useCallback(
      (connection: Connection) =>
         setEdges((eds) => addEdge(connection, eds)),
      [setEdges],
   );

   return (
      <div className="flex flex-col w-full h-full bg-[#0f0f0f]">
         <div className="relative flex-1">
         {!ready && (
            <div className="absolute inset-0 z-20 bg-[#0f0f0f] flex items-center justify-center">
               <Skeleton className="w-16 h-16 rounded-full" />
            </div>
         )}
         <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
               type: "smoothstep",
               style: { stroke: "rgba(227,216,197,0.3)", strokeWidth: 1.5 },
            }}
            snapToGrid
            snapGrid={[20, 20]}
            onMoveEnd={onMoveEnd}
            {...(savedViewport
               ? { defaultViewport: savedViewport }
               : { fitView: true, fitViewOptions: { maxZoom: 1 } }
            )}
            proOptions={{ hideAttribution: true }}
            style={{ background: "transparent" }}
         >
            <Background
               variant={BackgroundVariant.Dots}
               gap={20}
               size={1}
               color="#e3d8c559"
            />
            {nodes.length === 0 && (
               <Panel position="top-center" style={{ top: "50%", transform: "translateY(-50%)", margin: 0 }}>
                  <button
                     onClick={() => openSheet(null)}
                     style={{ cursor: "pointer" }}
                     className="w-9 h-9 rounded-full bg-[#2d2d2d] border border-[#3a3a3a] text-sand/40 hover:border-orange hover:text-orange transition-colors inline-flex items-center justify-center"
                  >
                     <Plus size={16} strokeWidth={2} />
                  </button>
               </Panel>
            )}
         </ReactFlow>
         <AddAgentSheet workflowId={workflowId} />
         <NodeConfigSheet />
         </div>
         <EditorBottomPanel />
      </div>
   );
}

export function EditorCanvas({ workflowId }: { workflowId: string }) {
   return (
      <EditorProvider>
         <ReactFlowProvider>
            <Canvas workflowId={workflowId} />
         </ReactFlowProvider>
      </EditorProvider>
   );
}
