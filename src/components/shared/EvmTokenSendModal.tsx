import { useEffect, useState, type FormEvent } from "react";
import { Check, Loader2, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getEvmSendNetworks, getEvmTokenMetadata, sendEvmToken, type EvmTokenMetadata } from "@/services/evm-transfer.service";
import { walletService, type EvmTokenRisk, type EvmTokenVerification, type WalletChain } from "@/services/wallet.service";

function formatUsd(value: number): string {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: value < 100 ? 2 : 0 });
}

interface EvmTokenSendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
  walletChain: WalletChain;
  onSubmitted?: () => void;
}

export function EvmTokenSendModal({ open, onOpenChange, source, walletChain, onSubmitted }: EvmTokenSendModalProps) {
  const networks = getEvmSendNetworks(walletChain);
  const [chainId, setChainId] = useState(networks[0]?.id ?? 1);
  const [tokenAddress, setTokenAddress] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<EvmTokenMetadata | null>(null);
  const [risk, setRisk] = useState<EvmTokenRisk | null>(null);
  const [riskError, setRiskError] = useState("");
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [verification, setVerification] = useState<EvmTokenVerification | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [busy, setBusy] = useState(false);
  async function loadToken() {
    setBusy(true);
    setToken(null);
    setRisk(null);
    setRiskError("");
    setVerification(null);
    setVerificationError("");
    try {
      const metadata = await getEvmTokenMetadata(chainId, tokenAddress.trim());
      setToken(metadata);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read token details on this network");
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoadingRisk(true);
    void walletService.scanEvmTokenRisk(token.address, chainId)
      .then((result) => { if (!cancelled) setRisk(result); })
      .catch((error: unknown) => { if (!cancelled) setRiskError(error instanceof Error ? error.message : "Token risk scan is unavailable"); })
      .finally(() => { if (!cancelled) setLoadingRisk(false); });
    return () => { cancelled = true; };
  }, [chainId, token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoadingVerification(true);
    void walletService.verifyEvmToken(token.address, chainId)
      .then((result) => { if (!cancelled) setVerification(result); })
      .catch((error: unknown) => { if (!cancelled) setVerificationError(error instanceof Error ? error.message : "GeckoTerminal verification is unavailable"); })
      .finally(() => { if (!cancelled) setLoadingVerification(false); });
    return () => { cancelled = true; };
  }, [chainId, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      const result = await sendEvmToken({ source, destination: destination.trim(), token, amount: amount.trim(), chainId });
      toast.success(result.historySaved
        ? `Token transfer recorded: ${result.hash.slice(0, 10)}…`
        : `Transfer submitted: ${result.hash.slice(0, 10)}… (activity could not be saved)`);
      onSubmitted?.();
      setDestination("");
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Token transfer failed");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[440px] [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Send EVM token</DialogTitle>
            <DialogDescription className="text-[11px] text-white/40 mt-1">Read the token metadata from the selected network, then review and sign in your wallet.</DialogDescription>
          </div>
          <button onClick={() => onOpenChange(false)} disabled={busy} aria-label="Close token send dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center disabled:opacity-40"><X size={14} className="text-white/70" /></button>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)} className="p-6 space-y-4">
          <label className="block text-[11px] text-white/50">Network
            <select value={chainId} onChange={(event) => { setChainId(Number(event.target.value)); setToken(null); }} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">
              {networks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-[11px] text-white/50">From
            <input readOnly value={source} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[10px] text-white/60 font-mono outline-none" />
          </label>
          <label className="block text-[11px] text-white/50">Token contract address
            <div className="mt-1.5 flex gap-2">
              <input required value={tokenAddress} onChange={(event) => { setTokenAddress(event.target.value); setToken(null); }} placeholder="0x…" className="min-w-0 flex-1 bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white font-mono outline-none focus:border-white/30" />
              <button type="button" onClick={() => void loadToken()} disabled={busy || !tokenAddress.trim()} className="flex items-center gap-1.5 border border-white/15 px-3 text-[10px] text-white/75 disabled:opacity-40">{busy && !token ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}Read</button>
            </div>
          </label>
          {token && <p className="text-[10px] text-emerald-200/75">{token.symbol} · {token.decimals} decimals · {token.address.slice(0, 8)}…{token.address.slice(-6)}</p>}
          {token && (verification ? <div className={`border px-3 py-2 text-[10px] ${verification.verified ? "border-emerald-300/20 bg-emerald-300/5 text-emerald-100/75" : "border-amber-300/25 bg-amber-300/5 text-amber-100/80"}`}>
            <p className="font-semibold">GeckoTerminal: {verification.verified ? "verified by policy" : "not verified by policy"}{verification.gtVerified ? " · GT Verified" : " · no GT Verified badge"}{verification.gtScore !== null ? ` · score ${verification.gtScore.toFixed(1)}` : ""}</p>
            <p className="mt-1">Liquidity {formatUsd(verification.liquidityUsd)} · 24h volume {formatUsd(verification.volume24hUsd)}{verification.holders !== null ? ` · ${verification.holders.toLocaleString()} holders` : ""}</p>
            {!verification.verified && <p className="mt-1 leading-relaxed">{verification.signals.join(" · ")}</p>}
          </div> : loadingVerification ? <p className="text-[10px] text-white/40">Checking GeckoTerminal verification… you can continue while this loads.</p> : verificationError ? <p className="text-[10px] text-white/40">GeckoTerminal verification unavailable: {verificationError}</p> : null)}
          {token && (risk ? <div className={`border px-3 py-2 text-[10px] ${risk.risk_level === "low" ? "border-emerald-300/20 bg-emerald-300/5 text-emerald-100/75" : "border-amber-300/25 bg-amber-300/5 text-amber-100/80"}`}>
            <p className="font-semibold">GoPlus risk: {risk.risk_level}{risk.passed ? " · passed basic checks" : " · review before sending"}</p>
            {risk.risk_flags.length > 0 && <p className="mt-1 leading-relaxed">{risk.risk_flags.join(" · ")}</p>}
          </div> : loadingRisk ? <p className="text-[10px] text-white/40">Checking GoPlus risk signals… you can continue while this loads.</p> : riskError ? <p className="border border-amber-300/20 px-3 py-2 text-[10px] text-amber-100/70">Risk scan unavailable: {riskError}. You can still review and send; verify the contract independently.</p> : null)}
          <label className="block text-[11px] text-white/50">Destination address
            <input required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="0x…" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white font-mono outline-none focus:border-white/30" />
          </label>
          <label className="block text-[11px] text-white/50">Amount {token ? `(${token.symbol})` : ""}
            <input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" disabled={!token} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none disabled:opacity-40" />
          </label>
          <p className="text-[10px] leading-relaxed text-white/35">GeckoTerminal verification and GoPlus results are advisory signals and cannot guarantee token safety. Verify the contract address and destination carefully. Risk warnings do not prevent a user-approved send.</p>
          <button type="submit" disabled={busy || !token || !destination.trim() || !amount.trim()} className="w-full flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-4 py-3 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}{busy ? "Waiting for wallet…" : "Review and sign in wallet"}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
