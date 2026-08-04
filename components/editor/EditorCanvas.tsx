"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
   ReactFlow,
   ReactFlowProvider,
   Background,
   BackgroundVariant,
   addEdge,
   useNodesState,
   useEdgesState,
   type Connection,
   type Node,
   type Edge,
   type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNodeComponent } from "./AgentNode";
import { TriggerNodeComponent } from "./TriggerNode";
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

   const nodeTypes = useMemo(() => ({
      agent: AgentNodeComponent,
      trigger: TriggerNodeComponent,
   }), []);
   const { openSheet } = useEditor();

   useLayoutEffect(() => {
      const saved = readCanvas(workflowId);
      if (saved.nodes.length > 0 || saved.edges.length > 0) {
         setNodes(saved.nodes);
         setEdges(saved.edges);
      } else {
         setNodes([{
            id: "trigger",
            type: "trigger",
            position: { x: 100, y: 100 },
            data: { label: "Workflow Trigger", icon: "/icons/agents/trigger.svg", agentId: "trigger" },
         }]);
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
            maxZoom={3}
            defaultViewport={savedViewport ?? { x: 400, y: 280, zoom: 1 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: "transparent" }}
         >
            <Background
               variant={BackgroundVariant.Dots}
               gap={20}
               size={1}
               color="#e3d8c540"
            />
         </ReactFlow>
         <AddAgentSheet workflowId={workflowId} />
         <NodeConfigSheet />
         </div>
         <EditorBottomPanel workflowId={workflowId} />
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
