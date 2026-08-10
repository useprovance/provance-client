"use client";

import { useEffect } from "react";
import { useWorkflowStore } from "@/stores/useWorkflowStore";

export function WorkflowStoreProvider() {
  const fetch = useWorkflowStore((s) => s.fetch);
  useEffect(() => { void fetch(); }, [fetch]);
  return null;
}
