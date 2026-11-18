import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { stellarTransferService } from "@/services/stellar-transfer.service";
import { walletService, type StellarTokenRisk } from "@/services/wallet.service";

interface StellarSendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
  onSubmitted?: () => void;
}

export function StellarSendModal({ open, onOpenChange, source, onSubmitted }: StellarSendModalProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [assetType, setAssetType] = useState<"native" | "issued">("native");
  const [assetCode, setAssetCode] = useState("");
  const [assetIssuer, setAssetIssuer] = useState("");
  const [risk, setRisk] = useState<StellarTokenRisk | null>(null);
  const [riskError, setRiskError] = useState("");
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [sending, setSending] = useState(false);

  const trimmedCode = assetCode.trim().toUpperCase();
  const trimmedIssuer = assetIssuer.trim();
  const canScan = assetType === "issued" && /^[a-zA-Z0-9]{1,12}$/.test(trimmedCode) && /^G[A-Z2-7]{55}$/.test(trimmedIssuer);

  useEffect(() => {
    setRisk(null);
    setRiskError("");
    if (!canScan) { setLoadingRisk(false); return; }
    let cancelled = false;
    setLoadingRisk(true);
    const timer = setTimeout(() => {
      void walletService.scanStellarTokenRisk(trimmedCode, trimmedIssuer)
        .then((result) => { if (!cancelled) setRisk(result); })
        .catch((error: unknown) => { if (!cancelled) setRiskError(error instanceof Error ? error.message : "Asset risk check is unavailable"); })
        .finally(() => { if (!cancelled) setLoadingRisk(false); });
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [canScan, trimmedCode, trimmedIssuer]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    try {
      const hash = await stellarTransferService.sendNative(source, destination.trim(), amount.trim(), assetType === "issued" ? { code: assetCode.trim(), issuer: assetIssuer.trim() } : undefined);
      toast.success(`Payment submitted: ${hash.slice(0, 10)}…`);
      onSubmitted?.();
      setDestination("");
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!sending) onOpenChange(next); }}>
      <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[420px] [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Send Stellar asset</DialogTitle>
            <DialogDescription className="text-[11px] text-white/40 mt-1">Send XLM or a Stellar-issued asset. Review the transaction and fee in Freighter before signing.</DialogDescription>
          </div>
          <button onClick={() => onOpenChange(false)} disabled={sending} aria-label="Close send dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center disabled:opacity-40">
            <X size={14} className="text-white/70" />
          </button>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)} className="p-6 space-y-4">
          <label className="block text-[11px] text-white/50">
            Asset
            <select value={assetType} onChange={(event) => setAssetType(event.target.value as "native" | "issued")} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">
              <option value="native">Native XLM</option>
              <option value="issued">Issued asset (code and issuer)</option>
            </select>
          </label>
          {assetType === "issued" && <>
            <label className="block text-[11px] text-white/50">Asset code<input required maxLength={12} value={assetCode} onChange={(event) => setAssetCode(event.target.value)} placeholder="USDC" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white font-mono outline-none focus:border-white/30" /></label>
            <label className="block text-[11px] text-white/50">Asset issuer public address<input required value={assetIssuer} onChange={(event) => setAssetIssuer(event.target.value)} placeholder="G…" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white font-mono outline-none focus:border-white/30" /></label>
            {canScan && (risk ? <div className={`border px-3 py-2 text-[10px] ${risk.riskLevel === "low" ? "border-emerald-300/20 bg-emerald-300/5 text-emerald-100/75" : risk.riskLevel === "caution" ? "border-amber-300/25 bg-amber-300/5 text-amber-100/80" : "border-red-300/25 bg-red-300/5 text-red-100/80"}`}>
              <p className="font-semibold">Stellar risk: {risk.riskLevel} · {risk.network}{risk.passed ? " · passed basic checks" : " · review before sending"}</p>
              {risk.stats && <p className="mt-1">Trustlines: {risk.stats.trustlines} · Supply: {Number(risk.stats.supply).toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>}
              {risk.signals.length > 0 && <ul className="mt-1 space-y-0.5">{risk.signals.map((signal) => <li key={signal.message}>{signal.level === "info" ? "·" : "!"} {signal.message}</li>)}</ul>}
            </div> : loadingRisk ? <p className="text-[10px] text-white/40">Checking issuer flags and the on-chain asset record… you can continue while this loads.</p> : riskError ? <p className="border border-amber-300/20 px-3 py-2 text-[10px] text-amber-100/70">Risk check unavailable: {riskError}. You can still review and send; verify the issuer independently.</p> : null)}
            <p className="text-[10px] leading-relaxed text-amber-200/60">Verify the issuer from a trusted source. The receiving account needs a trustline, and network minimum-balance rules apply.</p>
          </>}
          <label className="block text-[11px] text-white/50">
            From
            <input readOnly value={source} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white/60 font-mono outline-none" />
          </label>
          <label className="block text-[11px] text-white/50">
            Destination Stellar address
            <input required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="G…" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white font-mono outline-none focus:border-white/30" />
          </label>
          <label className="block text-[11px] text-white/50">
            Amount ({assetType === "native" ? "XLM" : assetCode.trim() || "asset"})
            <input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none focus:border-white/30" />
          </label>
          <p className="text-[10px] leading-relaxed text-white/35">The transaction is submitted to the network reported by your connected wallet. Stellar risk signals are advisory and cannot guarantee asset safety. Provance never receives your private key.</p>
          <button type="submit" disabled={sending || !destination.trim() || !amount.trim()} className="w-full flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-4 py-3 disabled:opacity-50">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
            {sending ? "Waiting for wallet…" : "Review and sign in Freighter"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
