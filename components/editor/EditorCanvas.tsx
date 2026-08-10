"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
   ReactFlow,
   ReactFlowProvider,
   Background,
   BackgroundVariant,
   MiniMap,
   addEdge,
   useNodesState,
   useEdgesState,
   useReactFlow,
   useOnViewportChange,
   type Connection,
   type Node,
   type Edge,
   type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNodeComponent } from "./AgentNode";
import { TriggerNodeComponent } from "./TriggerNode";
import { EditorEdge } from "./EditorEdge";
import { AddAgentSheet } from "./AddAgentSheet";
import { NodeConfigSheet } from "./NodeConfigSheet";
import { EditorBottomPanel } from "./EditorBottomPanel";
import { EditorProvider, useEditor } from "./EditorContext";
import { workflowService, type WorkflowNode, type WorkflowEdge } from "@/services/workflow.service";
import { agentService } from "@/services/agent.service";
import { NODES } from "./editor.constants";

function toRFNode(n: WorkflowNode): Node {
   const def = agentService.getById(n.nodeId) ?? NODES.find((nd) => nd.id === n.nodeId);
   return {
      id: n.id,
      type: n.type,
      position: n.position,
      data: { label: def?.label ?? n.nodeId, icon: def?.icon ?? "", agentId: n.nodeId, config: n.config ?? {} },
   };
}

function toWorkflowNode(n: Node): WorkflowNode {
   const data = n.data as { agentId?: string; config?: Record<string, Record<string, string>> };
   return {
      id: n.id,
      nodeId: data.agentId ?? n.id,
      type: (n.type ?? "agent") as "agent" | "trigger",
      position: n.position,
      config: data.config ?? {},
   };
}

function toWorkflowEdge(e: Edge): WorkflowEdge {
   return { id: e.id, source: e.source, target: e.target };
}

