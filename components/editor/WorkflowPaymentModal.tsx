"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Wallet, AlertCircle, ChevronRight, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { parseUnits, createPublicClient, http, createWalletClient, custom } from "viem";
import type { WorkflowPaymentPlan, ChainPayment } from "@/lib/engine/payment";
import type { PermitSignature } from "@/lib/engine/types";

// ─── Chain metadata ───────────────────────────────────────────────────────────

const CHAIN_META: Record<number, { name: string; rpcUrl: string }> = {
  2345: { name: "GOAT Network", rpcUrl: "https://rpc.goat.network" },
  8453: { name: "Base", rpcUrl: "https://mainnet.base.org" },
  1:    { name: "Ethereum", rpcUrl: "https://eth.llamarpc.com" },
  137:  { name: "Polygon", rpcUrl: "https://polygon-rpc.com" },
  42161: { name: "Arbitrum", rpcUrl: "https://arb1.arbitrum.io/rpc" },
};

// EIP-2612 permit domain per chain token
const TOKEN_DOMAIN: Record<number, { name: string; version: string }> = {
  2345: { name: "Bridged USDC (Stargate)", version: "2" },
  8453: { name: "USD Coin", version: "2" },
};

const NONCES_ABI = [{
  name: "nonces",
  type: "function",
  stateMutability: "view",
  inputs: [{ name: "owner", type: "address" }],
  outputs: [{ name: "", type: "uint256" }],
}] as const;

const PERMIT_TYPES = {
  Permit: [
    { name: "owner",    type: "address" },
    { name: "spender",  type: "address" },
    { name: "value",    type: "uint256" },
    { name: "nonce",    type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStatus = "idle" | "switching" | "signing" | "authorized" | "failed";

interface ChainAuthState {
  status: AuthStatus;
  permit?: PermitSignature;
  error?: string;
}

// ─── EVM wallet helper ────────────────────────────────────────────────────────

function getEthereum() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).ethereum as {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  } | undefined;
}

async function switchToChain(chainId: number) {
  const eth = getEthereum();
  if (!eth) throw new Error("No EVM wallet found. Install MetaMask or Coinbase Wallet.");
  await eth.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: `0x${chainId.toString(16)}` }],
  });
}

async function signPermit(
  chainId: number,
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
  amountUsd: number,
  rpcUrl: string,
): Promise<PermitSignature> {
  const eth = getEthereum();
  if (!eth) throw new Error("No EVM wallet found.");

  // Force MetaMask to show account picker so user can select the right wallet
  await eth.request({
    method: "wallet_requestPermissions",
    params: [{ eth_accounts: {} }],
  });
  const accounts = await eth.request({ method: "eth_accounts" }) as string[];
  if (!accounts.length) throw new Error("No account selected.");
  const owner = accounts[0] as `0x${string}`;

  const publicClient = createPublicClient({ transport: http(rpcUrl) });

  const nonce = await publicClient.readContract({
    address: tokenAddress,
    abi: NONCES_ABI,
    functionName: "nonces",
    args: [owner],
  });

  const deadline = Math.floor(Date.now() / 1000) + 600; // 10 min
  const value = parseUnits(amountUsd.toFixed(6), 6);
  const domain = TOKEN_DOMAIN[chainId] ?? { name: "USD Coin", version: "2" };

  const walletClient = createWalletClient({ account: owner, transport: custom(eth) });

  const signature = await walletClient.signTypedData({
    domain: {
      name: domain.name,
      version: domain.version,
      chainId,
      verifyingContract: tokenAddress,
    },
    types: PERMIT_TYPES,
    primaryType: "Permit",
    message: {
      owner,
      spender: spenderAddress,
      value,
      nonce,
      deadline: BigInt(deadline),
    },
  });

  // Split signature into v, r, s
  const r = signature.slice(0, 66) as `0x${string}`;
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
  const v = parseInt(signature.slice(130, 132), 16);

  return {
    owner,
    spender: spenderAddress,
    value: value.toString(),
    deadline,
    nonce: Number(nonce),
    v,
    r,
    s,
  };
}

// ─── Chain auth row ───────────────────────────────────────────────────────────

