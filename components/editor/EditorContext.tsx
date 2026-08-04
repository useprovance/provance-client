"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { workflowService, type LogEntry } from "@/services/workflow.service";

interface EditorContextValue {
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
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
   const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
   const [isSheetOpen, setIsSheetOpen] = useState(false);
   const [configNodeId, setConfigNodeId] = useState<string | null>(null);
   const [isConfigOpen, setIsConfigOpen] = useState(false);
   const [logs, setLogs] = useState<LogEntry[]>([]);
   const [logsOpen, setLogsOpen] = useState(false);

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

   useEffect(() => {
      workflowService.registerLogger(addLog);
   }, [addLog]);

   return (
      <EditorContext.Provider value={{
         sourceNodeId, isSheetOpen, openSheet, closeSheet,
         configNodeId, isConfigOpen, openConfig, closeConfig,
         logs, logsOpen, setLogsOpen,
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
