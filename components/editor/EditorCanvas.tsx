"use client";

import { useCallback, useMemo, useState } from "react";
import {
   ReactFlow,
   ReactFlowProvider,
   Background,
   BackgroundVariant,
   addEdge,
   useNodesState,
   useEdgesState,
   type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, Save } from "lucide-react";

import { AgentNodeComponent } from "./AgentNode";
import { AddAgentSheet } from "./AddAgentSheet";
import { NodeConfigSheet } from "./NodeConfigSheet";
import { EditorBottomPanel } from "./EditorBottomPanel";
import { PublishModal } from "./PublishModal";
import { EditorProvider } from "./EditorContext";
import {
   INITIAL_NODES,
   INITIAL_EDGES,
   type AgentEdge,
} from "./editor.constants";

function Canvas() {
   const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
   const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
   const [publishOpen, setPublishOpen] = useState(false);
   const workflowName = "Untitled Workflow";

   const nodeTypes = useMemo(() => ({ agent: AgentNodeComponent }), []);

   const onConnect = useCallback(
      (connection: Connection) =>
         setEdges((eds) => addEdge(connection, eds) as AgentEdge[]),
      [setEdges],
   );

   return (
      <div className="flex flex-col w-full h-full bg-[#0f0f0f]">
         {/* Editor top bar */}
         <div className="shrink-0 h-11 border-b border-[#1e1e1e] flex items-center justify-between px-4 bg-[#0c0c0c]">
            <span className="text-[13px] text-sand/80">{workflowName}</span>
            <div className="flex items-center gap-2">
               <button
                  className="flex items-center gap-1.5 px-3 h-7 text-[12px] font-medium text-sand/50 hover:text-sand border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors cursor-pointer rounded-sm bg-transparent"
               >
                  <Save size={12} strokeWidth={1.5} />
                  Save
               </button>
               <button
                  className="flex items-center gap-1.5 px-3 h-7 text-[12px] font-medium text-sand/50 hover:text-sand border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors cursor-pointer rounded-sm"
               >
                  <Play size={12} strokeWidth={1.5} />
                  Test
               </button>
               <button
                  onClick={() => setPublishOpen(true)}
                  className="flex items-center gap-1.5 h-7 text-[12px] font-bold text-white bg-orange hover:bg-orange/90 transition-colors cursor-pointer px-4"
                  style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
               >
                  Publish
               </button>
            </div>
         </div>

         <PublishModal
            open={publishOpen}
            onOpenChange={setPublishOpen}
            workflowName={workflowName}
            nodeCount={nodes.length}
         />

         <div className="relative flex-1">
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
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: "transparent" }}
         >
            <Background
               variant={BackgroundVariant.Dots}
               gap={20}
               size={1}
               color="#e3d8c559"
            />
         </ReactFlow>
         <AddAgentSheet />
         <NodeConfigSheet />
         </div>
         <EditorBottomPanel />
      </div>
   );
}

export function EditorCanvas() {
   return (
      <EditorProvider>
         <ReactFlowProvider>
            <Canvas />
         </ReactFlowProvider>
      </EditorProvider>
   );
}
