"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react";
import { useEditor } from "./EditorContext";

export function EditorEdge({
  id, source,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const { deleteElements } = useReactFlow();
  const { openSheet } = useEditor();

  return (
    <>
      <BaseEdge
        path={edgePath}
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
              <button
                onClick={() => openSheet(source)}
                className="w-7 h-7 flex items-center justify-center bg-[#1e1e1e] border border-[#333] hover:border-orange/50 hover:bg-[#2a2a2a] text-sand/70 hover:text-sand transition-colors cursor-pointer rounded-sm shadow-lg"
                title="Add agent"
              >
                <Plus size={13} strokeWidth={2} />
              </button>
              <button
                onClick={() => void deleteElements({ edges: [{ id }] })}
                className="w-7 h-7 flex items-center justify-center bg-[#1e1e1e] border border-[#333] hover:border-red-500/50 hover:bg-[#2a2a2a] text-sand/70 hover:text-red-400 transition-colors cursor-pointer rounded-sm shadow-lg"
                title="Delete connection"
              >
                <Trash2 size={12} strokeWidth={1.8} />
              </button>
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
