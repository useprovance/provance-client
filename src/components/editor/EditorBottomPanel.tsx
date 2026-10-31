import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
   ChevronUp, ChevronDown, FlaskConical, Square,
   MoreHorizontal, Trash2, Globe, EyeOff, ChevronRight,
   CheckCircle2, XCircle, Loader2, Copy, Check,
   CircleOff, Eraser,
} from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditorStore } from "@/stores/editor.store";
import { workflowService, type WorkflowRun, type NodeRunResult } from "@/services/workflow.service";
import { WorkflowPaymentModal } from "@/components/editor/WorkflowPaymentModal";

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
   if (value === null) return <span className="text-white/60">null</span>;
   if (typeof value === "boolean") return <span className="text-yellow-200">{String(value)}</span>;
   if (typeof value === "number") return <span className="text-cyan-200">{value}</span>;
   if (typeof value === "string") return <span className="text-emerald-200">"{value}"</span>;

   if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-white/40">[]</span>;
      return (
         <span>
            <span className="text-white/40">[</span>
            <div style={{ paddingLeft: `${(depth + 1) * 14}px` }}>
               {value.map((v, i) => (
                  <div key={i}>
                     <JsonValue value={v} depth={depth + 1} />
                     {i < value.length - 1 && <span className="text-white/30">,</span>}
                  </div>
               ))}
            </div>
            <span style={{ paddingLeft: `${depth * 14}px` }} className="text-white/40">]</span>
         </span>
      );
   }

   if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return <span className="text-white/40">{"{}"}</span>;
      return (
         <span>
            <span className="text-white/40">{"{"}</span>
            <div style={{ paddingLeft: `${(depth + 1) * 14}px` }}>
               {entries.map(([k, v], i) => (
                  <div key={k}>
                     <span className="text-orange-300">"{k}"</span>
                     <span className="text-white/40">: </span>
                     <JsonValue value={v} depth={depth + 1} />
                     {i < entries.length - 1 && <span className="text-white/30">,</span>}
                  </div>
               ))}
            </div>
            <span style={{ paddingLeft: `${depth * 14}px` }} className="text-white/40">{"}"}</span>
         </span>
      );
   }

   return <span className="text-white/60">{String(value)}</span>;
}

function ErrorBlock({ error }: { error: string }) {
   const [copied, setCopied] = useState(false);

   const copy = () => {
      void navigator.clipboard.writeText(error).then(() => {
         setCopied(true);
         setTimeout(() => setCopied(false), 1500);
      });
   };

   return (
      <div className="rounded border border-red-500/20 overflow-hidden">
         <div className="px-3 py-1.5 bg-red-500/8 border-b border-red-500/15 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400/70">Error</span>
            <button
               onClick={copy}
               className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium bg-white/8 text-white/90 hover:bg-white/14 hover:text-white transition-colors cursor-pointer"
            >
               {copied ? <><Check size={10} strokeWidth={2.5} className="text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy size={10} strokeWidth={2} /><span>Copy</span></>}
            </button>
         </div>
         <div className="p-3 font-mono text-[11px] text-red-300 leading-relaxed">{error}</div>
      </div>
   );
}

function JsonBlock({ label, data }: { label: string; data: Record<string, unknown> }) {
   const [copied, setCopied] = useState(false);

   const copy = () => {
      void navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
         setCopied(true);
         setTimeout(() => setCopied(false), 1500);
      });
   };

   return (
      <div className="rounded border border-white/8 overflow-hidden">
         <div className="px-3 py-1.5 bg-white/4 border-b border-white/8 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{label}</span>
            <button
               onClick={copy}
               className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium bg-white/8 text-white/90 hover:bg-white/14 hover:text-white transition-colors cursor-pointer"
            >
               {copied
                  ? <><Check size={10} strokeWidth={2.5} className="text-green-400" /><span className="text-green-400">Copied</span></>
                  : <><Copy size={10} strokeWidth={2} /><span>Copy</span></>
               }
            </button>
         </div>
         <div className="p-3 font-mono text-[11px] leading-[1.7] overflow-x-auto">
            <JsonValue value={data} />
         </div>
      </div>
   );
}

const MIN_HEIGHT = 220;

