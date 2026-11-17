import { useState, type FormEvent } from "react";
import { ArrowDownUp, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { stellarSwapService, type StellarSwapAsset, type StellarSwapQuote } from "@/services/stellar-swap.service";

interface StellarSwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  onSubmitted?: () => void;
}

export function StellarSwapModal({ open, onOpenChange, address, onSubmitted }: StellarSwapModalProps) {
  const [fromAsset, setFromAsset] = useState<StellarSwapAsset>("XLM");
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(100);
  const [quote, setQuote] = useState<StellarSwapQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toAsset: StellarSwapAsset = fromAsset === "XLM" ? "USDC" : "XLM";

  async function requestQuote(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoadingQuote(true);
    setQuote(null);
    try {
      const nextQuote = await stellarSwapService.quote({ address, fromAsset, toAsset, amount: amount.trim(), slippageBps });
      setQuote(nextQuote);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not get a swap quote");
    } finally {
      setLoadingQuote(false);
    }
  }

  async function executeSwap() {
    if (!quote) return;
    setSubmitting(true);
    try {
      const hash = await stellarSwapService.signAndSubmit(address, quote);
      toast.success(`Swap submitted: ${hash.slice(0, 10)}…`);
      onSubmitted?.();
      setQuote(null);
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Swap failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
      <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[440px] [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Swap on Stellar</DialogTitle>
            <DialogDescription className="text-[11px] text-white/40 mt-1">Quote a route, review minimum received, then sign in Freighter.</DialogDescription>
          </div>
          <button onClick={() => onOpenChange(false)} disabled={submitting} aria-label="Close swap dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center disabled:opacity-40">
            <X size={14} className="text-white/70" />
          </button>
        </div>
        <form onSubmit={(event) => void requestQuote(event)} className="p-6 space-y-4">
          <label className="block text-[11px] text-white/50">
            Wallet
            <input readOnly value={address} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[10px] text-white/60 font-mono outline-none" />
          </label>
          <div className="flex items-end gap-2">
            <label className="block flex-1 text-[11px] text-white/50">
              From asset
              <select value={fromAsset} onChange={(event) => { setFromAsset(event.target.value as StellarSwapAsset); setQuote(null); }} className="mt-1.5 w-full bg-[#202020] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">
                <option value="XLM">XLM</option><option value="USDC">USDC</option>
              </select>
            </label>
            <ArrowDownUp size={15} className="mb-3 text-white/35" />
            <div className="flex-1 text-[11px] text-white/50">To asset<div className="mt-1.5 border border-white/10 px-3 py-2.5 text-[12px] text-white">{toAsset}</div></div>
          </div>
          <label className="block text-[11px] text-white/50">
            Amount ({fromAsset})
            <input required inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setQuote(null); }} placeholder="0.00" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none focus:border-white/30" />
          </label>
          <label className="block text-[11px] text-white/50">
            Slippage tolerance
            <select value={slippageBps} onChange={(event) => { setSlippageBps(Number(event.target.value)); setQuote(null); }} className="mt-1.5 w-full bg-[#202020] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">
              <option value={50}>0.5%</option><option value={100}>1%</option><option value={300}>3%</option>
            </select>
          </label>

          {quote && <div className="space-y-2 border border-white/10 bg-white/[0.03] p-3 text-[11px]">
            <div className="flex justify-between text-white/55"><span>Network / route</span><span className="text-white">Stellar {quote.network} · {quote.provider}</span></div>
            <div className="flex justify-between text-white/55"><span>Estimated receive</span><span className="text-white">{quote.amountOut} {quote.toAsset}</span></div>
            <div className="flex justify-between text-white/55"><span>Minimum received</span><span className="text-white">{quote.minimumReceived} {quote.toAsset}</span></div>
            <div className="flex justify-between text-white/55"><span>Slippage</span><span className="text-white">{(quote.slippageBps / 100).toFixed(2)}%</span></div>
            {quote.priceImpactPct && <div className="flex justify-between text-white/55"><span>Price impact</span><span className="text-white">{quote.priceImpactPct}%</span></div>}
          </div>}

          {quote ? <button type="button" onClick={() => void executeSwap()} disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-4 py-3 disabled:opacity-50">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}{submitting ? "Waiting for wallet…" : "Review and sign in Freighter"}
          </button> : <button type="submit" disabled={loadingQuote || !amount.trim()} className="w-full flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-4 py-3 disabled:opacity-50">
            {loadingQuote ? <Loader2 size={14} className="animate-spin" /> : null}{loadingQuote ? "Getting quote…" : "Get swap quote"}
          </button>}
          <p className="text-[10px] leading-relaxed text-white/35">Available pairs: XLM and USDC on the selected Stellar network. Provance builds the transaction; Freighter controls signing.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
