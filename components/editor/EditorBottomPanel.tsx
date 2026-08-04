"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { EyeOff, Globe, MoreHorizontal, Save, Share2, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
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

function NodeResultRow({ result, label }: { result: NodeRunResult; label: string }) {
  const [expanded, setExpanded] = useState(false);

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
        <span className="flex-1 text-[12px] text-sand truncate">{label}</span>
        <span className="text-[11px] text-sand/60 shrink-0 flex items-center gap-1">
          <Clock size={10} />
          {formatDuration(result.durationMs)}
        </span>
        <span className="text-[11px] text-sand/50 shrink-0">{formatTime(result.startedAt)}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-3">
          {result.error ? (
            <p className="text-[11px] text-red-400 font-mono leading-relaxed">{result.error}</p>
          ) : (
            <pre className="text-[10px] text-sand/80 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(result.output, null, 2)}
            </pre>
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
          {run.nodeResults.map((r) => (
            <NodeResultRow key={r.nodeId} result={r} label={nodeLabels[r.nodeId] ?? r.nodeId} />
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
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<WorkflowRun | null>(null);
  const [runHistory, setRunHistory] = useState<WorkflowRun[]>([]);

  const { getNodes, getEdges } = useReactFlow();
  const { logs, logsOpen, setLogsOpen } = useEditor();
  const collapsed = !logsOpen;

  const handleTestRun = useCallback(async () => {
    const nodes = getNodes();
    const edges = getEdges();

    if (nodes.length === 0) return;

    setRunning(true);
    setLogsOpen(true);
    setTab("logs");

    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, canvas: { nodes, edges } }),
      });
      const json = await res.json();
      if (json.success) {
        setLastRun(json.data);
        setRunHistory((prev) => [json.data, ...prev.slice(0, 49)]);
      } else {
        console.error("Run failed:", json.error);
      }
    } catch (err) {
      console.error("Execute request failed:", err);
    } finally {
      setRunning(false);
    }
  }, [workflowId, getNodes, getEdges]);

  const nodeLabels = Object.fromEntries(
    getNodes().map((n) => [n.id, (n.data as { label?: string }).label ?? n.id])
  );

  return (
    <>
      <div
        className="shrink-0 border-t border-[#2a2a2a] bg-[#111] flex flex-col transition-all duration-200"
        style={{ height: collapsed ? "36px" : "220px" }}
      >
        {/* Tab bar */}
        <div className="flex items-center h-9 px-3 shrink-0 gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                if (tab === t.key && !collapsed) { setLogsOpen(false); }
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
            {/* Publish status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium ${published ? "text-orange" : "text-sand/70"}`}>
              {published
                ? <Globe size={12} strokeWidth={1.5} />
                : <EyeOff size={12} strokeWidth={1.5} />}
              {published ? "Published" : "Unpublished"}
            </div>

<button
              onClick={() => setAiOpen(true)}
              className="p-1.5 text-sand hover:text-white transition-colors cursor-pointer hover:bg-white/5"
            >
              <Image src="/icons/chat-sparkle.svg" alt="AI Chat" width={14} height={14} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 text-sand hover:text-white transition-colors cursor-pointer hover:bg-white/5">
                  <MoreHorizontal size={14} strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                className="w-44 bg-[#1c1c1c] border border-[#2a2a2a] p-1 mb-1"
              >
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
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto flex flex-col border-t border-[#1e1e1e]">
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
                      <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-[#1e1e1e] last:border-0">
                        <span className="text-[11px] text-sand/50 shrink-0">{log.time}</span>
                        <span className="text-[12px] text-sand">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "runs" && (
              <>
                {runHistory.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[13px] text-sand/30 text-center max-w-xs leading-relaxed">
                      No runs yet. Click Test Run to start.
                    </p>
                  </div>
                ) : (
                  runHistory.map((run) => (
                    <RunHistoryRow key={run.id} run={run} nodeLabels={nodeLabels} />
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>

      <AiChatSheet open={aiOpen} onOpenChange={setAiOpen} />

      <PublishModal
        open={publishOpen}
        onOpenChange={(open) => { setPublishOpen(open); if (!open) setPublished(true); }}
        workflowName="Untitled Workflow"
        nodeCount={0}
      />
    </>
  );
}
