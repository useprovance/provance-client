"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronRight, Check } from "lucide-react";

type Protocol = "http" | "https" | "grpc" | "websocket" | "mcp";
type AuthType = "none" | "api_key" | "jwt" | "oauth2" | "wallet_signature";
type PricingModel = "free" | "fixed" | "per_request" | "per_token";
type Network = "stellar" | "ethereum" | "base" | "celo" | "solana" | "polygon";

interface FormData {
  name: string;
  description: string;
  visibility: "public" | "private" | "unlisted";
  url: string;
  protocol: Protocol;
  authentication: AuthType;
  version: string;
  pricingModel: PricingModel;
  amount: string;
  currency: string;
  network: Network;
  recipient: string;
}

const STEPS = ["Identity", "Endpoint", "Pricing & Payment"];

const FIELD = "flex flex-col gap-1.5";
const LABEL = "text-[11px] font-mono uppercase tracking-widest text-sand/40";
const INPUT =
  "w-full bg-[#111] border border-[#2a2a2a] text-[13px] text-sand placeholder:text-sand/25 px-3 py-2.5 outline-none focus:border-sand/30 transition-colors rounded-sm";
const SELECT =
  "w-full bg-[#111] border border-[#2a2a2a] text-[13px] text-sand px-3 py-2.5 outline-none focus:border-sand/30 transition-colors rounded-sm appearance-none cursor-pointer";

function StepDot({ index, current }: { index: number; current: number }) {
  const done = index < current;
  const active = index === current;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
          done
            ? "bg-orange text-white"
            : active
            ? "bg-orange/20 border border-orange text-orange"
            : "bg-white/5 border border-white/10 text-sand/30"
        }`}
      >
        {done ? <Check size={11} strokeWidth={3} /> : index + 1}
      </div>
      <span
        className={`text-[12px] font-medium ${
          active ? "text-sand" : done ? "text-sand/50" : "text-sand/25"
        }`}
      >
        {STEPS[index]}
      </span>
    </div>
  );
}

export function NewAgentSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    visibility: "public",
    url: "",
    protocol: "https",
    authentication: "api_key",
    version: "1.0.0",
    pricingModel: "per_request",
    amount: "",
    currency: "USDC",
    network: "base",
    recipient: "",
  });

  const set = (k: keyof FormData, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const canNext =
    step === 0
      ? form.name.trim() !== "" && form.description.trim() !== ""
      : step === 1
      ? form.url.trim() !== ""
      : form.recipient.trim() !== "";

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setStep(0);
      setForm({
        name: "",
        description: "",
        visibility: "public",
        url: "",
        protocol: "https",
        authentication: "api_key",
        version: "1.0.0",
        pricingModel: "per_request",
        amount: "",
        currency: "USDC",
        network: "base",
        recipient: "",
      });
    }, 300);
  }

  function handleSubmit() {
    // TODO: POST to API
    console.log("New agent payload:", form);
    handleClose();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="w-[420px] bg-[#141414] border-sand/10 p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-sand/10 shrink-0">
          <SheetTitle className="text-[14px] font-semibold text-sand">
            Register Agent
          </SheetTitle>
          <p className="text-[12px] text-sand/40 mt-0.5">
            Connect your hosted agent to the Provance network.
          </p>
        </SheetHeader>

        {/* Step indicators */}
        <div className="flex flex-col gap-3 px-6 py-5 border-b border-sand/10 shrink-0">
          {STEPS.map((_, i) => (
            <StepDot key={i} index={i} current={step} />
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className={FIELD}>
                <label className={LABEL}>Agent Name</label>
                <input
                  className={INPUT}
                  placeholder="e.g. DeFi Risk Monitor"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div className={FIELD}>
                <label className={LABEL}>Description</label>
                <textarea
                  className={`${INPUT} resize-none h-24`}
                  placeholder="What does this agent do?"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div className={FIELD}>
                <label className={LABEL}>Visibility</label>
                <select
                  className={SELECT}
                  value={form.visibility}
                  onChange={(e) => set("visibility", e.target.value)}
                >
                  <option value="public">Public — anyone can discover</option>
                  <option value="unlisted">Unlisted — accessible by link</option>
                  <option value="private">Private — only you</option>
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className={FIELD}>
                <label className={LABEL}>Endpoint URL</label>
                <input
                  className={INPUT}
                  placeholder="https://your-agent.example.com"
                  value={form.url}
                  onChange={(e) => set("url", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={FIELD}>
                  <label className={LABEL}>Protocol</label>
                  <select
                    className={SELECT}
                    value={form.protocol}
                    onChange={(e) => set("protocol", e.target.value)}
                  >
                    <option value="https">HTTPS</option>
                    <option value="http">HTTP</option>
                    <option value="grpc">gRPC</option>
                    <option value="websocket">WebSocket</option>
                    <option value="mcp">MCP</option>
                  </select>
                </div>
                <div className={FIELD}>
                  <label className={LABEL}>Version</label>
                  <input
                    className={INPUT}
                    placeholder="1.0.0"
                    value={form.version}
                    onChange={(e) => set("version", e.target.value)}
                  />
                </div>
              </div>
              <div className={FIELD}>
                <label className={LABEL}>Authentication</label>
                <select
                  className={SELECT}
                  value={form.authentication}
                  onChange={(e) => set("authentication", e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="api_key">API Key</option>
                  <option value="jwt">JWT</option>
                  <option value="oauth2">OAuth2</option>
                  <option value="wallet_signature">Wallet Signature</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className={FIELD}>
                <label className={LABEL}>Pricing Model</label>
                <select
                  className={SELECT}
                  value={form.pricingModel}
                  onChange={(e) => set("pricingModel", e.target.value)}
                >
                  <option value="free">Free</option>
                  <option value="per_request">Per Request</option>
                  <option value="per_token">Per Token</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              {form.pricingModel !== "free" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className={FIELD}>
                    <label className={LABEL}>Amount</label>
                    <input
                      className={INPUT}
                      placeholder="0.01"
                      type="number"
                      step="0.001"
                      min="0"
                      value={form.amount}
                      onChange={(e) => set("amount", e.target.value)}
                    />
                  </div>
                  <div className={FIELD}>
                    <label className={LABEL}>Currency</label>
                    <select
                      className={SELECT}
                      value={form.currency}
                      onChange={(e) => set("currency", e.target.value)}
                    >
                      <option value="USDC">USDC</option>
                      <option value="XLM">XLM</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>
                </div>
              )}
              <div className={FIELD}>
                <label className={LABEL}>Payment Network</label>
                <select
                  className={SELECT}
                  value={form.network}
                  onChange={(e) => set("network", e.target.value)}
                >
                  <option value="stellar">Stellar</option>
                  <option value="base">Base</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="celo">Celo</option>
                  <option value="solana">Solana</option>
                  <option value="polygon">Polygon</option>
                </select>
              </div>
              <div className={FIELD}>
                <label className={LABEL}>Recipient Wallet</label>
                <input
                  className={INPUT}
                  placeholder="0x… or G…"
                  value={form.recipient}
                  onChange={(e) => set("recipient", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-sand/10 shrink-0 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-[13px] text-sand/50 hover:text-sand transition-colors cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <button
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 bg-sand text-ink-dark text-[13px] font-bold px-5 py-2 disabled:opacity-30 transition-opacity cursor-pointer"
              style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
              Next <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              disabled={!canNext}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 bg-orange text-white text-[13px] font-bold px-5 py-2 disabled:opacity-30 transition-opacity cursor-pointer hover:bg-orange/90"
              style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
              Register Agent
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
