"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { workflowService, type LogEntry } from "@/services/workflow.service";
import { executeWorkflow } from "@/lib/engine/executor";
import { calculateWorkflowPayment, type WorkflowPaymentPlan } from "@/lib/engine/payment";
import { WorkflowPaymentModal } from "@/components/editor/WorkflowPaymentModal";
import type { EngineCanvas, WorkflowRun, NodeRunResult } from "@/lib/engine/types";

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
  sourceHandleId: string | null;
  isSheetOpen: boolean;
  openSheet: (sourceNodeId: string | null, handleId?: string | null) => void;
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
  runningNodeId: string | null;
  nodeStatuses: Record<string, "success" | "error" | "skipped">;
  triggerRun: () => Promise<void>;
  stopRun: () => void;
  isAiChatOpen: boolean;
  openAiChat: () => void;
  closeAiChat: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ workflowId, children }: { workflowId: string; children: ReactNode }) {
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [sourceHandleId, setSourceHandleId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [flowDirection, setFlowDirection] = useState<FlowDirection>("horizontal");
  const [canvasActions, setCanvasActions] = useState<CanvasActions | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningNodeId, setRunningNodeId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, "success" | "error" | "skipped">>({});
  const stopRef = useRef<(() => void) | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<WorkflowPaymentPlan | null>(null);
  const pendingCanvasRef = useRef<EngineCanvas | null>(null);

  const openAiChat = useCallback(() => setIsAiChatOpen(true), []);
  const closeAiChat = useCallback(() => setIsAiChatOpen(false), []);

  const addRun = useCallback((run: WorkflowRun) => {
    setRuns((prev) => prev.some((r) => r.id === run.id) ? prev : [run, ...prev.slice(0, 49)]);
  }, []);

  const openSheet = useCallback((id: string | null, handleId?: string | null) => {
    setSourceNodeId(id);
    setSourceHandleId(handleId ?? null);
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setSourceNodeId(null);
    setSourceHandleId(null);
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
    setRunningNodeId(null);
    workflowService.log("Workflow stopped.", "info");
  }, []);

  const doRun = useCallback(async (canvas: EngineCanvas, permitByChain: Record<number, import("@/lib/engine/types").PermitSignature>) => {
    setNodeStatuses({});
    workflowService.log("Starting workflow...", "info");
    let stopped = false;
    stopRef.current = () => { stopped = true; };

    const paymentContext = Object.keys(permitByChain).length > 0
      ? { runId: crypto.randomUUID(), permitByChain, callCountByChain: {} }
      : undefined;

    try {
      const run = await executeWorkflow(workflowId, canvas, (result: NodeRunResult) => {
        if (stopped) return;
        setRunningNodeId(null);
        setNodeStatuses((prev) => ({ ...prev, [result.nodeId]: result.status === "success" ? "success" : result.status === "skipped" ? "skipped" : "error" }));
        if (result.status === "success") {
          workflowService.log(`✓ ${result.label} — ${result.durationMs}ms`, "info");
        } else if (result.status === "skipped") {
          workflowService.log(`– ${result.label} skipped — no data from upstream`, "info");
        } else {
          workflowService.log(`✗ ${result.label} failed — ${result.error ?? "unknown error"}`, "error");
        }
      }, (nodeId: string) => {
        if (!stopped) setRunningNodeId(nodeId);
      }, paymentContext);

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
  }, [workflowId, addRun]);

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

    // Check if any paid nodes exist — show payment modal first
    const plan = calculateWorkflowPayment(canvas);
    if (plan.requiresPayment) {
      pendingCanvasRef.current = canvas;
      setPaymentPlan(plan);
      return; // modal will call doRun when approved
    }

    await doRun(canvas, {} as Record<number, import("@/lib/engine/types").PermitSignature>);
  }, [workflowId, isRunning, doRun]);

  useEffect(() => {
    workflowService.registerLogger(addLog);
  }, [addLog]);

  const handlePaymentApproved = useCallback(async (permits: Record<number, import("@/lib/engine/types").PermitSignature>) => {
    const canvas = pendingCanvasRef.current;
    pendingCanvasRef.current = null;
    setPaymentPlan(null);
    if (canvas) await doRun(canvas, permits);
  }, [doRun]);

  const handlePaymentCancel = useCallback(() => {
    pendingCanvasRef.current = null;
    setPaymentPlan(null);
    setIsRunning(false);
  }, []);

  const emptyPlan = { requiresPayment: false, totalUsd: 0, chains: [] };

  return (
    <EditorContext.Provider value={{
      workflowId,
      sourceNodeId, sourceHandleId, isSheetOpen, openSheet, closeSheet,
      configNodeId, isConfigOpen, openConfig, closeConfig,
      logs, logsOpen, setLogsOpen,
      runs, addRun,
      flowDirection, setFlowDirection,
      registerCanvasActions, canvasActions,
      isRunning, runningNodeId, nodeStatuses, triggerRun, stopRun,
      isAiChatOpen, openAiChat, closeAiChat,
    }}>
      {children}
      <WorkflowPaymentModal
        open={!!paymentPlan}
        plan={paymentPlan ?? emptyPlan}
        onApproved={(txHashes) => void handlePaymentApproved(txHashes)}
        onCancel={handlePaymentCancel}
      />
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
  return ctx;
}
