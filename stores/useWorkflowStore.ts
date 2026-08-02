"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  published: boolean;
  nodeCount: number;
  lastRun: string | null;
  runs: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  trigger?: string;
}

type WorkflowStore = {
  workflows: Workflow[];
  create: (input: CreateWorkflowInput) => Workflow;
  update: (id: string, input: Partial<Workflow>) => void;
  remove: (id: string) => void;
  get: (id: string) => Workflow | undefined;
};

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      workflows: [],

      create: (input) => {
        const now = new Date().toISOString();
        const workflow: Workflow = {
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description ?? "",
          published: false,
          nodeCount: 0,
          lastRun: null,
          runs: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ workflows: [workflow, ...s.workflows] }));
        return workflow;
      },

      update: (id, input) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id ? { ...w, ...input, updatedAt: new Date().toISOString() } : w
          ),
        }));
      },

      remove: (id) => {
        set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) }));
      },

      get: (id) => get().workflows.find((w) => w.id === id),
    }),
    {
      name: "provance_workflows",
    }
  )
);
