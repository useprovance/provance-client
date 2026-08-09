"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { workflowService, type LogEntry } from "@/services/workflow.service";
import type { WorkflowRun } from "@/lib/engine/types";

export type FlowDirection = "horizontal" | "vertical";

export interface CanvasActions {
  addNode: (agentId: string) => string;
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

  const addRun = useCallback((run: WorkflowRun) => {
    setRuns((prev) => [run, ...prev.slice(0, 49)]);
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
