"use client";

import { useRef, useState } from "react";
import {
  Handle,
  Position,
  useEdges,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import Image from "next/image";
import { NodeToolbar } from "./NodeToolbar";
import { useEditor } from "./EditorContext";

const BOX_SIZE = 96;
const TRUE_TOP_PCT = 100 / 3;
const FALSE_TOP_PCT = (100 / 3) * 2;
const LABEL_COLOR = "oklch(68.3% 0 89.88)";
const CANVAS_BG = "oklch(20.46% 0 89.88)";
const HANDLE_CLASS =
  "!w-4 !h-4 !bg-[hsl(0,0%,17%)] !border !border-[oklch(0.5_0_0)] !rounded-full " +
  "!transition-[transform,background,border-width] !duration-200 " +
  "hover:!scale-150 hover:!border-[1.5px] hover:!border-[oklch(88.53%_0_89.88)] hover:!bg-[hsl(0,0%,38%)]";

export type FlowNodeData = {
  label: string;
  icon: string;
  agentId: string;
  config?: Record<string, Record<string, string>>;
};

export type FlowNodeType = Node<FlowNodeData, "flow">;

const OPERATOR_LABELS: Record<string, string> = {
  equals: "=",
  not_equals: "≠",
  contains: "contains",
  not_contains: "not contains",
  greater_than: ">",
  less_than: "<",
  is_empty: "is empty",
  is_not_empty: "is not empty",
};

export function FlowNodeComponent({ id, data, selected }: NodeProps<FlowNodeType>) {
  const { deleteElements } = useReactFlow();
  const { openConfig, openSheet } = useEditor();
  const edges = useEdges();
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToolbar = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToolbarVisible(true);
  };
  const hideToolbar = () => {
    hideTimer.current = setTimeout(() => setToolbarVisible(false), 120);
  };

  const hasTrueEdge = edges.some((e) => e.source === id && e.sourceHandle === "true");
  const hasFalseEdge = edges.some((e) => e.source === id && e.sourceHandle === "false");

  const condConfig = (data.config?.condition ?? {}) as Record<string, string>;
  const leftSource = condConfig.leftSource ?? "";
  const operator = condConfig.operator ?? "";
  const rightValue = condConfig.rightValue ?? "";
  const leftKey = leftSource.includes("::") ? leftSource.split("::")[1] : leftSource;
  const hasCondition = leftKey && operator;

  return (
    <div
      className="relative"
      style={{ width: BOX_SIZE }}
      onMouseEnter={showToolbar}
      onMouseLeave={hideToolbar}
    >
      {/* Node box */}
      <div
        onClick={() => openConfig(id)}
        style={{ width: BOX_SIZE, height: BOX_SIZE, borderWidth: "1.5px" }}
        className={`
          relative flex items-center justify-center rounded-md cursor-pointer
          bg-[hsl(0,0%,17%)] [background-clip:padding-box] transition-shadow
          border border-[oklch(100%_0_89.88_/_0.2)]
          ${selected ? "shadow-[0_0_0_6px_oklch(100%_0_89.88_/_0.4)]" : ""}
        `}
      >
        <NodeToolbar
          visible={toolbarVisible || (selected ?? false)}
          onDelete={() => deleteElements({ nodes: [{ id }] })}
          onOpen={() => openConfig(id)}
          onMouseEnter={showToolbar}
          onMouseLeave={hideToolbar}
        />

        <Handle type="target" position={Position.Left} className={HANDLE_CLASS} />

        <Handle
          id="true"
          type="source"
          position={Position.Right}
          style={{ top: `${TRUE_TOP_PCT}%` }}
          className={`${HANDLE_CLASS} !z-20`}
        />

        <Handle
          id="false"
          type="source"
          position={Position.Right}
          style={{ top: `${FALSE_TOP_PCT}%` }}
          className={`${HANDLE_CLASS} !z-20`}
        />

        <Image src="/icons/agents/condition.svg" alt="IF" width={40} height={40} className="object-contain" />
      </div>

      {/* True branch — stub + button when no edge (same pattern as AgentNode), label only when edge exists */}
      {!hasTrueEdge ? (
        <div
          className="nodrag absolute flex items-center"
          style={{ top: `${TRUE_TOP_PCT}%`, left: BOX_SIZE + 4, transform: "translateY(-50%)", zIndex: 0 }}
        >
          <div className="relative w-[60px] h-[2px] bg-[oklch(42%_0_0)]">
            <span
              className="absolute text-[10px] font-medium pointer-events-none px-[2px]"
              style={{ left: 4, top: "50%", transform: "translateY(-50%)", color: LABEL_COLOR, background: CANVAS_BG }}
            >
              true
            </span>
          </div>
          <button
            onClick={() => openSheet(id, "true")}
            className="w-6 h-6 rounded-[4px] bg-[hsl(0,0%,17%)] text-[oklch(90.67%_0_89.88)] hover:bg-[oklch(31.71%_0_89.88)] hover:text-[oklch(95.51%_0_89.88)] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
          >
            <Plus size={12} strokeWidth={3} />
          </button>
        </div>
      ) : (
        <span
          className="nodrag absolute text-[10px] font-medium pointer-events-none px-[2px]"
          style={{ top: `${TRUE_TOP_PCT}%`, left: BOX_SIZE + 12, transform: "translateY(-50%)", color: LABEL_COLOR, background: CANVAS_BG, zIndex: 10 }}
        >
          true
        </span>
      )}

      {/* False branch — same pattern */}
      {!hasFalseEdge ? (
        <div
          className="nodrag absolute flex items-center"
          style={{ top: `${FALSE_TOP_PCT}%`, left: BOX_SIZE + 4, transform: "translateY(-50%)", zIndex: 0 }}
        >
          <div className="relative w-[60px] h-[2px] bg-[oklch(42%_0_0)]">
            <span
              className="absolute text-[10px] font-medium pointer-events-none px-[2px]"
              style={{ left: 4, top: "50%", transform: "translateY(-50%)", color: LABEL_COLOR, background: CANVAS_BG }}
            >
              false
            </span>
          </div>
          <button
            onClick={() => openSheet(id, "false")}
            className="w-6 h-6 rounded-[4px] bg-[hsl(0,0%,17%)] text-[oklch(90.67%_0_89.88)] hover:bg-[oklch(31.71%_0_89.88)] hover:text-[oklch(95.51%_0_89.88)] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
          >
            <Plus size={12} strokeWidth={3} />
          </button>
        </div>
      ) : (
        <span
          className="nodrag absolute text-[10px] font-medium pointer-events-none px-[2px]"
          style={{ top: `${FALSE_TOP_PCT}%`, left: BOX_SIZE + 12, transform: "translateY(-50%)", color: LABEL_COLOR, background: CANVAS_BG, zIndex: 10 }}
        >
          false
        </span>
      )}

      {/* Label below node */}
      <div
        className="absolute pointer-events-none text-center"
        style={{ top: "100%", marginTop: 8, left: "50%", transform: "translateX(-50%)", width: "100%", minWidth: BOX_SIZE * 2 }}
      >
        <p className="text-[1rem] font-medium text-white text-center leading-[1.25]">IF</p>
        {hasCondition && (
          <p className="text-[0.8125rem] font-normal text-white/45 text-center leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
            {leftKey} {OPERATOR_LABELS[operator] ?? operator} {rightValue}
          </p>
        )}
      </div>
    </div>
  );
}
