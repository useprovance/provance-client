"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Check, X, Globe, Lock, Link2 } from "lucide-react";
import { FormInput } from "@/components/ui/form-input";

type Visibility = "public" | "private" | "unlisted";

interface PublishModalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workflowName: string;
  nodeCount: number;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "public", label: "Public", desc: "Anyone can discover and use this workflow", icon: Globe },
  { value: "unlisted", label: "Unlisted", desc: "Only accessible via direct link", icon: Link2 },
  { value: "private", label: "Private", desc: "Only visible to you", icon: Lock },
];

export function PublishModal({ open, onOpenChange, workflowName, nodeCount }: PublishModalProps) {
  const [name, setName] = useState(workflowName);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [published, setPublished] = useState(false);

  const canPublish = name.trim() !== "";

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => { setPublished(false); setDescription(""); setVisibility("private"); }, 300);
  }

  function handlePublish() {
    console.log("Publish workflow:", { name, description, visibility });
    setPublished(true);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent
        aria-describedby={undefined}
        className="w-screen h-screen !max-w-none !max-h-none m-0 rounded-none bg-[#0f0f0f] border-0 p-0 gap-0 flex flex-col [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Publish Workflow</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#1e1e1e] shrink-0">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-sand/50 hover:text-sand transition-colors cursor-pointer text-[13px]"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            Back to editor
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={14} strokeWidth={2} className="text-sand/70" />
          </button>
        </div>

        {/* Banner */}
        <div className="relative h-28 bg-orange shrink-0 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: "rgba(29,29,29,0.55)",
              WebkitMaskImage: "url('/icons/dots.svg')",
              WebkitMaskSize: "7px 7px",
              maskImage: "url('/icons/dots.svg')",
              maskSize: "7px 7px",
            }}
          />
          <div className="relative z-10 flex items-center h-full px-10 gap-3">
            <div className="w-2 h-2 rounded-full bg-sand shrink-0" />
            <p className="text-sand text-xs font-mono uppercase tracking-widest">Publish Workflow</p>
          </div>
        </div>

        {/* Body */}
        {published ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="w-14 h-14 rounded-full bg-orange/15 border border-orange/30 flex items-center justify-center">
              <Check size={24} strokeWidth={2} className="text-orange" />
            </div>
            <div className="text-center">
              <p className="text-[20px] font-semibold text-sand font-geist">Workflow published</p>
              <p className="text-[13px] text-sand/40 mt-1">Your workflow is now {visibility === "public" ? "live on the marketplace" : visibility === "unlisted" ? "accessible via link" : "saved privately"}.</p>
            </div>
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 bg-sand text-ink-dark text-[12px] font-bold px-6 py-2 transition-colors hover:bg-sand-light cursor-pointer mt-2"
              style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left — form */}
            <div className="flex-1 overflow-y-auto px-12 py-12">
              <div className="max-w-lg flex flex-col gap-8">
                <div>
                  <p className="text-[22px] font-semibold text-sand font-geist mb-1">Review and publish</p>
                  <p className="text-[13px] text-sand/40">Set the details for your workflow before publishing.</p>
                </div>

                <FormInput
                  label="Workflow Name"
                  value={name}
                  onChange={setName}
                  placeholder="e.g. DeFi Risk Monitor"
                  required
                />

                <FormInput
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  placeholder="What does this workflow do?"
                  type="textarea"
                  rows={4}
                />

                {/* Visibility */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-sand/40">Visibility</span>
                  <div className="flex flex-col gap-2">
                    {VISIBILITY_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setVisibility(value)}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-sm border text-left transition-colors cursor-pointer ${
                          visibility === value
                            ? "border-orange/50 bg-orange/5"
                            : "border-[#2a2a2a] hover:border-[#333] bg-[#0c0c0c]"
                        }`}
                      >
                        <Icon size={16} strokeWidth={1.5} className={visibility === value ? "text-orange" : "text-sand/30"} />
                        <div className="flex-1">
                          <p className={`text-[13px] font-medium ${visibility === value ? "text-sand" : "text-sand/50"}`}>{label}</p>
                          <p className="text-[11px] text-sand/30 mt-0.5">{desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          visibility === value ? "border-orange bg-orange" : "border-[#333]"
                        }`}>
                          {visibility === value && <Check size={9} strokeWidth={3} className="text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — summary */}
            <div className="w-72 shrink-0 border-l border-[#1e1e1e] px-8 py-12 flex flex-col gap-6">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-sand/40 mb-4">Workflow Summary</p>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-sand/40">Nodes</span>
                    <span className="text-sand font-mono">{String(nodeCount).padStart(2, "0")}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-sand/40">Status</span>
                    <span className="text-amber-400">Draft</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-sand/40">Visibility</span>
                    <span className="text-sand capitalize">{visibility}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1e1e1e] pt-6">
                <p className="text-[11px] font-mono uppercase tracking-widest text-sand/40 mb-3">Before publishing</p>
                <ul className="flex flex-col gap-2">
                  {[
                    { label: "Workflow has nodes", done: nodeCount > 0 },
                    { label: "Name is set", done: name.trim() !== "" },
                    { label: "Visibility chosen", done: true },
                  ].map(({ label, done }) => (
                    <li key={label} className="flex items-center gap-2 text-[12px]">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-orange/20 border border-orange/40" : "border border-[#333]"}`}>
                        {done && <Check size={8} strokeWidth={3} className="text-orange" />}
                      </div>
                      <span className={done ? "text-sand/60" : "text-sand/25"}>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!published && (
          <div className="px-12 py-5 border-t border-[#1e1e1e] shrink-0 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="text-[13px] text-sand/40 hover:text-sand transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!canPublish}
              onClick={handlePublish}
              className="flex items-center gap-1.5 bg-orange text-white text-[12px] font-bold px-6 py-2 disabled:opacity-30 hover:bg-orange/90 transition-colors cursor-pointer"
              style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
              Publish Workflow
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
