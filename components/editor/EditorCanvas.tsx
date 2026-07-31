"use client";

import { useCallback, useMemo } from "react";
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

import { AgentNodeComponent } from "./AgentNode";
import { AddAgentSheet } from "./AddAgentSheet";
import { NodeConfigSheet } from "./NodeConfigSheet";
import { EditorProvider } from "./EditorContext";
import {
   INITIAL_NODES,
   INITIAL_EDGES,
   type AgentEdge,
} from "./editor.constants";

function Canvas() {
   const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
   const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

   const nodeTypes = useMemo(() => ({ agent: AgentNodeComponent }), []);

   const onConnect = useCallback(
      (connection: Connection) =>
         setEdges((eds) => addEdge(connection, eds) as AgentEdge[]),
      [setEdges],
   );

   return (
      <div className="relative w-full h-full bg-[#0f0f0f]">
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
