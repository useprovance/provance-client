import { useRef, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";

const HIDE_DELAY = 600;

export function EditorEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
   const [hovered, setHovered] = useState(false);
   const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
   const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
   const { deleteElements } = useReactFlow();

   const edgeColor = hovered ? "oklch(62% 0 0)" : "oklch(42% 0 0)";

   const showToolbar = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setHovered(true);
   };

   const hideToolbar = () => {
      hideTimer.current = setTimeout(() => setHovered(false), HIDE_DELAY);
   };

   return (
      <>
         <defs>
            <marker
               id={`arrow-${id}`}
               viewBox="-10 -10 20 20"
               refX="0" refY="0"
               markerWidth="12.5" markerHeight="12.5"
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
               stroke: edgeColor,
               strokeWidth: 2,
               strokeLinecap: "square",
               transition: "stroke 0.2s ease",
            }}
         />

         {/* Wide invisible hit area */}
         <path
            d={edgePath}
            stroke="transparent"
            strokeWidth={40}
            fill="none"
            onMouseEnter={showToolbar}
            onMouseLeave={hideToolbar}
         />

         <EdgeLabelRenderer>
            <div
               className="nodrag nopan absolute flex items-center"
               style={{
                  transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                  pointerEvents: "all",
                  padding: 8,
               }}
               onMouseEnter={showToolbar}
               onMouseLeave={hideToolbar}
            >
               {hovered && (
                  <button
                     onClick={() => void deleteElements({ edges: [{ id }] })}
                     className="w-7 h-7 rounded-[4px] cursor-pointer flex items-center justify-center bg-[hsl(0,0%,17%)] hover:bg-[oklch(31.71%_0_89.88)] text-[oklch(90.67%_0_89.88)] hover:text-[oklch(95.51%_0_89.88)] shadow-[inset_0_0_0_1px_oklch(100%_0_89.88_/_0.1)] transition-all duration-150"
                  >
                     <Trash2 size={13} strokeWidth={2} />
                  </button>
               )}
            </div>
         </EdgeLabelRenderer>
      </>
   );
}
