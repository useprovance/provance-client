"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { EyeOff, Globe, MoreHorizontal, Save, Share2, CheckCircle2, XCircle, Clock, ChevronUp, ChevronDown, ArrowRight, ArrowDown } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PublishModal } from "./PublishModal";
import { AiChatSheet } from "./AiChatSheet";
import { useEditor } from "./EditorContext";
import type { WorkflowRun, NodeRunResult } from "@/lib/engine/types";

type PanelTab = "logs" | "runs";

const TABS: { key: PanelTab; label: string }[] = [
  { key: "logs", label: "Logs" },
  { key: "runs", label: "Runs" },
];

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getErrorHint(error: string): string {
  const e = error.toLowerCase();
  if (e.includes("pair not found")) return "Token has no trading pair indexed yet — it may be too new. Wait a few minutes and try again.";
  if (e.includes("required") && e.includes("token_address")) return "token_address is missing. Link DexScreener's chain output to this agent in the node config sheet.";
  if (e.includes("404")) return "API returned 404. The token or pair may not be indexed on this chain yet.";
  if (e.includes("429") || e.includes("rate limit")) return "Rate limit hit. Wait a moment before running again.";
  if (e.includes("econnrefused") || e.includes("fetch failed")) return "Agent server is offline. Start it with pnpm dev in its agent folder.";
  if (e.includes("invalid_type") || e.includes("zod")) return "A required field is missing or the wrong type. Check the node config and linked fields.";
  if (e.includes("api key") || e.includes("unauthorized") || e.includes("401")) return "Invalid or missing API key. Check your environment variables.";
  return "";
}

