import { useRef, useState } from "react";
import { Handle, Position, useReactFlow, useEdges, type NodeProps, type Node } from "@xyflow/react";
import { Plus, Check, X, Minus } from "lucide-react";
import type { WorkflowNode } from "@/services/workflow.service";
import { useEditorStore } from "@/stores/editor.store";
import { NodeToolbar } from "./NodeToolbar";

const BOX_SIZE = 96;

export function AgentNode({ id, data, selected }: NodeProps<Node<WorkflowNode>>) {
   const openModal = useEditorStore((s) => s.openModal);
   const openConfig = useEditorStore((s) => s.openConfig);
   const runningNodeId = useEditorStore((s) => s.runningNodeId);
   const latestRun = useEditorStore((s) => s.runs[0]);
   const { deleteElements } = useReactFlow();
   const edges = useEdges();
   const hasOutgoing = edges.some((e) => e.source === id);
   const [toolbarVisible, setToolbarVisible] = useState(false);
   const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

   const isNodeRunning = runningNodeId === id;
   const nodeResultsForNode = latestRun?.nodeResults.filter(r => r.nodeId === id) ?? [];
   const nodeStatus = nodeResultsForNode.some(r => r.status === 'error') ? 'error'
      : nodeResultsForNode.some(r => r.status === 'success') ? 'success'
      : nodeResultsForNode.length > 0 ? 'skipped'
      : undefined;

   const showToolbar = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToolbarVisible(true);
   };

   const hideToolbar = () => {
      hideTimer.current = setTimeout(() => setToolbarVisible(false), 120);
   };

   return (
      <div
         className="relative"
         style={{ width: BOX_SIZE }}
         onMouseEnter={showToolbar}
         onMouseLeave={hideToolbar}
      >
         <div
            style={{ width: BOX_SIZE, height: BOX_SIZE, borderWidth: "1.5px" }}
            onClick={() => openConfig(id)}
            className={`
               relative flex items-center justify-center rounded-md cursor-pointer
               bg-[hsl(0,0%,17%)] [background-clip:padding-box] transition-shadow
               border border-[oklch(100%_0_89.88_/_0.2)]
               ${selected ? "shadow-[0_0_0_6px_oklch(100%_0_89.88_/_0.4)]" : ""}
               ${isNodeRunning ? "!border-transparent" : ""}
               ${nodeStatus === "success" ? "!border-[oklch(63.2%_0.186_147.37)] !border-[2px]" : ""}
               ${nodeStatus === "error" ? "!border-[#ef4444] !border-[2px]" : ""}
            `}
         >
            {isNodeRunning && <div className="node-running-border" />}
            <NodeToolbar
               visible={toolbarVisible || (selected ?? false)}
               onDelete={() => deleteElements({ nodes: [{ id }] })}
               onMouseEnter={showToolbar}
               onMouseLeave={hideToolbar}
            />

            <Handle
               type="target"
               position={Position.Left}
               className="!w-4 !h-4 !bg-[hsl(0,0%,17%)] !border !border-[oklch(0.5_0_0)] !rounded-full !transition-[transform,background,border-width] !duration-200 hover:!scale-150 hover:!border-[1.5px] hover:!border-[oklch(88.53%_0_89.88)] hover:!bg-[hsl(0,0%,38%)]"
            />
            <Handle
               type="source"
               position={Position.Right}
               className="!w-4 !h-4 !bg-[hsl(0,0%,17%)] !border !border-[oklch(0.5_0_0)] !rounded-full !transition-[transform,background,border-width] !duration-200 hover:!scale-150 hover:!border-[1.5px] hover:!border-[oklch(88.53%_0_89.88)] hover:!bg-[hsl(0,0%,38%)] !z-20"
            />

            {data.image_url ? (
               <img
                  src={data.image_url}
                  alt={data.label}
                  className="object-contain rounded-sm"
                  style={{ width: 48, height: 48 }}
               />
            ) : (
               <div className="flex items-center justify-center rounded-sm bg-white/8" style={{ width: 48, height: 48 }}>
                  <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest text-center leading-tight px-1">
                     {data.label?.slice(0, 4) ?? "?"}
                  </span>
               </div>
            )}

            {!isNodeRunning && nodeStatus === "success" && (
               <span className="absolute" style={{ bottom: 6, right: 7, lineHeight: 0 }}>
                  <Check size={14} strokeWidth={2.5} color="oklch(63.2% 0.186 147.37)" />
               </span>
            )}
            {!isNodeRunning && nodeStatus === "error" && (
               <span className="absolute" style={{ bottom: 6, right: 7, lineHeight: 0 }}>
                  <X size={14} strokeWidth={2.5} color="#ef4444" />
               </span>
            )}
            {!isNodeRunning && nodeStatus === "skipped" && (
               <span className="absolute" style={{ bottom: 6, right: 7, lineHeight: 0 }}>
                  <Minus size={14} strokeWidth={2.5} color="oklch(50% 0 0)" />
               </span>
            )}
         </div>

         {/* Label + action subtitle */}
         <div
            className="absolute pointer-events-none text-center"
            style={{ top: "100%", marginTop: 8, left: "50%", transform: "translateX(-50%)", minWidth: BOX_SIZE * 2 }}
         >
            <p
               className="text-[1rem] font-medium text-white text-center leading-[1.25] overflow-hidden"
               style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflowWrap: "anywhere" }}
            >
               {data.label ?? data.nodeId}
            </p>
            {data.action?.label && (
               <p className="text-[0.8125rem] font-normal text-white/45 text-center leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
                  {data.action.label}
               </p>
            )}
         </div>

         {/* Plus button — line + square button, only when no outgoing edge */}
         {!hasOutgoing && (
            <div
               className="nodrag absolute flex items-center"
               style={{ top: BOX_SIZE / 2, left: BOX_SIZE + 4, transform: "translateY(-50%)", zIndex: 0 }}
            >
               <div className="w-[60px] h-[2px] bg-[oklch(42%_0_0)]" />
               <button
                  onClick={() => openModal(id)}
                  className="w-6 h-6 rounded-[4px] bg-[hsl(0,0%,17%)] text-[oklch(90.67%_0_89.88)] hover:bg-[oklch(31.71%_0_89.88)] hover:text-[oklch(95.51%_0_89.88)] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
               >
                  <Plus size={12} strokeWidth={3} />
               </button>
            </div>
         )}
      </div>
   );
}