function formatDuration(ms: number) {
   if (ms < 1000) return `${ms}ms`;
   return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(iso: string) {
   const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
   if (diff < 60) return `${diff}s ago`;
   if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
   return `${Math.floor(diff / 3600)}h ago`;
}

function totalDuration(results: NodeRunResult[]) {
   const total = results.reduce((sum, r) => sum + r.durationMs, 0);
   return formatDuration(total);
}

function getErrorHint(error: string): string {
   const e = error.toLowerCase();
   if (e.includes("pair not found")) return "This token has no trading pair yet — it may be too new. Try again in a few minutes.";
   if (e.includes("required") && e.includes("token_address")) return "A required field is missing. Open the node config and link the correct output from the previous step.";
   if (e.includes("404")) return "The resource was not found. The token or pair may not be indexed on this chain yet.";
   if (e.includes("429") || e.includes("rate limit")) return "Too many requests. Wait a moment before running again.";
   if (e.includes("econnrefused") || e.includes("fetch failed")) return "Could not reach the agent server. Make sure it is running.";
   if (e.includes("invalid_type") || e.includes("zod")) return "A required field is missing or has the wrong format. Check the node config sheet.";
   if (e.includes("api key") || e.includes("unauthorized") || e.includes("401")) return "The API key is missing or incorrect. Check your environment variables.";
   return "Something went wrong. Check the technical details below for more info.";
}

function NodeStep({ result, index, isLast }: { result: NodeRunResult; index: number; isLast: boolean }) {
   const [showDetails, setShowDetails] = useState(false);
   const hint = result.error ? getErrorHint(result.error) : "";

   const dotColor =
      result.status === "success" ? "bg-green-500" :
      result.status === "error" ? "bg-red-400" :
      "bg-white/20";

   const statusLabel =
      result.status === "success" ? "Done" :
      result.status === "error" ? "Failed" :
      "Skipped";

   const statusColor =
      result.status === "success" ? "text-green-500 bg-green-500/10" :
      result.status === "error" ? "text-red-400 bg-red-400/10" :
      "text-white/40 bg-white/5";

   return (
      <div className="flex gap-3">
         {/* Timeline spine */}
         <div className="flex flex-col items-center shrink-0 pt-1">
            <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
            {!isLast && <div className="w-px flex-1 bg-white/8 mt-1" />}
         </div>

         {/* Content */}
         <div className={`flex-1 pb-4 ${isLast ? "pb-2" : ""}`}>
            <div className="flex items-center gap-2 min-w-0">
               <span className="text-[11px] text-white/50 shrink-0 font-medium">Step {index + 1}</span>
               <span className={`text-[13px] font-semibold truncate ${result.status === "skipped" ? "text-white/50" : "text-white"}`}>
                  {result.label}
               </span>
               <div className="ml-auto flex items-center gap-2 shrink-0">
                  {result.status !== "skipped" && (
                     <span className="text-[12px] text-white/60">{formatDuration(result.durationMs)}</span>
                  )}
                  <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                     {statusLabel}
                  </span>
               </div>
            </div>

            {result.status === "skipped" && (
               <p className="text-[12px] text-white/50 mt-1">This step was skipped because a previous step failed.</p>
            )}

            {result.status === "error" && hint && (
               <p className="text-[13px] text-amber-400 mt-1.5 leading-relaxed">{hint}</p>
            )}

            {result.status !== "skipped" && (
               <button
                  onClick={() => setShowDetails((v) => !v)}
                  className="flex items-center gap-1 mt-2 text-[12px] text-white/50 hover:text-white transition-colors cursor-pointer"
               >
                  <ChevronRight size={12} className={`transition-transform ${showDetails ? "rotate-90" : ""}`} />
                  {showDetails ? "Hide details" : "View details"}
               </button>
            )}

            {showDetails && (
               <div className="mt-2 flex flex-col gap-2">
                  {result.error && (
                     <ErrorBlock error={result.error} />
                  )}
                  <JsonBlock label="Input" data={result.input} />
                  {result.status === "success" && <JsonBlock label="Output" data={result.output} />}
               </div>
            )}
         </div>
      </div>
   );
}

function RunHistoryRow({ run }: { run: WorkflowRun }) {
   const isRunning = run.status === "running";
   const [expanded, setExpanded] = useState(isRunning);
   const succeeded = run.nodeResults.filter((r) => r.status === "success").length;
   const failed = run.nodeResults.filter((r) => r.status === "error").length;

   return (
      <div className="border-b border-[#1e1e1e] last:border-0">
         <button
            onClick={() => setExpanded((v) => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer text-left hover:bg-white/3 ${expanded ? "bg-white/[0.04]" : ""}`}
         >
            {isRunning
               ? <Loader2 size={15} className="text-orange shrink-0 animate-spin" />
               : run.status === "success"
                  ? <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                  : <XCircle size={15} className="text-red-400 shrink-0" />
            }

            <p className={`flex-1 text-[13px] font-medium ${isRunning ? "text-orange" : run.status === "success" ? "text-white" : "text-red-400"}`}>
               {isRunning ? "Running..." : run.status === "success" ? "Completed successfully" : "Run failed"}
            </p>

            <p className="text-[12px] text-white/60 shrink-0">
               {timeAgo(run.startedAt)}
               {!isRunning && ` · ${totalDuration(run.nodeResults)} · ${run.nodeResults.length} step${run.nodeResults.length !== 1 ? "s" : ""}`}
            </p>

            <ChevronDown size={13} className={`shrink-0 text-white/50 transition-transform ${expanded ? "rotate-180" : ""}`} />
         </button>

         {expanded && (
            <div className="px-4 pt-2 pb-1">
               {!isRunning && (
                  <div className="flex items-center gap-3 mb-4 text-[12px] font-medium">
                     {succeeded > 0 && <span className="text-green-500">{succeeded} succeeded</span>}
                     {failed > 0 && <span className="text-red-400">{failed} failed</span>}
                  </div>
               )}
               {run.nodeResults.map((r, i) => (
                  <NodeStep key={`${r.nodeId}-${i}`} result={r} index={i} isLast={i === run.nodeResults.length - 1} />
               ))}
               {isRunning && run.nodeResults.length === 0 && (
                  <p className="text-[12px] text-white/30 pb-3">Waiting for first node...</p>
               )}
            </div>
         )}
      </div>
   );
}

type PanelTab = "logs" | "runs";

export function EditorBottomPanel() {
   const navigate = useNavigate();
   const { workflowId, isRunning, logsOpen, logs, runs, setLogsOpen, panelTab: tab, setPanelTab: setTab, triggerRun, stopRun, clearLogs, clearRuns } = useEditorStore();

   const handleRun = () => {
      void triggerRun();
   };

   const [panelHeight, setPanelHeight] = useState(MIN_HEIGHT);

   const dragStartY = useRef<number | null>(null);
   const dragStartHeight = useRef<number>(MIN_HEIGHT);

   const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      dragStartY.current = e.clientY;
      dragStartHeight.current = panelHeight;

      const onMouseMove = (ev: MouseEvent) => {
         if (dragStartY.current === null) return;
         const delta = dragStartY.current - ev.clientY;
         setPanelHeight(Math.max(MIN_HEIGHT, dragStartHeight.current + delta));
      };
      const onMouseUp = () => {
         dragStartY.current = null;
         window.removeEventListener("mousemove", onMouseMove);
         window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
   }, [panelHeight]);

   const handleDelete = async () => {
      if (!workflowId) return;
      await workflowService.remove(workflowId);
      navigate("/app");
   };

   const collapsed = !logsOpen;

   return (
      <>
      <WorkflowPaymentModal />
      <div
         className="relative shrink-0 bg-[#111] flex flex-col border-t border-[#2a2a2a]"
         style={{ height: collapsed ? "36px" : `${panelHeight}px`, transition: collapsed ? "height 0.2s" : "none" }}
      >
         {/* Drag handle */}
         {!collapsed && (
            <div
               onMouseDown={onDragHandleMouseDown}
               className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize z-10"
            />
         )}

         {/* Run / Stop — float above */}
         <div className="absolute -top-14 left-4 flex items-center gap-2 z-10">
            <button
               onClick={handleRun}
               disabled={isRunning}
               className="flex items-center gap-2 px-4 h-10 bg-[#1e1e1e] border border-white/20 text-white text-[12px] font-medium rounded-md hover:bg-[#2a2a2a] hover:border-white/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
               <FlaskConical size={13} strokeWidth={2} />
               {isRunning ? "Running..." : "Run workflow"}
            </button>
            {isRunning && (
               <button
                  onClick={stopRun}
                  className="flex items-center gap-2 px-4 h-10 bg-[#1e1e1e] border border-red-500/40 text-red-400 text-[12px] font-medium rounded-md hover:bg-red-500/10 hover:border-red-500/70 transition-all cursor-pointer"
               >
                  <Square size={11} strokeWidth={2} fill="currentColor" />
                  Stop
               </button>
            )}
         </div>

         {/* Tab bar */}
         <div className="flex items-center h-9 px-2 shrink-0 gap-0.5">
            {(["logs", "runs"] as PanelTab[]).map((t) => (
               <button
                  key={t}
                  onClick={() => {
                     if (tab === t && !collapsed) { setLogsOpen(false); }
                     else { setTab(t); setLogsOpen(true); }
                  }}
                  className={`px-3 h-full text-[12px] font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
                     tab === t && !collapsed
                        ? "text-white border-orange"
                        : "text-white/50 border-transparent hover:text-white/80"
                  }`}
               >
                  {t}
               </button>
            ))}

            <div className="flex items-center gap-0.5 ml-auto">
               {/* Publish status badge */}
               <div className="flex items-center gap-1.5 px-2.5 py-1 mr-1 rounded-sm border border-white/10 bg-white/4 text-[11px] font-medium text-white/60">
                  <EyeOff size={12} strokeWidth={2} />
                  Unpublished
               </div>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button className="h-7 w-7 flex items-center justify-center rounded-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors cursor-pointer">
                        <MoreHorizontal size={16} strokeWidth={2} />
                     </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="w-48 bg-[#181818] border border-white/10 p-1 mb-1 shadow-xl">
                     <DropdownMenuItem className="cursor-pointer px-3 py-2 text-[12px] text-white/80 font-medium rounded-sm focus:text-white focus:bg-white/8 gap-2.5 [&_svg]:!size-[13px] [&_svg]:text-white/50">
                        <Globe strokeWidth={1.5} />
                        Publish
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="bg-white/8 my-1" />
                     <DropdownMenuItem
                        onClick={clearLogs}
                        disabled={logs.length === 0}
                        className="cursor-pointer px-3 py-2 text-[12px] text-white/80 font-medium rounded-sm focus:text-white focus:bg-white/8 gap-2.5 [&_svg]:!size-[13px] [&_svg]:text-white/50 disabled:opacity-35 disabled:pointer-events-none"
                     >
                        <CircleOff strokeWidth={1.5} />
                        Clear logs
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        onClick={clearRuns}
                        disabled={runs.length === 0}
                        className="cursor-pointer px-3 py-2 text-[12px] text-white/80 font-medium rounded-sm focus:text-white focus:bg-white/8 gap-2.5 [&_svg]:!size-[13px] [&_svg]:text-white/50 disabled:opacity-35 disabled:pointer-events-none"
                     >
                        <Eraser strokeWidth={1.5} />
                        Clear runs
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="bg-white/8 my-1" />
                     <DropdownMenuItem
                        onClick={() => void handleDelete()}
                        className="cursor-pointer px-3 py-2 text-[12px] text-red-400 font-medium rounded-sm focus:text-red-300 focus:bg-red-500/10 gap-2.5 [&_svg]:!size-[13px] [&_svg]:text-red-400"
                     >
                        <Trash2 strokeWidth={1.5} />
                        Delete workflow
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>

               <button
                  onClick={() => setLogsOpen(!logsOpen)}
                  className="h-7 w-7 flex items-center justify-center rounded-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
               >
                  {collapsed ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
               </button>
            </div>
         </div>

         {/* Content */}
         {!collapsed && (
            <div className="flex-1 overflow-y-auto flex flex-col border-t border-[#1e1e1e]">
               {tab === "logs" && (
                  logs.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center">
                        <p className="text-[13px] text-white/40 text-center max-w-xs leading-relaxed">
                           Run the workflow to see logs here.
                        </p>
                     </div>
                  ) : (
                     <div className="flex flex-col">
                        {logs.map((log, i) => (
                           <div key={i} className="flex items-start gap-3 px-4 py-1.5 border-b border-[#1e1e1e] last:border-0">
                              <span className="text-[11px] text-white/65 shrink-0 mt-px">{log.time}</span>
                              <span className={`text-[12px] leading-relaxed font-mono ${
                                 log.level === "error" ? "text-red-400" :
                                 log.level === "warn" ? "text-amber-400/80" :
                                 "text-white"
                              }`}>{log.message}</span>
                           </div>
                        ))}
                     </div>
                  )
               )}

               {tab === "runs" && (
                  runs.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center">
                        <p className="text-[13px] text-white/40 text-center max-w-xs leading-relaxed">
                           No runs yet. Hit Run workflow to start.
                        </p>
                     </div>
                  ) : (
                     runs.map((run) => <RunHistoryRow key={run.id} run={run} />)
                  )
               )}
            </div>
         )}
      </div>
      </>
   );
}
