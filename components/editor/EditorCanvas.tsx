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
import { CanvasChoiceNodeComponent } from "./CanvasChoiceNode";
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
   const agent = agentService.getById(n.nodeId);
   const firstAction = agent?.actions?.[0];
   const action = n.action ?? (firstAction ? { key: firstAction.key, label: firstAction.label } : { key: "default", label: "Default" });
   const triggerType = n.type === "trigger" ? (n.config?.__trigger?.type ?? "manual") : undefined;
   return {
      id: n.id,
      type: n.type,
      position: n.position,
      data: { label: def?.label ?? n.nodeId, icon: def?.icon ?? "", agentId: n.nodeId, action, config: n.config ?? {}, ...(triggerType ? { triggerType } : {}) },
   };
}

function toWorkflowNode(n: Node): WorkflowNode {
   const data = n.data as { agentId?: string; action?: { key: string; label: string }; config?: Record<string, Record<string, string>>; triggerType?: string };
   return {
      id: n.id,
      nodeId: data.agentId ?? n.id,
      type: (n.type ?? "agent") as "agent" | "trigger",
      position: n.position,
      action: data.action,
      config: { ...(data.config ?? {}), ...(data.triggerType ? { __trigger: { type: data.triggerType } } : {}) },
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
         minimapTimer.current = setTimeout(() => setMinimapVisible(false), 1000);
      },
   });

   // Read localStorage synchronously so ReactFlow's first render uses the saved viewport — no jump
   const [initialViewport] = useState<Viewport>(
      () => workflowService.loadViewport(workflowId) ?? { x: 400, y: 280, zoom: 1 }
   );

   const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
   const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
   const [canvasReady, setCanvasReady] = useState(false);
   const isReady = useRef(false);

   const nodeTypes = useMemo(() => ({
      agent: AgentNodeComponent,
      trigger: TriggerNodeComponent,
      choice: CanvasChoiceNodeComponent,
   }), []);
   const edgeTypes = useMemo(() => ({ provance: EditorEdge }), []);
   const { openSheet, configNodeId, addRun, registerCanvasActions } = useEditor();

   // Wait for Supabase before showing the canvas — fall back to localStorage if unavailable
   useLayoutEffect(() => {
      const applyCanvas = (saved: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => {
         if (saved.nodes.length > 0 || saved.edges.length > 0) {
            setNodes(saved.nodes.map(toRFNode));
            setEdges(saved.edges.map((e) => ({ ...e, type: "provance" })));
         } else {
            setNodes([{ id: "__choice__", type: "choice", position: { x: 0, y: 0 }, data: {} }]);
         }
      };

      void (async () => {
         const [dbCanvas, dbVp] = await Promise.all([
            workflowService.fetchCanvas(workflowId),
            workflowService.fetchViewport(workflowId),
         ]);

         // Use Supabase data if available, otherwise fall back to localStorage
         const canvas = dbCanvas ?? workflowService.loadCanvas(workflowId);
         applyCanvas(canvas);
         if (dbVp) setViewport(dbVp);

         isReady.current = true;
         setCanvasReady(true);
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

   // Keep choice node in sync: show when no real nodes, hide when real nodes exist
   useEffect(() => {
      const real = nodes.filter((n) => n.id !== "__choice__");
      const hasChoice = nodes.some((n) => n.id === "__choice__");
      if (real.length === 0 && !hasChoice) {
         setNodes([{ id: "__choice__", type: "choice", position: { x: 0, y: 0 }, data: {} }]);
      } else if (real.length > 0 && hasChoice) {
         setNodes((prev) => prev.filter((n) => n.id !== "__choice__"));
      }
   }, [nodes, setNodes]);

   useEffect(() => {
      if (!isReady.current) return;
      const saveable = nodes.filter((n) => n.id !== "__choice__");
      workflowService.saveCanvas(workflowId, saveable.map(toWorkflowNode), edges.map(toWorkflowEdge));
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
         addNode: (agentId: string, actionKey?: string) => {
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
               const resolvedAction = actionKey
                  ? agent?.actions?.find((a) => a.key === actionKey)
                  : agent?.actions?.[0];
               const action = resolvedAction
                  ? { key: resolvedAction.key, label: resolvedAction.label }
                  : { key: "default", label: "Default" };
               const newNode: Node = {
                  id: newId,
                  type: "agent",
                  position,
                  data: { label: agent?.label ?? agentId, icon: agent?.icon ?? "", agentId, action },
               };
               return [...prev.filter((n) => n.id !== "__choice__"), newNode];
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

   if (!canvasReady) {
      return (
         <div className="flex flex-col w-full h-full bg-[oklch(20.46%_0_89.88)]">
            <div className="flex-1 flex items-center justify-center">
               <div className="w-5 h-5 rounded-full border-2 border-sand/20 border-t-sand/60 animate-spin" />
            </div>
            <EditorBottomPanel workflowId={workflowId} />
         </div>
      );
   }

   return (
      <div className="flex flex-col w-full h-full bg-[oklch(20.46%_0_89.88)]">
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
                  style: { stroke: "oklch(42% 0 0)", strokeWidth: 2, strokeLinecap: "square" },
               }}
               snapToGrid
               snapGrid={[20, 20]}
               onMoveEnd={onMoveEnd}
               minZoom={0}
               maxZoom={4}
               defaultViewport={initialViewport}
               proOptions={{ hideAttribution: true }}
               style={{ background: "transparent" }}
            >
               <Background
                  variant={BackgroundVariant.Dots}
                  gap={16}
                  size={1}
                  color="oklch(38.67% 0 89.88)"
               />
               <MiniMap
                  position="bottom-left"
                  pannable
                  zoomable
                  nodeColor="hsl(0,0%,45%)"
                  nodeStrokeColor="transparent"
                  nodeBorderRadius={16}
                  maskColor="rgba(255,255,255,0.05)"
                  style={{
                     background: "hsl(0,0%,13%)",
                     border: "1px solid oklch(100% 0 89.88 / 0.12)",
                     borderRadius: 4,
                     overflow: "hidden",
                     opacity: minimapVisible ? 1 : 0,
                     pointerEvents: minimapVisible ? "auto" : "none",
                     transition: "opacity 0.3s ease",
                     marginBottom: 72,
                     marginLeft: 12,
                     width: 200,
                     height: 120,
                  }}
                  onMouseEnter={() => {
                     if (minimapTimer.current) clearTimeout(minimapTimer.current);
                     setMinimapVisible(true);
                  }}
                  onMouseLeave={() => {
                     minimapTimer.current = setTimeout(() => setMinimapVisible(false), 1000);
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
