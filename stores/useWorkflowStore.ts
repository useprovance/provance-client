"use client";

import { create } from "zustand";
import { createBrowserClient } from "@supabase/ssr";

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
}

function db() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

type WorkflowStore = {
  workflows: Workflow[];
  loading: boolean;
  fetch: () => Promise<void>;
  create: (input: CreateWorkflowInput) => Promise<Workflow>;
  remove: (id: string) => Promise<void>;
  get: (id: string) => Workflow | undefined;
};

export const useWorkflowStore = create<WorkflowStore>()((set, get) => ({
  workflows: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const { data } = await db()
        .from("workflows")
        .select("id, name, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (data) {
        set({
          workflows: data.map((w) => ({
            id: w.id,
            name: w.name,
            description: "",
            published: false,
            nodeCount: 0,
            lastRun: null,
            runs: 0,
            createdAt: w.created_at,
            updatedAt: w.updated_at,
          })),
        });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (input) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert into Supabase
    await db()
      .from("workflows")
      .insert({ id, name: input.name, canvas: { nodes: [], edges: [] }, viewport: null });

    const workflow: Workflow = {
      id,
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

  remove: async (id) => {
    await db().from("workflows").delete().eq("id", id);
    set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) }));
  },

  get: (id) => get().workflows.find((w) => w.id === id),
}));
