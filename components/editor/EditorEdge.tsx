"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react";
import { useEditor } from "./EditorContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function EditorEdge({
  id, source,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const { deleteElements } = useReactFlow();
  const { openSheet } = useEditor();

  const arrowColor = hovered ? "#9a8e82" : "#4a4540";

  return (
    <>
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="7"
          markerHeight="11"
          refX="5"
          refY="5.5"
          orient="auto"
        >
          <path
            d="M0,3.0 Q0,0.5 1.5,1.8 L4.8,5.0 Q5.5,5.5 4.8,6.0 L1.5,9.2 Q0,10.5 0,8.0 Z"
            fill={arrowColor}
          />
        </marker>
      </defs>
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#arrow-${id})`}
        style={{
          stroke: hovered ? "rgba(227,216,197,0.7)" : "rgba(227,216,197,0.3)",
          strokeWidth: hovered ? 2 : 1.5,
          transition: "stroke 0.15s, stroke-width 0.15s",
        }}
      />
      {/* Invisible wide path to make hovering easier */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={20}
        fill="none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, position: "absolute", pointerEvents: "all" }}
          className="nodrag nopan flex items-center gap-1"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {hovered && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => openSheet(source)}
                      className="w-5 h-5 flex items-center justify-center bg-[#1e1e1e] border border-[#333]/50 hover:bg-[#2d2d2d] text-sand/70 transition-colors cursor-pointer rounded-[2px] shadow-lg"
                    >
                      <Plus size={10} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Add agent</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => void deleteElements({ edges: [{ id }] })}
                      className="w-5 h-5 flex items-center justify-center bg-[#1e1e1e] border border-[#333]/50 hover:bg-[#2d2d2d] text-sand/70 transition-colors cursor-pointer rounded-[2px] shadow-lg"
                    >
                      <Trash2 size={9} strokeWidth={1.8} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Delete connection</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
