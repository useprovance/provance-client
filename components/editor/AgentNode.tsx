"use client";

import { useEffect, useRef, useState } from "react";
import {
   Handle,
   Position,
   useReactFlow,
   useEdges,
   useUpdateNodeInternals,
   type NodeProps,
} from "@xyflow/react";
import { Plus, Check, X, Minus } from "lucide-react";
import { NodeToolbar } from "./NodeToolbar";
import { useEditor } from "./EditorContext";
import type { AgentNode } from "./editor.constants";
import Image from "next/image";
import { agentService } from "@/services/agent.service";

const BOX_SIZE = 96;

export function AgentNodeComponent({
   id,
   data,
   selected,
}: NodeProps<AgentNode>) {
   const { deleteElements } = useReactFlow();
   const { openSheet, openConfig, flowDirection, runningNodeId, nodeStatuses } = useEditor();
   const isVertical = flowDirection === "vertical";
   const isNodeRunning = runningNodeId === id;
   const nodeStatus = nodeStatuses[id];
   const updateNodeInternals = useUpdateNodeInternals();
   const edges = useEdges();
   const hasOutgoing = edges.some((e) => e.source === id);
   const [toolbarVisible, setToolbarVisible] = useState(false);
   const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

   useEffect(() => {
      updateNodeInternals(id);
   }, [id, updateNodeInternals]);

   const showToolbar = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToolbarVisible(true);
   };

   const hideToolbar = () => {
      hideTimer.current = setTimeout(() => setToolbarVisible(false), 120);
   };

   const agent = agentService.getById(data.agentId);
   const matchedAction = agent?.actions?.find((a) => a.key === data.action?.key);
   const paramFields = matchedAction?.config?.find((c) => c.key === "parameters")?.fields ?? [];
   const nodeConfig = (data as unknown as { config?: Record<string, Record<string, string>> }).config;
   const hasParams = paramFields.length > 0;
   const linkedFields = nodeConfig?.__links ?? {};
   const staticFields = nodeConfig?.parameters ?? {};
   const configuredCount = new Set([...Object.keys(staticFields), ...Object.keys(linkedFields)]).size;
   const isUnconfigured = hasParams && configuredCount === 0;

   return (
      <div
         className="relative"
         style={{ width: BOX_SIZE }}
         onMouseEnter={showToolbar}
         onMouseLeave={hideToolbar}
      >
         {/* Box */}
         <div
            onClick={() => openConfig(id)}
            style={{ width: BOX_SIZE, height: BOX_SIZE, borderWidth: "1.5px" }}
            className={`
               relative flex items-center justify-center rounded-md
               bg-[hsl(0,0%,17%)] [background-clip:padding-box] transition-shadow cursor-pointer
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
               onOpen={() => openConfig(id)}
               onMouseEnter={showToolbar}
               onMouseLeave={hideToolbar}
            />

            <Handle
               type="target"
               position={isVertical ? Position.Top : Position.Left}
               className="!w-4 !h-4 !bg-[hsl(0,0%,17%)] !border !border-[oklch(0.5_0_0)] !rounded-full !transition-[transform,background,border-width] !duration-200 hover:!scale-150 hover:!border-[1.5px] hover:!border-[oklch(88.53%_0_89.88)] hover:!bg-[hsl(0,0%,38%)]"
            />
            <Handle
               type="source"
               position={isVertical ? Position.Bottom : Position.Right}
               className="!w-4 !h-4 !bg-[hsl(0,0%,17%)] !border !border-[oklch(0.5_0_0)] !rounded-full !transition-[transform,background,border-width] !duration-200 hover:!scale-150 hover:!border-[1.5px] hover:!border-[oklch(88.53%_0_89.88)] hover:!bg-[hsl(0,0%,38%)] !z-20"
            />

            <Image
               src={data.icon}
               alt={data.label}
               width={512}
               height={512}
               className="object-contain rounded-sm"
               style={{ width: 48, height: 48 }}
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
            {isUnconfigured && nodeStatus === undefined && (
               <span className="absolute" style={{ bottom: 6, right: 6, lineHeight: 0 }}>
                  <Image src="/icons/node-validation-error.svg" alt="Unconfigured" width={14} height={14} />
               </span>
            )}
         </div>

         {/* Label + subtitle — matches n8n .description block */}
         <div
            className="absolute pointer-events-none text-center"
            style={{
               top: "100%",
               marginTop: 8,
               left: "50%",
               transform: "translateX(-50%)",
               width: "100%",
               minWidth: BOX_SIZE * 2,
            }}
         >
            {/* Label: font-size 1rem, font-weight 500, line-height 1.25, -webkit-line-clamp 2 */}
            <p
               className="text-[1rem] font-medium text-white text-center leading-[1.25] overflow-hidden"
               style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflowWrap: "anywhere",
               }}
            >
               {data.label}
            </p>
            {/* Subtitle: font-size 0.8125rem (13px), font-weight 400, color--text--tint-1 ≈ white/45 */}
            {data.action?.label && (
               <p className="text-[0.8125rem] font-normal text-white/45 text-center leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
                  {data.action.label}
               </p>
            )}
         </div>

         {/* Plus button — only when no outgoing connection */}
         {!hasOutgoing && (
            <div
               className="nodrag absolute flex items-center"
               style={isVertical ? {
                  left: BOX_SIZE / 2,
                  top: BOX_SIZE + 8,
                  transform: "translateX(-50%)",
                  flexDirection: "column",
                  zIndex: 0,
               } : {
                  top: BOX_SIZE / 2,
                  left: BOX_SIZE + 4,
                  transform: "translateY(-50%)",
                  zIndex: 0,
               }}
            >
               <div className={isVertical ? "h-[60px] w-[2px] bg-[oklch(42%_0_0)]" : "w-[60px] h-[2px] bg-[oklch(42%_0_0)]"} />
               <button
                  onClick={() => openSheet(id)}
                  className="w-6 h-6 rounded-[4px] bg-[hsl(0,0%,17%)] text-[oklch(90.67%_0_89.88)] hover:bg-[oklch(31.71%_0_89.88)] hover:text-[oklch(95.51%_0_89.88)] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
               >
                  <Plus size={12} strokeWidth={3} />
               </button>
            </div>
         )}
      </div>
   );
}
