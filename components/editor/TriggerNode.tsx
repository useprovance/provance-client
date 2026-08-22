"use client";

import { useRef, useState } from "react";
import {
   Handle,
   Position,
   useEdges,
   useReactFlow,
   type NodeProps,
} from "@xyflow/react";
import { Plus, Zap, FlaskConical, Check, X, Minus } from "lucide-react";
import Image from "next/image";
import { NodeToolbar } from "./NodeToolbar";
import { useEditor } from "./EditorContext";
import type { AgentNode } from "./editor.constants";

const BOX_SIZE = 96;

export function TriggerNodeComponent({ id, selected, data }: NodeProps<AgentNode>) {
   const triggerType = (data as unknown as { triggerType?: string }).triggerType;
   const icon = (data as unknown as { icon?: string }).icon ?? "/icons/agents/trigger.svg";
   const triggerLabel = data.label ?? (triggerType === "schedule" ? "Schedule" : triggerType === "webhook" ? "Webhook" : "Manual");
   const { openSheet, openConfig, flowDirection, triggerRun, isRunning, runningNodeId, nodeStatuses } = useEditor();
   const isNodeRunning = runningNodeId === id;
   const nodeStatus = nodeStatuses[id];
   const isVertical = flowDirection === "vertical";
   const { deleteElements } = useReactFlow();
   const edges = useEdges();
   const hasOutgoing = edges.some((e) => e.source === id);
   const [toolbarVisible, setToolbarVisible] = useState(false);
   const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
         {/* Zap — slides out left on hover */}
         <div
            className="absolute pointer-events-none transition-all duration-200"
            style={{
               left: -28,
               top: BOX_SIZE / 2,
               transform: toolbarVisible ? "translateY(-50%) translateX(-8px)" : "translateY(-50%) translateX(0)",
               opacity: toolbarVisible ? 0 : 1,
            }}
         >
            <Zap size={20} strokeWidth={0} fill="#d95e28" />
         </div>

         {/* Execute button — slides in from left on hover */}
         <button
            onClick={(e) => { e.stopPropagation(); void triggerRun(); }}
            disabled={isRunning}
            className="nodrag absolute flex items-center gap-1.5 px-3 py-1.5 bg-orange text-white text-[11px] font-semibold rounded-sm transition-all duration-200 cursor-pointer hover:bg-orange/90 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
               right: "100%",
               top: BOX_SIZE / 2,
               transform: toolbarVisible ? "translateY(-50%) translateX(-10px)" : "translateY(-50%) translateX(0)",
               opacity: toolbarVisible ? 1 : 0,
               pointerEvents: toolbarVisible ? "auto" : "none",
               marginRight: 8,
            }}
         >
            <FlaskConical size={11} strokeWidth={2} />
            Execute workflow
         </button>

         {/* Box */}
         <div
            onClick={() => openConfig(id)}
            style={{ width: BOX_SIZE, height: BOX_SIZE, borderRadius: "36px 8px 8px 36px", borderWidth: "1.5px" }}
            className={`
          relative flex items-center justify-center
          bg-[hsl(0,0%,17%)] [background-clip:padding-box] transition-shadow cursor-pointer
          border border-[oklch(100%_0_89.88_/_0.2)]
          ${selected ? "shadow-[0_0_0_6px_oklch(100%_0_89.88_/_0.4)]" : ""}
          ${isNodeRunning ? "!border-transparent" : ""}
          ${nodeStatus === "success" ? "!border-[oklch(63.2%_0.186_147.37)] !border-[2px]" : ""}
          ${nodeStatus === "error" ? "!border-[#ef4444] !border-[2px]" : ""}
        `}
         >
            {isNodeRunning && <div className="node-running-border" style={{ borderRadius: "36px 8px 8px 36px" }} />}
            <NodeToolbar
               visible={toolbarVisible || (selected ?? false)}
               onDelete={() => deleteElements({ nodes: [{ id }] })}
               onOpen={() => openConfig(id)}
               onMouseEnter={showToolbar}
               onMouseLeave={hideToolbar}
            />

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

            {/* Only source handle — triggers can only start flows, not receive them */}
            <Handle
               type="source"
               position={isVertical ? Position.Bottom : Position.Right}
               className="!w-4 !h-4 !bg-[hsl(0,0%,17%)] !border !border-[oklch(0.5_0_0)] !rounded-full !transition-[transform,background,border-width] !duration-200 hover:!scale-150 hover:!border-[1.5px] hover:!border-[oklch(88.53%_0_89.88)] hover:!bg-[hsl(0,0%,38%)]"
               style={{ zIndex: 10 }}
            />

            <Image src={icon} alt={triggerLabel} width={48} height={48} className="object-contain opacity-90" />
         </div>

         {/* Label */}
         <p
            className="absolute text-[1rem] font-medium text-white text-center leading-[1.25] pointer-events-none overflow-hidden"
            style={{
               top: "100%",
               marginTop: 8,
               left: "50%",
               transform: "translateX(-50%)",
               minWidth: BOX_SIZE * 2,
               display: "-webkit-box",
               WebkitBoxOrient: "vertical",
               WebkitLineClamp: 2,
            }}
         >
            {triggerLabel}
         </p>

         {/* Plus button */}
         {!hasOutgoing && (
            <div
               className="nodrag absolute flex items-center"
               style={isVertical ? {
                  left: BOX_SIZE / 2,
                  top: BOX_SIZE + 8,
                  transform: "translateX(-50%)",
                  flexDirection: "column",
               } : {
                  top: BOX_SIZE / 2,
                  left: BOX_SIZE + 4,
                  transform: "translateY(-50%)",
               }}
            >
               <div className={isVertical ? "h-[60px] w-[2px] bg-[oklch(42%_0_0)]" : "w-[60px] h-[2px] bg-[oklch(42%_0_0)]"} />
               <button
                  onClick={() => openSheet(id)}
                  className="relative z-10 w-6 h-6 rounded-[4px] bg-[hsl(0,0%,17%)] text-[oklch(90.67%_0_89.88)] hover:bg-[oklch(31.71%_0_89.88)] hover:text-[oklch(95.51%_0_89.88)] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
               >
                  <Plus size={12} strokeWidth={3} />
               </button>
               <Handle
                  type="source"
                  position={isVertical ? Position.Bottom : Position.Right}
                  className="!opacity-0 !w-1 !h-1"
               />
            </div>
         )}
      </div>
   );
}
