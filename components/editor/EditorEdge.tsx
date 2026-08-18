"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, MarkerType, useReactFlow, type EdgeProps } from "@xyflow/react";
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

  const strokeColor = hovered ? "oklch(62% 0 0)" : "oklch(42% 0 0)";

  return (
    <>
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="-10 -10 20 20"
          refX="0"
          refY="0"
          markerWidth="12.5"
          markerHeight="12.5"
          markerUnits="strokeWidth"
          orient="auto-start-reverse"
        >
          <polyline
            strokeLinecap="round"
            strokeLinejoin="round"
            points="-5,-4 0,0 -5,4 -5,-4"
            strokeWidth="2"
            stroke="context-stroke"
            fill="context-stroke"
          />
        </marker>
      </defs>
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#arrow-${id})`}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
          strokeLinecap: "square",
          transition: "stroke 0.2s ease",
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