function ChainRow({
  chain,
  state,
  onAuthorize,
}: {
  chain: ChainPayment;
  state: ChainAuthState;
  onAuthorize: () => void;
}) {
  const meta = CHAIN_META[chain.chainId];
  const chainName = meta?.name ?? `Chain ${chain.chainId}`;
  const { status, error } = state;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ background: "oklch(18% 0 0)", border: "1px solid oklch(28% 0 0)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-white">{chainName}</p>
          <p className="text-[11px] text-white/40 mt-0.5">{chain.token} · {chain.nodes.length} action{chain.nodes.length !== 1 ? "s" : ""}</p>
        </div>
        <p className="text-[15px] font-bold text-white">${chain.total}</p>
      </div>

      <div className="flex flex-col gap-1">
        {chain.nodes.map((n) => (
          <div key={n.nodeId} className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">{n.label} · {n.actionLabel}</span>
            <span className="text-[11px] text-white/50">${n.price}</span>
          </div>
        ))}
      </div>

      {status === "authorized" ? (
        <div className="flex items-center gap-2 text-[12px]" style={{ color: "oklch(63.2% 0.186 147.37)" }}>
          <Check size={13} strokeWidth={2.5} />
          <span>Authorized</span>
          <span className="ml-auto text-[10px] text-white/30">Funds move only when agent runs</span>
        </div>
      ) : status === "failed" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[12px] text-red-400">
            <AlertCircle size={13} strokeWidth={2} />
            <span>{error ?? "Authorization failed"}</span>
          </div>
          <button
            onClick={onAuthorize}
            className="w-full py-2 text-[12px] font-medium text-white rounded-md transition-colors cursor-pointer"
            style={{ background: "oklch(30% 0 0)", border: "1px solid oklch(45% 0 0)" }}
          >
            Try again
          </button>
        </div>
      ) : (
        <button
          onClick={onAuthorize}
          disabled={status === "switching" || status === "signing"}
          className="w-full flex items-center justify-center gap-2 py-2 text-[12px] font-medium text-white rounded-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "oklch(26% 0 0)", border: "1px solid oklch(42% 0 0)" }}
        >
          {status === "switching" ? (
            <><Loader2 size={12} className="animate-spin" /> Switching network…</>
          ) : status === "signing" ? (
            <><Loader2 size={12} className="animate-spin" /> Sign in wallet…</>
          ) : (
            <><ShieldCheck size={12} strokeWidth={2} /> Authorize ${chain.total} on {chainName} <ChevronRight size={12} strokeWidth={2} /></>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface WorkflowPaymentModalProps {
  open: boolean;
  plan: WorkflowPaymentPlan;
  onApproved: (permits: Record<number, PermitSignature>) => void;
  onCancel: () => void;
}

export function WorkflowPaymentModal({ open, plan, onApproved, onCancel }: WorkflowPaymentModalProps) {
  const [states, setStates] = useState<Record<number, ChainAuthState>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<number, ChainAuthState> = {};
      for (const c of plan.chains) initial[c.chainId] = { status: "idle" };
      setStates(initial);
    }
  }, [open, plan]);

  const allAuthorized = plan.chains.every((c) => states[c.chainId]?.status === "authorized");

  const handleAuthorize = async (chain: ChainPayment) => {
    const meta = CHAIN_META[chain.chainId];
    const spender = chain.nodes[0]?.agentWallet as `0x${string}` | undefined;

    if (!spender || spender === "0x0000000000000000000000000000000000000000") {
      setStates((prev) => ({
        ...prev,
        [chain.chainId]: { status: "failed", error: `No wallet configured for ${meta?.name ?? "this chain"}.` },
      }));
      return;
    }

    setStates((prev) => ({ ...prev, [chain.chainId]: { status: "switching" } }));
    try {
      await switchToChain(chain.chainId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network switch failed";
      const cancelled = msg.includes("4001") || msg.toLowerCase().includes("rejected");
      setStates((prev) => ({
        ...prev,
        [chain.chainId]: cancelled ? { status: "idle" } : { status: "failed", error: msg },
      }));
      return;
    }

    setStates((prev) => ({ ...prev, [chain.chainId]: { status: "signing" } }));
    try {
      const permit = await signPermit(
        chain.chainId,
        chain.tokenAddress as `0x${string}`,
        spender,
        chain.total,
        meta?.rpcUrl ?? "",
      );
      setStates((prev) => ({ ...prev, [chain.chainId]: { status: "authorized", permit } }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Signing failed";
      const cancelled = msg.includes("4001") || msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("cancel");
      setStates((prev) => ({
        ...prev,
        [chain.chainId]: cancelled ? { status: "idle" } : { status: "failed", error: msg },
      }));
    }
  };

  const handleRun = () => {
    const permits: Record<number, PermitSignature> = {};
    for (const chain of plan.chains) {
      const permit = states[chain.chainId]?.permit;
      if (permit) permits[chain.chainId] = permit;
    }
    onApproved(permits);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        className="bg-[#111] border border-[#2a2a2a] p-0 rounded-xl shadow-2xl sm:max-w-[420px]"
      >
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "oklch(22% 0 0)", border: "1px solid oklch(40% 0 0)" }}>
              <Wallet size={15} strokeWidth={1.8} className="text-white/70" />
            </div>
            <DialogTitle className="text-[15px] font-semibold text-white">Authorize workflow</DialogTitle>
          </div>
          <DialogDescription className="text-[12px] text-white/40 ml-11">
            Sign to authorize each agent. No money moves until the agent runs — your signature lets the agent pull exactly what it charges.
          </DialogDescription>
        </div>

        <div className="px-6 py-4 flex flex-col gap-3">
          {plan.chains.map((chain) => (
            <ChainRow
              key={chain.chainId}
              chain={chain}
              state={states[chain.chainId] ?? { status: "idle" }}
              onAuthorize={() => void handleAuthorize(chain)}
            />
          ))}
        </div>

        <div className="px-6 pb-5 flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-[13px] text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={!allAuthorized}
            className="flex-1 py-2.5 text-[13px] font-medium text-white rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: allAuthorized ? "oklch(26% 0.05 145)" : "oklch(26% 0 0)", border: `1px solid ${allAuthorized ? "oklch(50% 0.1 145)" : "oklch(35% 0 0)"}` }}
          >
            {allAuthorized ? "Run workflow" : `Authorize ${plan.chains.filter((c) => states[c.chainId]?.status !== "authorized").length} remaining`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
