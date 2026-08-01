"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Check, ChevronRight, ImageIcon, Link2, Plus, Trash2, X } from "lucide-react";
import { FormInput } from "@/components/ui/form-input";
import { FormSelector } from "@/components/ui/form-selector";

type PricingModel = "free" | "per_request" | "per_token" | "fixed" | "subscription";
type FieldType = "text" | "number" | "textarea" | "select";

interface ConfigField {
  id: string;
  label: string;
  type: FieldType;
  placeholder: string;
  required: boolean;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
  repository: string;
  url: string;
  protocol: string;
  authentication: string;
  pricingModel: PricingModel;
  amount: string;
  currency: string;
  network: string;
  recipient: string;
}

const STEPS = [
  { label: "Identity", desc: "Name and description" },
  { label: "Endpoint", desc: "URL, protocol, auth" },
  { label: "Pricing & Payment", desc: "Rates and wallet" },
  { label: "Configuration", desc: "Fields users will configure" },
];

const EMPTY: FormData = {
  name: "", description: "", icon: "", repository: "", url: "", protocol: "https",
  authentication: "api_key", pricingModel: "per_request",
  amount: "", currency: "USDC", network: "base", recipient: "",
};

export function SubmitAgentModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [configFields, setConfigFields] = useState<ConfigField[]>([]);

  const set = (k: keyof FormData, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const canNext =
    step === 0 ? form.name.trim() !== "" && form.description.trim() !== ""
    : step === 1 ? form.url.trim() !== ""
    : step === 2 ? form.recipient.trim() !== ""
    : true;

  const addConfigField = () => {
    setConfigFields((prev) => [...prev, {
      id: `${Date.now()}`,
      label: "",
      type: "text",
      placeholder: "",
      required: false,
    }]);
  };

  const updateConfigField = (id: string, patch: Partial<ConfigField>) =>
    setConfigFields((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f));

  const removeConfigField = (id: string) =>
    setConfigFields((prev) => prev.filter((f) => f.id !== id));

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => { setStep(0); setForm(EMPTY); setConfigFields([]); }, 300);
  }

  function handleSubmit() {
    console.log("Submit agent:", form);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent
        aria-describedby={undefined}
        className="w-screen h-screen !max-w-none !max-h-none m-0 rounded-none bg-[#0f0f0f] border-0 p-0 gap-0 flex flex-col [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Submit Agent</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#1e1e1e] shrink-0">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-sand/50 hover:text-sand transition-colors cursor-pointer text-[13px]"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            Back
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
            <p className="text-sand text-xs font-mono uppercase tracking-widest">Provance Marketplace — List Your Agent</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — steps */}
          <div className="w-[30%] border-r border-[#1e1e1e] px-10 py-12 flex flex-col shrink-0">
            <p className="text-[11px] font-mono uppercase tracking-widest text-sand/40 mb-10">Steps</p>
            <div className="flex flex-col">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-colors ${
                        done ? "bg-orange text-white"
                        : active ? "border-2 border-orange text-orange bg-orange/10"
                        : "border border-[#333] text-sand/30"
                      }`}>
                        {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-px flex-1 ${done ? "bg-orange/40" : "bg-[#252525]"}`} />
                      )}
                    </div>
                    <div className="pt-1 pb-12">
                      <p className={`text-[14px] font-semibold leading-tight ${active ? "text-sand" : done ? "text-sand/60" : "text-sand/30"}`}>
                        {s.label}
                      </p>
                      <p className={`text-[12px] mt-1 ${active ? "text-sand/50" : "text-sand/20"}`}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — form */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-12 py-12">
              <div className="max-w-lg flex flex-col gap-6">
                <div>
                  <p className="text-[22px] font-semibold text-sand font-geist mb-1">{STEPS[step].label}</p>
                  <p className="text-[13px] text-sand/40">{STEPS[step].desc}</p>
                </div>

                {step === 0 && (
                  <>
                    {/* Icon upload */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-sand/40">Agent Icon</span>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-md bg-[#0c0c0c] border border-[#2a2a2a] flex items-center justify-center shrink-0 overflow-hidden">
                          {form.icon ? (
                            <Image src={form.icon} alt="icon preview" width={40} height={40} className="object-contain" />
                          ) : (
                            <ImageIcon size={20} strokeWidth={1.5} className="text-sand/20" />
                          )}
                        </div>
                        <label className="flex-1 flex items-center gap-2 h-[42px] bg-[#0c0c0c] border border-[#2a2a2a] rounded-sm px-3 cursor-pointer hover:border-sand/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) set("icon", URL.createObjectURL(file));
                            }}
                          />
                          <span className="text-[13px] text-sand/30">{form.icon ? "Change icon" : "Upload icon (PNG, SVG)"}</span>
                        </label>
                      </div>
                    </div>
                    <FormInput
                      label="Agent Name"
                      value={form.name}
                      onChange={(v) => set("name", v)}
                      placeholder="e.g. DeFi Risk Monitor"
                      required
                    />
                    <FormInput
                      label="Description"
                      value={form.description}
                      onChange={(v) => set("description", v)}
                      placeholder="What does this agent do and how does it work?"
                      type="textarea"
                      rows={5}
                      required
                    />
                    <FormInput
                      label="GitHub Repository"
                      value={form.repository}
                      onChange={(v) => set("repository", v)}
                      placeholder="https://github.com/you/your-agent"
                      prefix={<Link2 size={14} strokeWidth={1.5} className="text-sand/30 ml-3 shrink-0" />}
                    />
                  </>
                )}

                {step === 1 && (
                  <>
                    <FormInput
                      label="Endpoint URL"
                      value={form.url}
                      onChange={(v) => set("url", v)}
                      placeholder="https://your-agent.example.com/run"
                      required
                    />
                    <FormSelector
                      label="Protocol"
                      value={form.protocol}
                      onChange={(v) => set("protocol", v)}
                      options={[
                        { value: "https", label: "HTTPS" },
                        { value: "http", label: "HTTP" },
                        { value: "grpc", label: "gRPC" },
                        { value: "websocket", label: "WebSocket" },
                        { value: "mcp", label: "MCP" },
                      ]}
                    />
                    <FormSelector
                      label="Authentication"
                      value={form.authentication}
                      onChange={(v) => set("authentication", v)}
                      options={[
                        { value: "none", label: "None" },
                        { value: "api_key", label: "API Key" },
                        { value: "jwt", label: "JWT" },
                        { value: "oauth2", label: "OAuth2" },
                        { value: "wallet_signature", label: "Wallet Signature" },
                      ]}
                    />
                  </>
                )}

                {step === 2 && (
                  <>
                    <FormSelector
                      label="Pricing Model"
                      value={form.pricingModel}
                      onChange={(v) => set("pricingModel", v)}
                      options={[
                        { value: "free", label: "Free" },
                        { value: "per_request", label: "Per Request" },
                        { value: "per_token", label: "Per Token" },
                        { value: "fixed", label: "Fixed" },
                        { value: "subscription", label: "Subscription" },
                      ]}
                    />
                    {form.pricingModel !== "free" && (
                      <div className="flex gap-4">
                        <FormInput
                          label="Amount"
                          value={form.amount}
                          onChange={(v) => set("amount", v)}
                          placeholder="0.01"
                          type="number"
                          className="flex-1"
                        />
                        <FormSelector
                          label="Currency"
                          value={form.currency}
                          onChange={(v) => set("currency", v)}
                          options={[
                            { value: "USDC", label: "USDC" },
                            { value: "XLM", label: "XLM" },
                            { value: "ETH", label: "ETH" },
                          ]}
                          className="w-36"
                        />
                      </div>
                    )}
                    <FormSelector
                      label="Payment Network"
                      value={form.network}
                      onChange={(v) => set("network", v)}
                      options={[
                        { value: "stellar", label: "Stellar" },
                        { value: "base", label: "Base" },
                        { value: "ethereum", label: "Ethereum" },
                        { value: "celo", label: "Celo" },
                        { value: "solana", label: "Solana" },
                        { value: "polygon", label: "Polygon" },
                      ]}
                    />
                    <FormInput
                      label="Recipient Wallet"
                      value={form.recipient}
                      onChange={(v) => set("recipient", v)}
                      placeholder="0x… or G…"
                      required
                    />
                  </>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-4">
                    <p className="text-[13px] text-sand/40 leading-relaxed">
                      Define the fields users will fill in when they configure this agent in their workflow. These appear in the agent config panel.
                    </p>

                    {configFields.map((field, i) => (
                      <div key={field.id} className="flex flex-col gap-3 p-4 border border-[#2a2a2a] rounded-sm bg-[#0c0c0c]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-mono uppercase tracking-widest text-sand/30">Field {i + 1}</span>
                          <button
                            onClick={() => removeConfigField(field.id)}
                            className="w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/15 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 size={11} strokeWidth={2} className="text-sand/40 hover:text-red-400" />
                          </button>
                        </div>
                        <div className="flex gap-3">
                          <FormInput
                            label="Label"
                            value={field.label}
                            onChange={(v) => updateConfigField(field.id, { label: v })}
                            placeholder="e.g. API Key"
                            className="flex-1"
                          />
                          <FormSelector
                            label="Type"
                            value={field.type}
                            onChange={(v) => updateConfigField(field.id, { type: v as FieldType })}
                            options={[
                              { value: "text", label: "Text" },
                              { value: "number", label: "Number" },
                              { value: "textarea", label: "Textarea" },
                              { value: "select", label: "Select" },
                            ]}
                            className="w-36"
                          />
                        </div>
                        <FormInput
                          label="Placeholder"
                          value={field.placeholder}
                          onChange={(v) => updateConfigField(field.id, { placeholder: v })}
                          placeholder="e.g. Enter your API key"
                        />
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateConfigField(field.id, { required: e.target.checked })}
                            className="w-3.5 h-3.5 accent-orange cursor-pointer"
                          />
                          <span className="text-[12px] text-sand/50">Required</span>
                        </label>
                      </div>
                    ))}

                    <button
                      onClick={addConfigField}
                      className="flex items-center gap-2 text-[13px] text-sand/40 hover:text-sand border border-dashed border-[#2a2a2a] hover:border-sand/20 px-4 py-3 transition-colors cursor-pointer rounded-sm"
                    >
                      <Plus size={14} strokeWidth={2} />
                      Add config field
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-12 py-5 border-t border-[#1e1e1e] shrink-0 flex items-center justify-between">
              {step > 0 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="text-[13px] text-sand/40 hover:text-sand transition-colors cursor-pointer"
                >
                  Back
                </button>
              ) : <div />}

              {step < STEPS.length - 1 ? (
                <button
                  disabled={!canNext}
                  onClick={() => setStep((s) => s + 1)}
                  className="flex items-center gap-1.5 bg-sand text-ink-dark text-[12px] font-bold px-5 py-2 disabled:opacity-30 transition-opacity cursor-pointer"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                >
                  Next <ChevronRight size={13} strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  disabled={!canNext}
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 bg-orange text-white text-[12px] font-bold px-5 py-2 disabled:opacity-30 hover:bg-orange/90 transition-colors cursor-pointer"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                >
                  Submit Agent
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
