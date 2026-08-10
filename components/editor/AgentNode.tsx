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
import { Plus } from "lucide-react";
import { NodeToolbar } from "./NodeToolbar";
import { useEditor } from "./EditorContext";
import type { AgentNode } from "./editor.constants";
import Image from "next/image";

const BOX_SIZE = 64;

export function AgentNodeComponent({
   id,
   data,
   selected,
}: NodeProps<AgentNode>) {
   const { deleteElements } = useReactFlow();
   const { openSheet, openConfig, flowDirection } = useEditor();
   const isVertical = flowDirection === "vertical";
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
            style={{ width: BOX_SIZE, height: BOX_SIZE }}
            className={`
               relative flex items-center justify-center rounded-md border
               bg-[#2d2d2d] transition-colors cursor-pointer
               ${toolbarVisible ? "ring-1 ring-sand/20" : ""}
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
               className="!w-2.5 !h-2.5 !bg-[#2d2d2d] !border !border-sand/20 !rounded-full"
            />
            <Handle
               type="source"
               position={isVertical ? Position.Bottom : Position.Right}
               className="!w-2.5 !h-2.5 !bg-[#2d2d2d] !border !border-sand/20 !rounded-full !z-20"
            />

            <Image
               src={data.icon}
               alt={data.label}
               width={28}
               height={28}
               className="object-contain"
            />

         </div>

         {/* Label */}
         <p className="mt-2 text-[11px] font-medium text-sand text-center leading-snug w-25 -translate-x-[18.1px]">
            {data.label}
         </p>

         {/* Plus button — only when no outgoing connection */}
         {!hasOutgoing && (
            <div
               className="nodrag absolute flex items-center"
               style={isVertical ? {
                  left: BOX_SIZE / 2,
                  top: BOX_SIZE,
                  transform: "translateX(-50%)",
                  flexDirection: "column",
                  zIndex: 0,
               } : {
                  top: BOX_SIZE / 2,
                  left: BOX_SIZE,
                  transform: "translateY(-50%)",
                  zIndex: 0,
               }}
            >
               <div className={isVertical ? "h-6 w-px bg-sand/20" : "w-6 h-px bg-sand/20"} />
               <button
                  onClick={() => openSheet(id)}
                  className="w-5 h-5 rounded-full bg-[#2d2d2d] border border-[#3a3a3a] text-sand/40 hover:border-orange hover:text-orange transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
               >
                  <Plus size={10} strokeWidth={2} />
               </button>
            </div>
         )}
      </div>
   );
}
