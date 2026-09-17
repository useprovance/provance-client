"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, DollarSign, type LucideIcon } from "lucide-react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react";
import { useEditor } from "./EditorContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { agentService } from "@/services/agent.service";

const HIDE_DELAY = 600;

function EdgeButton({ icon: Icon, tooltip, onClick }: { icon: LucideIcon; tooltip: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="
            w-7 h-7 rounded-[4px] border-none cursor-pointer
            flex items-center justify-center
            bg-[hsl(0,0%,17%)] hover:bg-[oklch(31.71%_0_89.88)]
            text-[oklch(90.67%_0_89.88)] hover:text-[oklch(95.51%_0_89.88)]
            shadow-[inset_0_0_0_1px_oklch(100%_0_89.88_/_0.1),_0_1px_3px_-1px_oklch(0%_0_0_/_0.1)]
            transition-all duration-150
          "
        >
          <Icon size={14} strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function EditorEdge({
  id, source, target,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const { deleteElements, getNode } = useReactFlow();
  const { openSheet, nodeStatuses } = useEditor();
  const isSuccess = nodeStatuses[source] === "success";
  const edgeColor = isSuccess ? "oklch(63.2% 0.186 147.37)" : hovered ? "oklch(62% 0 0)" : "oklch(42% 0 0)";

  const targetNode = getNode(target);
  const targetData = targetNode?.data as { agentId?: string; action?: { key?: string } } | undefined;
  const actionPrice = (() => {
    if (!targetData?.agentId) return undefined;
    const agent = agentService.getById(targetData.agentId);
    if (!agent || !targetData.action?.key) return undefined;
    return agent.actions?.find((a) => a.key === targetData.action?.key)?.price;
  })();

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
            strokeLinecap="round" strokeLinejoin="round"
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

      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={40}
        fill="none"
        onMouseEnter={showToolbar}
        onMouseLeave={hideToolbar}
      />

      <EdgeLabelRenderer>
        {actionPrice !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="nodrag nopan absolute"
                  style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "all" }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: "oklch(28% 0 0)",
                      border: "1.5px solid oklch(62% 0 0)",
                      color: "oklch(88% 0 0)",
                    }}
                  >
                    <DollarSign size={10} strokeWidth={2.5} />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">${actionPrice} per call</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div
          className="nodrag nopan absolute flex items-center"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            gap: 8,
            padding: 8,
          }}
          onMouseEnter={showToolbar}
          onMouseLeave={hideToolbar}
        >
          {hovered && (
            <TooltipProvider>
              <EdgeButton icon={Plus} tooltip="Add node" onClick={() => openSheet(source)} />
              <EdgeButton icon={Trash2} tooltip="Delete connection" onClick={() => void deleteElements({ edges: [{ id }] })} />
            </TooltipProvider>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
