"use client";

import { useRef, useState, useCallback } from "react";
import {
   Handle,
   Position,
   useEdges,
   useReactFlow,
   type NodeProps,
} from "@xyflow/react";
import { Plus, Zap, FlaskConical } from "lucide-react";
import { CursorClick } from "@/assets/CursorClick";
import { workflowService } from "@/services/workflow.service";
import { executeWorkflow } from "@/lib/engine/executor";
import type { NodeRunResult } from "@/lib/engine/types";
import { NodeToolbar } from "./NodeToolbar";
import { useEditor } from "./EditorContext";
import type { AgentNode } from "./editor.constants";

const BOX_SIZE = 64;

function getErrorHint(error: string): string {
   const e = error.toLowerCase();
   if (e.includes("pair not found")) return "Token has no trading pair indexed yet. It may be too new — wait a few minutes and try again.";
   if (e.includes("required") && e.includes("token_address")) return "token_address is missing. Link the DexScreener chain output to this agent in the node config.";
   if (e.includes("404")) return "API returned 404. The token or pair may not be indexed on this chain yet.";
   if (e.includes("429") || e.includes("rate limit")) return "Rate limit hit. Wait a moment before running again.";
   if (e.includes("econnrefused") || e.includes("fetch failed")) return "Agent server is not running. Start the agent with pnpm dev in its folder.";
   if (e.includes("invalid_type") || e.includes("zod")) return "A required field is missing or has the wrong type. Check the node config and linked fields.";
   if (e.includes("api key") || e.includes("unauthorized") || e.includes("401")) return "Invalid or missing API key. Check your environment variables.";
   if (e.includes("no tokens") || e.includes("total_found: 0")) return "No tokens matched the filters. Try lowering min_liquidity or increasing max_age_hours.";
   return "";
}

export function TriggerNodeComponent({ id, selected }: NodeProps<AgentNode>) {
   const { workflowId, openSheet, openConfig, addRun, flowDirection } = useEditor();
   const isVertical = flowDirection === "vertical";
   const { deleteElements } = useReactFlow();
   const edges = useEdges();
   const hasOutgoing = edges.some((e) => e.source === id);
   const [toolbarVisible, setToolbarVisible] = useState(false);
   const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

   const handleExecute = useCallback(async () => {
      const canvas = workflowService.loadCanvas(workflowId);
      workflowService.log("Starting workflow...", "info");
      try {
         const run = await executeWorkflow(workflowId, canvas, (result: NodeRunResult) => {
            if (result.status === "success") {
               workflowService.log(`✓ ${result.label} — ${result.durationMs}ms`, "info");
            } else {
               const hint = getErrorHint(result.error ?? "");
               workflowService.log(`✗ ${result.label} failed — ${result.error ?? "unknown error"}`, "error");
               if (hint) workflowService.log(`  → ${hint}`, "warn");
            }
         });
         addRun(run);
         void workflowService.saveRun(workflowId, run);
         if (run.status === "success") {
            workflowService.log("Workflow completed. Open the Runs tab to see full output.", "info");
         } else {
            workflowService.log(`Workflow stopped: ${run.error ?? "unknown error"}`, "error");
         }
      } catch (err) {
         workflowService.log(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`, "error");
      }
   }, [workflowId, addRun]);

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
            <Zap size={16} strokeWidth={0} fill="#d95e28" />
         </div>

         {/* Execute button — slides in from left on hover */}
         <button
            onClick={(e) => { e.stopPropagation(); void handleExecute(); }}
            className="nodrag absolute flex items-center gap-1.5 px-3 py-1.5 bg-orange text-white text-[11px] font-semibold rounded-sm transition-all duration-200 cursor-pointer hover:bg-orange/90 whitespace-nowrap"
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
            style={{
               width: BOX_SIZE,
               height: BOX_SIZE,
               borderRadius: "23px 6px 6px 23px",
            }}
            className={`
          relative flex items-center justify-center border
          bg-[#2d2d2d] transition-colors cursor-pointer
          ${toolbarVisible ? "ring-1 ring-orange/30" : ""}
          ${selected ? "border-orange shadow-[0_0_0_1px_#d95e28]" : "border-[#3a3a3a]"}
        `}
         >
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
               className="!opacity-0 !w-1 !h-1 !pointer-events-none"
            />

            <Handle
               type="source"
               position={isVertical ? Position.Bottom : Position.Right}
               className="!w-2.5 !h-2.5 !bg-[#2d2d2d] !border !border-sand/50 !rounded-full"
            />

            <CursorClick size={42} color="#e3d8c5" strokeWidth={1.45} />
         </div>

         {/* Label */}
         <p className="mt-2 text-[11px] font-medium text-sand text-center leading-snug w-25 -translate-x-[18.1px]">
            Workflow Trigger
         </p>

         {/* Plus button */}
         {!hasOutgoing && (
            <div
               className="nodrag absolute flex items-center"
               style={isVertical ? {
                  left: BOX_SIZE / 2,
                  top: BOX_SIZE,
                  transform: "translateX(-50%)",
                  flexDirection: "column",
               } : {
                  top: BOX_SIZE / 2,
                  left: BOX_SIZE,
                  transform: "translateY(-50%)",
               }}
            >
               <div className={isVertical ? "h-6 w-px bg-sand/20" : "w-6 h-px bg-sand/20"} />
               <button
                  onClick={() => openSheet(id)}
                  className="w-5 h-5 rounded-full bg-[#2d2d2d] border border-[#3a3a3a] text-sand/40 hover:border-orange hover:text-orange transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
               >
                  <Plus size={10} strokeWidth={2} />
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
