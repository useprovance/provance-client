"use client";

import { useState } from "react";
import { createWalletClient, custom } from "viem";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, Loader2, Search, X } from "lucide-react";

type AgentPreview = {
  agent_id: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  chain_id: number;
  supported_protocols: string[];
  owner_address: string;
  tags: string[];
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  42220: "Celo",
  137: "Polygon",
  10: "Optimism",
  42161: "Arbitrum",
  56: "BSC",
  100: "Gnosis",
};

export function SubmitAgentModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
}) {
  const [agentId, setAgentId] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AgentPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setAgentId("");
      setFetching(false);
      setFetchError(null);
      setPreview(null);
      setMessage(null);
      setSigning(false);
      setSignError(null);
      setClaimed(false);
    }, 300);
  }

  async function handleLookup() {
    const id = agentId.trim();
    if (!id) return;
    setFetching(true);
    setFetchError(null);
    setPreview(null);
    setSignError(null);
    try {
      const res = await fetch(`/api/agents/claim?agent_id=${encodeURIComponent(id)}`);
      const data = await res.json() as { error?: string; agent?: AgentPreview; message?: string };
      if (!res.ok) { setFetchError(data.error ?? "Agent not found"); return; }
      setPreview(data.agent!);
      setMessage(data.message!);
    } catch {
      setFetchError("Could not reach 8004scan. Try again.");
    } finally {
      setFetching(false);
    }
  }

  async function handleClaim() {
    if (!preview || !message) return;
    setSigning(true);
    setSignError(null);
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No wallet found. Install MetaMask or another EVM wallet.");
      }
      await window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
      const client = createWalletClient({ transport: custom(window.ethereum) });
      const [account] = await client.requestAddresses();
      const signature = await client.signMessage({ account, message });

      const res = await fetch("/api/agents/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: preview.agent_id, signature }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setSignError(data.error ?? "Claim failed"); return; }
      setClaimed(true);
      onCreated?.();
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSigning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent
        aria-describedby={undefined}
        className="w-screen h-screen !max-w-none !max-h-none m-0 rounded-none bg-[#0f0f0f] border-0 p-0 gap-0 flex flex-col [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Claim Agent</DialogTitle>

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
            <p className="text-sand text-xs font-mono uppercase tracking-widest">
              Provance Marketplace — Claim Your Agent
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-12 py-12">
          <div className="max-w-lg flex flex-col gap-8">

            {claimed ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <CheckCircle2 size={48} strokeWidth={1.5} className="text-orange" />
                <p className="text-sand text-[18px] font-semibold">Agent claimed</p>
                <p className="text-sand/40 text-[13px] text-center">Your agent is now in your dashboard.</p>
                <button
                  onClick={handleClose}
                  className="mt-4 bg-orange text-white text-[12px] font-bold px-6 py-2 hover:bg-orange/90 transition-colors cursor-pointer"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[22px] font-semibold text-sand font-geist mb-1">Claim Agent</p>
                  <p className="text-[13px] text-sand/40">
                    Paste your agent URL from 8004scan. We will verify ownership with a wallet signature.
                  </p>
                </div>

                {/* Input */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-sand/40">Agent ID</span>
                  <div className="flex gap-2">
                    <input
                      value={agentId}
                      onChange={(e) => {
                        setAgentId(e.target.value);
                        setFetchError(null);
                        if (preview) { setPreview(null); setMessage(null); }
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleLookup(); }}
                      placeholder="https://8004scan.io/agents/celo/9173"
                      className="flex-1 h-[42px] bg-[#0c0c0c] border border-[#2a2a2a] text-sand text-[13px] px-3 outline-none focus:border-sand/30 placeholder:text-sand/20 transition-colors"
                    />
                    <button
                      onClick={() => void handleLookup()}
                      disabled={!agentId.trim() || fetching}
                      className="flex items-center gap-2 bg-sand text-ink-dark text-[12px] font-bold px-4 h-[42px] disabled:opacity-30 hover:bg-sand/90 transition-colors cursor-pointer shrink-0"
                      style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
                    >
                      {fetching
                        ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                        : <Search size={13} strokeWidth={2} />
                      }
                      {fetching ? "Looking up…" : "Look up"}
                    </button>
                  </div>
                  {fetchError && <p className="text-[11px] text-red-400">{fetchError}</p>}
                  <p className="text-[11px] text-sand/30">
                    Go to your agent on 8004scan.io and paste the URL. You can also use the short form: celo/9173
                  </p>
                </div>

                {/* Preview */}
                {preview && (
                  <div className="flex flex-col gap-4 p-5 border border-[#2a2a2a] bg-[#0c0c0c]">
                    <div className="flex items-start gap-4">
                      {preview.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={preview.image_url}
                          alt=""
                          className="w-12 h-12 rounded-md object-cover shrink-0 border border-[#2a2a2a]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] shrink-0 flex items-center justify-center">
                          <span className="text-sand/20 text-[18px]">◈</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sand text-[15px] font-semibold leading-tight">
                            {preview.name ?? "Unnamed Agent"}
                          </p>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-orange bg-orange/10 px-2 py-0.5">
                            {CHAIN_NAMES[preview.chain_id] ?? `Chain ${preview.chain_id}`}
                          </span>
                        </div>
                        {preview.description && (
                          <p className="text-sand/50 text-[12px] mt-1 leading-relaxed line-clamp-2">
                            {preview.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {preview.supported_protocols.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {preview.supported_protocols.map((p) => (
                          <span
                            key={p}
                            className="text-[10px] font-mono uppercase tracking-widest text-sand/50 bg-white/5 border border-[#2a2a2a] px-2 py-0.5"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-[#1e1e1e] pt-4 flex flex-col gap-1">
                      <p className="text-[11px] font-mono uppercase tracking-widest text-sand/30">Owner address</p>
                      <p className="text-[12px] text-sand/60 font-mono break-all">{preview.owner_address}</p>
                    </div>

                    <div className="bg-orange/5 border border-orange/20 px-4 py-3">
                      <p className="text-[12px] text-sand/60 leading-relaxed">
                        Sign with the wallet at the address above to confirm you own this agent. No gas is needed.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        {preview && !claimed && (
          <div className="px-12 py-5 border-t border-[#1e1e1e] shrink-0 flex items-center justify-end gap-3">
            {signError && <p className="text-[11px] text-red-400 mr-auto">{signError}</p>}
            <button
              disabled={signing}
              onClick={() => void handleClaim()}
              className="flex items-center gap-2 bg-orange text-white text-[12px] font-bold px-5 py-2 disabled:opacity-30 hover:bg-orange/90 transition-colors cursor-pointer"
              style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
              {signing && <Loader2 size={13} strokeWidth={2} className="animate-spin" />}
              {signing ? "Signing…" : "Sign & Claim"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
