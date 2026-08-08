"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
      data: { label: def?.label ?? n.nodeId, icon: def?.icon ?? "", agentId: n.nodeId },
   };
}

function toWorkflowNode(n: Node): WorkflowNode {
   const data = n.data as { agentId?: string };
   return {
      id: n.id,
      nodeId: data.agentId ?? n.id,
      type: (n.type ?? "agent") as "agent" | "trigger",
      position: n.position,
      config: {},
   };
}

function toWorkflowEdge(e: Edge): WorkflowEdge {
   return { id: e.id, source: e.source, target: e.target };
}

function Canvas({ workflowId }: { workflowId: string }) {
   const savedViewport = useMemo(() => workflowService.loadViewport(workflowId), [workflowId]);

   const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
   const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
   const isReady = useRef(false);

   const nodeTypes = useMemo(() => ({
      agent: AgentNodeComponent,
      trigger: TriggerNodeComponent,
   }), []);
   const edgeTypes = useMemo(() => ({ provance: EditorEdge }), []);
   const { openSheet, configNodeId } = useEditor();

   useLayoutEffect(() => {
      const saved = workflowService.loadCanvas(workflowId);
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
      isReady.current = true;
   }, [workflowId]);

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
