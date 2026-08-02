"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { WorkflowCard } from "@/components/dashboard/WorkflowCard";
import { CreateWorkflowModal } from "@/components/dashboard/CreateWorkflowModal";
import { useWorkflowStore } from "@/stores/useWorkflowStore";
import Footer from "@/components/landing-page/Footer";

const STRIPE = {
  backgroundImage:
    "repeating-linear-gradient(-45deg, var(--sand) 0, var(--sand) 1px, transparent 0, transparent 50%)",
  backgroundSize: "6px 6px",
};

export default function WorkflowsPage() {
  const workflows = useWorkflowStore((s) => s.workflows);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#181818] overflow-y-auto">
      <div className="max-w-7xl w-full mx-auto px-8 py-10 flex flex-col gap-8 min-h-screen">

        {/* Badge strip */}
        <div className="flex items-center justify-between w-full border-t border-b border-sand/25 py-3">
          <div className="flex items-center gap-2 pr-6 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-orange shrink-0" />
            <p className="text-sand text-xs font-mono uppercase tracking-widest">Workflows</p>
          </div>
          <div className="flex-1 h-full min-h-[16px]" style={{ ...STRIPE, opacity: 0.15 }} />
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 ml-6 shrink-0 transition-colors cursor-pointer"
            style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
          >
            <Plus size={13} strokeWidth={2.5} />
            New Workflow
          </button>
        </div>

        {/* Cards */}
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-sand/10">
            <p className="text-[13px] text-sand/30">No workflows yet</p>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 transition-colors cursor-pointer"
              style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Create your first workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {workflows.map((w) => (
              <WorkflowCard key={w.id} workflow={w} />
            ))}
          </div>
        )}

      </div>

      <CreateWorkflowModal open={createOpen} onOpenChange={setCreateOpen} />
      <Footer />
    </div>
  );
}