function Canvas({ workflowId }: { workflowId: string }) {
   const { setViewport } = useReactFlow();
   const [minimapVisible, setMinimapVisible] = useState(false);
   const minimapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

   useOnViewportChange({
      onStart: () => {
         if (minimapTimer.current) clearTimeout(minimapTimer.current);
         setMinimapVisible(true);
      },
      onEnd: () => {
         minimapTimer.current = setTimeout(() => setMinimapVisible(false), 1200);
      },
   });

   // Read localStorage synchronously so ReactFlow's first render uses the saved viewport — no jump
   const [initialViewport] = useState<Viewport>(
      () => workflowService.loadViewport(workflowId) ?? { x: 400, y: 280, zoom: 1 }
   );

   const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
   const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
   const isReady = useRef(false);

   const nodeTypes = useMemo(() => ({
      agent: AgentNodeComponent,
      trigger: TriggerNodeComponent,
   }), []);
   const edgeTypes = useMemo(() => ({ provance: EditorEdge }), []);
   const { openSheet, configNodeId, addRun, registerCanvasActions } = useEditor();

   // Load canvas — check Supabase first, fall back to localStorage
   useLayoutEffect(() => {
      const local = workflowService.loadCanvas(workflowId);

      const applyCanvas = (saved: { nodes: typeof local.nodes; edges: typeof local.edges }) => {
         if (saved.nodes.length > 0 || saved.edges.length > 0) {
            setNodes(saved.nodes.map(toRFNode));
            setEdges(saved.edges.map((e) => ({ ...e, type: "provance" })));
         } else {
            setNodes([{
               id: "trigger",
               type: "trigger",
               position: { x: 100, y: 100 },
               data: { label: "Workflow Trigger", icon: "/icons/agents/trigger.svg", agentId: "trigger" },
            }]);
         }
      };

      // Apply local data immediately for fast paint
      applyCanvas(local);
      isReady.current = true;

      // Hydrate from Supabase in background — refreshes if another device saved newer data
      void (async () => {
         const [dbCanvas, dbVp] = await Promise.all([
            workflowService.fetchCanvas(workflowId),
            workflowService.fetchViewport(workflowId),
         ]);
         if (dbCanvas) applyCanvas(dbCanvas);
         if (dbVp) setViewport(dbVp);
      })();
   }, [workflowId, setViewport]);

   // Load persisted run history from Supabase
   useEffect(() => {
      void (async () => {
         const runs = await workflowService.fetchRuns(workflowId);
         const seen = new Set<string>();
         runs.forEach((r) => { if (!seen.has(r.id)) { seen.add(r.id); addRun(r); } });
      })();
   }, [workflowId, addRun]);

   useEffect(() => {
      if (!isReady.current || nodes.length === 0) return;
      workflowService.saveCanvas(workflowId, nodes.map(toWorkflowNode), edges.map(toWorkflowEdge));
   }, [nodes, edges, workflowId]);

   const onMoveEnd = useCallback((_: unknown, viewport: Viewport) => {
      workflowService.saveViewport(workflowId, viewport);
   }, [workflowId]);

   const onConnect = useCallback(
      (connection: Connection) =>
         setEdges((eds) => addEdge(connection, eds)),
      [setEdges],
   );

   // Register canvas mutation actions for AI tool calling
   useEffect(() => {
      registerCanvasActions({
         addNode: (agentId: string) => {
            const agent = agentService.getById(agentId);
            const newId = crypto.randomUUID();
            setNodes((prev) => {
               const rightmost = prev.reduce<Node | null>(
                  (best, n) => (!best || n.position.x > best.position.x ? n : best),
                  null,
               );
               const position = rightmost
                  ? { x: rightmost.position.x + 200, y: rightmost.position.y }
                  : { x: 100, y: 250 };
               const newNode: Node = {
                  id: newId,
                  type: "agent",
                  position,
                  data: { label: agent?.label ?? agentId, icon: agent?.icon ?? "", agentId },
               };
               return [...prev, newNode];
            });
            return newId;
         },
         connectNodes: (sourceId: string, targetId: string) => {
            const edgeId = `e-${sourceId}-${targetId}`;
            setEdges((prev) => [
               ...prev.filter((e) => e.id !== edgeId),
               { id: edgeId, source: sourceId, target: targetId, type: "provance", style: { stroke: "rgba(160,160,160,0.35)", strokeWidth: 1.5 } },
            ]);
         },
         configureNode: (nodeId: string, params: Record<string, string>, links?: Record<string, string>) => {
            setNodes((prev) => prev.map((n) => {
               if (n.id !== nodeId) return n;
               const existing = (n.data as { config?: Record<string, Record<string, string>> }).config ?? {};
               return {
                  ...n,
                  data: {
                     ...n.data,
                     config: {
                        ...existing,
                        parameters: { ...(existing.parameters ?? {}), ...params },
                        ...(links ? { __links: { ...(existing.__links ?? {}), ...links } } : {}),
                     },
                  },
               };
            }));
         },
         removeNode: (nodeId: string) => {
            setNodes((prev) => prev.filter((n) => n.id !== nodeId));
            setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
         },
      });
   }, [registerCanvasActions, setNodes, setEdges, workflowId]);

   return (
      <div className="flex flex-col w-full h-full bg-[#0f0f0f]">
         <div className="relative flex-1 min-h-0">
            <ReactFlow
               nodes={nodes}
               edges={edges}
               onNodesChange={onNodesChange}
               onEdgesChange={onEdgesChange}
               onConnect={onConnect}
               nodeTypes={nodeTypes}
               edgeTypes={edgeTypes}
               defaultEdgeOptions={{
                  type: "provance",
                  style: { stroke: "rgba(160,160,160,0.35)", strokeWidth: 1.5 },
               }}
               snapToGrid
               snapGrid={[20, 20]}
               onMoveEnd={onMoveEnd}
               maxZoom={3}
               defaultViewport={initialViewport}
               proOptions={{ hideAttribution: true }}
               style={{ background: "transparent" }}
            >
               <Background
                  variant={BackgroundVariant.Dots}
                  gap={16}
                  size={1}
                  color="#e3d8c540"
               />
               <MiniMap
                  position="bottom-left"
                  nodeColor="rgba(180,180,180,0.7)"
                  nodeStrokeColor="transparent"
                  maskColor="rgba(150,150,150,0.6)"
                  style={{
                     background: "#111",
                     border: "1px solid rgba(100,100,100,0.35)",
                     borderRadius: 8,
                     overflow: "hidden",
                     opacity: minimapVisible ? 1 : 0,
                     pointerEvents: minimapVisible ? "auto" : "none",
                     transition: "opacity 0.3s ease",
                     marginBottom: 92,
                     marginLeft: 12,
                     width: 240,
                     height: 120,
                  }}
               />
            </ReactFlow>
            <AddAgentSheet workflowId={workflowId} />
            <NodeConfigSheet key={configNodeId ?? ""} workflowId={workflowId} />
         </div>
         <EditorBottomPanel workflowId={workflowId} />
      </div>
   );
}

export function EditorCanvas({ workflowId }: { workflowId: string }) {
   return (
      <EditorProvider workflowId={workflowId}>
         <ReactFlowProvider>
            <Canvas workflowId={workflowId} />
         </ReactFlowProvider>
      </EditorProvider>
   );
}