function NodeResultRow({ result, label }: { result: NodeRunResult; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const hint = result.error ? getErrorHint(result.error) : "";

  return (
    <div className="border-b border-[#1e1e1e] last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/3 transition-colors cursor-pointer text-left"
      >
        {result.status === "success" ? (
          <CheckCircle2 size={13} className="text-green-500 shrink-0" />
        ) : (
          <XCircle size={13} className="text-red-400 shrink-0" />
        )}
        <span className={`flex-1 text-[12px] truncate ${result.status === "error" ? "text-red-400" : "text-sand"}`}>
          {label}
        </span>
        <span className="text-[11px] text-sand/60 shrink-0 flex items-center gap-1">
          <Clock size={10} />
          {formatDuration(result.durationMs)}
        </span>
        <span className="text-[11px] text-sand/50 shrink-0">{formatTime(result.startedAt)}</span>
      </button>

      {/* Inline error — visible without expanding */}
      {result.error && !expanded && (
        <div className="px-4 pb-2.5 -mt-0.5 flex flex-col gap-1">
          <p className="text-[11px] text-red-400 font-mono leading-relaxed">{result.error}</p>
          {hint && <p className="text-[11px] text-amber-400/80 leading-relaxed">→ {hint}</p>}
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-3 flex flex-col gap-3">
          {result.error && (
            <div className="flex flex-col gap-1 p-2.5 rounded bg-red-500/8 border border-red-500/20">
              <p className="text-[11px] text-red-400 font-mono leading-relaxed">{result.error}</p>
              {hint && <p className="text-[11px] text-amber-400/80 leading-relaxed mt-0.5">→ {hint}</p>}
            </div>
          )}
          <div>
            <p className="text-[10px] text-sand/40 uppercase tracking-wider mb-1">Input</p>
            <pre className="text-[10px] text-sand/70 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(result.input, null, 2)}
            </pre>
          </div>
          {!result.error && (
            <div>
              <p className="text-[10px] text-sand/40 uppercase tracking-wider mb-1">Output</p>
              <pre className="text-[10px] text-sand/80 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunHistoryRow({ run, nodeLabels }: { run: WorkflowRun; nodeLabels: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[#1e1e1e] last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/3 transition-colors cursor-pointer text-left"
      >
        {run.status === "success" ? (
          <CheckCircle2 size={13} className="text-green-500 shrink-0" />
        ) : (
          <XCircle size={13} className="text-red-400 shrink-0" />
        )}
        <span className="flex-1 text-[12px] text-sand">{formatTime(run.startedAt)}</span>
        <span className="text-[11px] text-sand/60 shrink-0">
          {run.nodeResults.length} node{run.nodeResults.length !== 1 ? "s" : ""}
        </span>
      </button>
      {expanded && run.nodeResults.length > 0 && (
        <div className="pl-6 pb-2">
          {run.nodeResults.map((r, i) => (
            <NodeResultRow key={`${r.nodeId}-${i}`} result={r} label={r.label} />
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorBottomPanel({ workflowId }: { workflowId: string }) {
  const [tab, setTab] = useState<PanelTab>("logs");
  const [publishOpen, setPublishOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(220);

  const { getNodes } = useReactFlow();
  const { logs, logsOpen, setLogsOpen, runs, flowDirection, setFlowDirection } = useEditor();
  const collapsed = !logsOpen;

  const MIN_HEIGHT = 220;
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(220);

  const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartHeight.current = panelHeight;

    const onMouseMove = (ev: MouseEvent) => {
      if (dragStartY.current === null) return;
      const delta = dragStartY.current - ev.clientY; // positive = dragging up = taller
      const next = Math.max(MIN_HEIGHT, dragStartHeight.current + delta);
      setPanelHeight(next);
    };

    const onMouseUp = () => {
      dragStartY.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [panelHeight]);

  const nodeLabels = Object.fromEntries(
    getNodes().map((n) => [n.id, (n.data as { label?: string }).label ?? n.id])
  );

  return (
    <>
      <div
        className="relative shrink-0 bg-[#111] flex flex-col"
        style={{
          height: collapsed ? "36px" : `${panelHeight}px`,
          transition: collapsed ? "height 0.2s" : "none",
          borderTop: "1px solid #2a2a2a",
        }}
      >
        {/* Drag handle — only when open */}
        {!collapsed && (
          <div
            onMouseDown={onDragHandleMouseDown}
            className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize z-10"
          />
        )}
        {/* AI Chat floating button */}
        <button
          onClick={() => setAiOpen(true)}
          className="absolute -top-20 right-8 w-14 h-14 rounded-full bg-[#f0e6d3] flex items-center justify-center shadow-2xl hover:bg-[#f7efe2] hover:shadow-[0_0_18px_rgba(217,94,40,0.18)] hover:scale-105 transition-all duration-200 cursor-pointer z-10 border-2 border-[#ddd0bb]"
          title="AI Chat"
        >
          <Image src="/icons/chat-sparkle.svg" alt="AI Chat" width={26} height={26} style={{ filter: "brightness(0)" }} />
        </button>

        {/* Tab bar */}
        <div className="flex items-center h-9 px-3 shrink-0 gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                if (tab === t.key && !collapsed) { setPanelHeight(MIN_HEIGHT); setLogsOpen(false); }
                else { setTab(t.key); setLogsOpen(true); }
              }}
              className={`px-3 h-full text-[12px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                tab === t.key && !collapsed
                  ? "text-sand border-orange"
                  : "text-sand/60 border-transparent hover:text-sand"
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="flex items-center gap-1 ml-auto">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium ${published ? "text-orange" : "text-sand/70"}`}>
              {published ? <Globe size={12} strokeWidth={1.5} /> : <EyeOff size={12} strokeWidth={1.5} />}
              {published ? "Published" : "Unpublished"}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 text-sand hover:text-white transition-colors cursor-pointer hover:bg-white/5">
                  <MoreHorizontal size={14} strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-44 bg-[#1c1c1c] border border-[#2a2a2a] p-1 mb-1">
                <DropdownMenuItem
                  onClick={() => setFlowDirection(flowDirection === "horizontal" ? "vertical" : "horizontal")}
                  className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[13px] [&_svg]:!text-current"
                >
                  {flowDirection === "horizontal" ? <ArrowDown strokeWidth={1.5} /> : <ArrowRight strokeWidth={1.5} />}
                  {flowDirection === "horizontal" ? "Top to bottom" : "Left to right"}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/6 my-1" />
                <DropdownMenuItem
                  onClick={() => setPublishOpen(true)}
                  className="cursor-pointer px-3 py-2 text-[13px] text-orange font-medium focus:text-orange focus:bg-orange/8 gap-2.5 [&_svg]:!size-[13px] [&_svg]:!text-current"
                >
                  <Globe strokeWidth={1.5} />
                  Publish
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/6 my-1" />
                <DropdownMenuItem className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[13px] [&_svg]:!text-current">
                  <Save strokeWidth={1.5} />
                  Save
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/6 my-1" />
                <DropdownMenuItem className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[13px] [&_svg]:!text-current">
                  <Share2 strokeWidth={1.5} />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => { setPanelHeight(MIN_HEIGHT); setLogsOpen(!logsOpen); }}
              className="p-1.5 text-sand/60 hover:text-sand transition-colors cursor-pointer"
            >
              {collapsed ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Content */}
        {!collapsed && <div className="flex-1 overflow-y-auto flex flex-col border-t border-[#1e1e1e]">
          {tab === "logs" && (
            <>
              {logs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[13px] text-sand/30 text-center max-w-xs leading-relaxed">
                    Click Execute workflow on the trigger node to start.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-1.5 border-b border-[#1e1e1e] last:border-0">
                      <span className="text-[11px] text-sand/50 shrink-0 mt-px">{log.time}</span>
                      <span className={`text-[12px] leading-relaxed font-mono ${
                        log.level === "error" ? "text-red-400" :
                        log.level === "warn" ? "text-amber-400/80" :
                        "text-sand"
                      }`}>{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "runs" && (
            <>
              {runs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[13px] text-sand/30 text-center max-w-xs leading-relaxed">
                    No runs yet. Hit Execute on the trigger to start.
                  </p>
                </div>
              ) : (
                runs.map((run) => (
                  <RunHistoryRow key={run.id} run={run} nodeLabels={nodeLabels} />
                ))
              )}
            </>
          )}
        </div>}
      </div>

      <AiChatSheet open={aiOpen} onOpenChange={setAiOpen} workflowId={workflowId} />

      <PublishModal
        open={publishOpen}
        onOpenChange={(open) => { setPublishOpen(open); if (!open) setPublished(true); }}
        workflowName="Untitled Workflow"
        nodeCount={0}
      />
    </>
  );
}
