"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormInput } from "@/components/ui/form-input";
import { FormSelector } from "@/components/ui/form-selector";
import { useWorkflowStore } from "@/stores/useWorkflowStore";

const TRIGGER_OPTIONS = [
  { value: "schedule", label: "Schedule", description: "Run on a time interval or cron" },
  { value: "webhook", label: "Webhook", description: "Triggered by an incoming HTTP request" },
  { value: "onchain", label: "On-chain Event", description: "Fires on a smart contract event" },
  { value: "price", label: "Price Alert", description: "Triggers when a token hits a price threshold" },
  { value: "manual", label: "Manual", description: "Run only when you trigger it yourself" },
];

interface CreateWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkflowModal({ open, onOpenChange }: CreateWorkflowModalProps) {
  const router = useRouter();
  const createWorkflow = useWorkflowStore((s) => s.create);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  const nameError = !name.trim() ? "Workflow name is required" : undefined;
  const canCreate = name.trim() !== "" && trigger !== "";

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setName("");
      setDescription("");
      setTrigger("");
      setNameTouched(false);
    }, 200);
  }

  function handleCreate() {
    if (!canCreate) return;
    const workflow = createWorkflow({ name: name.trim(), description: description.trim(), trigger });
    handleClose();
    router.push(`/dashboard/workflows/${workflow.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent
        aria-describedby={undefined}
        className="w-full max-w-lg bg-[#0f0f0f] border border-[#2a2a2a] p-0 gap-0 flex flex-col [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Create Workflow</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e] shrink-0">
          <div>
            <p className="text-[15px] font-semibold text-sand">Create Workflow</p>
            <p className="text-[11px] text-sand/35 mt-0.5">Set the basics before building</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={14} strokeWidth={2} className="text-sand/70" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-5">
          <FormInput
            label="Workflow Name"
            value={name}
            onChange={setName}
            placeholder="e.g. Base Meme Coin Investor"
            required
            error={nameError}
            touched={nameTouched}
            onBlur={() => setNameTouched(true)}
          />

          <FormInput
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="What does this workflow do?"
            type="textarea"
            rows={3}
          />

          <FormSelector
            label="Trigger Type"
            value={trigger}
            onChange={setTrigger}
            placeholder="Select a trigger..."
            options={TRIGGER_OPTIONS}
            required
            searchable={false}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1e1e1e] shrink-0 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-[13px] text-sand/40 hover:text-sand transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="flex items-center gap-1.5 bg-orange text-white text-[12px] font-bold px-6 py-2 disabled:opacity-30 hover:bg-orange/90 transition-colors cursor-pointer"
            style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
          >
            Create Workflow
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
