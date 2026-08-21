"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { workflowService, type LogEntry } from "@/services/workflow.service";
import { executeWorkflow } from "@/lib/engine/executor";
import type { WorkflowRun, NodeRunResult } from "@/lib/engine/types";

export type FlowDirection = "horizontal" | "vertical";

export interface CanvasActions {
  addNode: (agentId: string, actionKey?: string) => string;
  connectNodes: (sourceId: string, targetId: string) => void;
  configureNode: (nodeId: string, params: Record<string, string>, links?: Record<string, string>) => void;
  removeNode: (nodeId: string) => void;
}

interface EditorContextValue {
  workflowId: string;
  sourceNodeId: string | null;
  isSheetOpen: boolean;
  openSheet: (sourceNodeId: string | null) => void;
  closeSheet: () => void;
  configNodeId: string | null;
  isConfigOpen: boolean;
  openConfig: (nodeId: string) => void;
  closeConfig: () => void;
  logs: LogEntry[];
  logsOpen: boolean;
  setLogsOpen: (open: boolean) => void;
  runs: WorkflowRun[];
  addRun: (run: WorkflowRun) => void;
  flowDirection: FlowDirection;
  setFlowDirection: (dir: FlowDirection) => void;
  registerCanvasActions: (actions: CanvasActions) => void;
  canvasActions: CanvasActions | null;
  isRunning: boolean;
  triggerRun: () => Promise<void>;
  stopRun: () => void;
  isAiChatOpen: boolean;
  openAiChat: () => void;
  closeAiChat: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ workflowId, children }: { workflowId: string; children: ReactNode }) {
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [flowDirection, setFlowDirection] = useState<FlowDirection>("horizontal");
  const [canvasActions, setCanvasActions] = useState<CanvasActions | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  const openAiChat = useCallback(() => setIsAiChatOpen(true), []);
  const closeAiChat = useCallback(() => setIsAiChatOpen(false), []);

  const addRun = useCallback((run: WorkflowRun) => {
    setRuns((prev) => prev.some((r) => r.id === run.id) ? prev : [run, ...prev.slice(0, 49)]);
  }, []);

  const openSheet = useCallback((id: string | null) => {
    setSourceNodeId(id);
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setSourceNodeId(null);
  }, []);

  const openConfig = useCallback((id: string) => {
    setConfigNodeId(id);
    setIsConfigOpen(true);
  }, []);

  const closeConfig = useCallback(() => {
    setIsConfigOpen(false);
    setConfigNodeId(null);
  }, []);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
    setLogsOpen(true);
  }, []);

  const registerCanvasActions = useCallback((actions: CanvasActions) => {
    setCanvasActions(actions);
  }, []);

  const stopRun = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setIsRunning(false);
    workflowService.log("Workflow stopped.", "info");
  }, []);

  const triggerRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    const canvas = workflowService.loadCanvas(workflowId);

    // If trigger node is a schedule, register cron job instead of running immediately
    const triggerNode = canvas.nodes.find((n) => n.type === "trigger");
    const triggerType = triggerNode?.config?.__trigger?.type as string | undefined;
    if (triggerType === "schedule") {
      const interval = Number(triggerNode?.config?.parameters?.interval ?? 5);
      const unit = (triggerNode?.config?.parameters?.unit ?? "minutes") as "minutes" | "hours" | "days";
      const nodesUrl = process.env.NEXT_PUBLIC_NODES_URL ?? "https://nodes.useprovance.xyz";
      workflowService.log(`Registering schedule: every ${interval} ${unit}...`, "info");
      try {
        const res = await fetch(`${nodesUrl}/core/trigger/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflowId, interval, unit }),
        });
        const json = await res.json() as { success: boolean; data: { cron: string }; message: string };
        if (json.success) {
          workflowService.log(`Schedule active — runs every ${interval} ${unit} (cron: ${json.data.cron})`, "info");
        } else {
          workflowService.log(`Failed to register schedule: ${json.message}`, "error");
        }
      } catch (err) {
        workflowService.log(`Schedule error: ${err instanceof Error ? err.message : String(err)}`, "error");
      } finally {
        setIsRunning(false);
      }
      return;
    }

    workflowService.log("Starting workflow...", "info");
    let stopped = false;
    stopRef.current = () => { stopped = true; };
    try {
      const run = await executeWorkflow(workflowId, canvas, (result: NodeRunResult) => {
        if (stopped) return;
        if (result.status === "success") {
          workflowService.log(`✓ ${result.label} — ${result.durationMs}ms`, "info");
        } else if (result.status === "skipped") {
          workflowService.log(`– ${result.label} skipped — no data from upstream`, "info");
        } else {
          workflowService.log(`✗ ${result.label} failed — ${result.error ?? "unknown error"}`, "error");
        }
      });
      if (!stopped) {
      addRun(run);
      void workflowService.saveRun(workflowId, run);
      workflowService.log(
        run.status === "success"
          ? "Workflow completed. Open the Runs tab to see full output."
          : `Workflow stopped: ${run.error ?? "unknown error"}`,
        run.status === "success" ? "info" : "error"
      );
      }
    } catch (err) {
      if (!stopped) workflowService.log(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      stopRef.current = null;
      setIsRunning(false);
    }
  }, [workflowId, addRun, isRunning]);

  useEffect(() => {
    workflowService.registerLogger(addLog);
  }, [addLog]);

  return (
    <EditorContext.Provider value={{
      workflowId,
      sourceNodeId, isSheetOpen, openSheet, closeSheet,
      configNodeId, isConfigOpen, openConfig, closeConfig,
      logs, logsOpen, setLogsOpen,
      runs, addRun,
      flowDirection, setFlowDirection,
      registerCanvasActions, canvasActions,
      isRunning, triggerRun, stopRun,
      isAiChatOpen, openAiChat, closeAiChat,
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
  return ctx;
}
