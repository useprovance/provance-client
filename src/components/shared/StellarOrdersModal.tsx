import { useEffect, useState, type FormEvent } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { knownUsdcIssuer, stellarOrdersService, type StellarAsset, type StellarOffer } from "@/services/stellar-orders.service";

interface StellarOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  onSubmitted?: () => void;
}

function assetLabel(asset: StellarAsset) {
  return asset.issuer ? `${asset.code} · ${asset.issuer.slice(0, 5)}…${asset.issuer.slice(-5)}` : asset.code;
}

export function StellarOrdersModal({ open, onOpenChange, address, onSubmitted }: StellarOrdersModalProps) {
  const [sellCode, setSellCode] = useState("XLM");
  const [sellIssuer, setSellIssuer] = useState("");
  const [buyCode, setBuyCode] = useState("USDC");
  const [buyIssuer, setBuyIssuer] = useState("");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [offers, setOffers] = useState<StellarOffer[]>([]);
  const [network, setNetwork] = useState<"mainnet" | "testnet">("mainnet");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selling: StellarAsset = { code: sellCode.trim().toUpperCase(), issuer: sellIssuer.trim() || null };
  const buying: StellarAsset = { code: buyCode.trim().toUpperCase(), issuer: buyIssuer.trim() || null };

  async function refresh() {
    setLoading(true);
    try {
      const result = await stellarOrdersService.list(address);
      setNetwork(result.network);
      setOffers(result.offers);
      if (!buyIssuer.trim() && buyCode.trim().toUpperCase() === "USDC") setBuyIssuer(knownUsdcIssuer(result.network));
      if (!sellIssuer.trim() && sellCode.trim().toUpperCase() === "USDC") setSellIssuer(knownUsdcIssuer(result.network));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load open offers");
    } finally { setLoading(false); }
  }

  useEffect(() => { if (open) void refresh(); }, [open, address]);

  async function place(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await stellarOrdersService.submit(address, selling, buying, amount.trim(), price.trim());
      if (result.historySaved) toast.success(`Limit order confirmed: ${result.transactionHash.slice(0, 10)}…`);
      else toast.error(`Order confirmed, but activity could not be saved: ${result.transactionHash.slice(0, 10)}…`);
      setAmount(""); setPrice(""); onSubmitted?.(); await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not submit limit order"); }
    finally { setSubmitting(false); }
  }

  async function cancel(offer: StellarOffer) {
    setSubmitting(true);
    try {
      const result = await stellarOrdersService.submit(address, offer.selling, offer.buying, "0", offer.price, offer.id);
      if (result.historySaved) toast.success(`Offer cancellation confirmed: ${result.transactionHash.slice(0, 10)}…`);
      else toast.error(`Cancellation confirmed, but activity could not be saved: ${result.transactionHash.slice(0, 10)}…`);
      onSubmitted?.(); await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not cancel offer"); }
    finally { setSubmitting(false); }
  }

  return <Dialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
    <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[520px] [&>button]:hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div><DialogTitle className="text-[15px] font-semibold text-white font-manrope">Stellar limit orders</DialogTitle><DialogDescription className="text-[11px] text-white/40 mt-1">Create and manage SDEX sell offers for classic Stellar assets.</DialogDescription></div>
        <button onClick={() => onOpenChange(false)} disabled={submitting} aria-label="Close orders dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center disabled:opacity-40"><X size={14} className="text-white/70" /></button>
      </div>
      <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 text-[10px] text-white/40"><span className="truncate font-mono">{address}</span><span className="shrink-0 capitalize">{network}</span></div>
        <form onSubmit={(event) => void place(event)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><p className="text-[11px] text-white/60">Sell asset</p><input required maxLength={12} value={sellCode} onChange={(event) => setSellCode(event.target.value)} placeholder="Asset code" aria-label="Asset code to sell" className="w-full bg-[#202020] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none" /><input value={sellIssuer} onChange={(event) => setSellIssuer(event.target.value)} placeholder="Issuer (leave blank for XLM)" aria-label="Issuer of asset to sell" className="w-full bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white font-mono outline-none" /></div>
            <div className="space-y-2"><p className="text-[11px] text-white/60">Receive asset</p><input required maxLength={12} value={buyCode} onChange={(event) => setBuyCode(event.target.value)} placeholder="Asset code" aria-label="Asset code to receive" className="w-full bg-[#202020] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none" /><input value={buyIssuer} onChange={(event) => setBuyIssuer(event.target.value)} placeholder="Issuer (leave blank for XLM)" aria-label="Issuer of asset to receive" className="w-full bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white font-mono outline-none" /></div>
          </div>
          <p className="text-[10px] text-white/35">For native XLM, enter XLM and leave issuer blank. Every issued token requires its exact issuer address.</p>
          <label className="block text-[11px] text-white/50">Amount to sell<input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none focus:border-white/30" /></label>
          <label className="block text-[11px] text-white/50">Price ({buying.code || "buy asset"} per {selling.code || "sell asset"})<input required inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none focus:border-white/30" /></label>
          <button type="submit" disabled={submitting || !amount || !price} className="w-full flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-4 py-3 disabled:opacity-50">{submitting ? <Loader2 size={14} className="animate-spin" /> : null}{submitting ? "Waiting for wallet…" : "Review and sign in Freighter"}</button>
        </form>
        <div className="border-t border-white/8 pt-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-[12px] font-semibold text-white">Open offers</h3><button onClick={() => void refresh()} disabled={loading || submitting} className="flex items-center gap-1 text-[10px] text-white/45 hover:text-white disabled:opacity-40"><RefreshCw size={11} className={loading ? "animate-spin" : ""} />Refresh</button></div>
          {offers.length === 0 ? <p className="text-[11px] text-white/35">{loading ? "Loading offers…" : "No open offers on this network."}</p> : <div className="space-y-2">{offers.map((offer) => <div key={offer.id} className="flex items-center justify-between gap-3 border border-white/8 bg-white/[0.02] px-3 py-2.5"><div className="min-w-0"><p className="text-[11px] text-white">Sell {offer.amount} {assetLabel(offer.selling)}</p><p className="text-[10px] text-white/40">at {offer.price} {assetLabel(offer.buying)} · #{offer.id}</p></div><button onClick={() => void cancel(offer)} disabled={submitting} title="Cancel this offer" className="shrink-0 border border-white/10 px-2 py-1.5 text-[10px] text-white/55 hover:text-white disabled:opacity-40">Cancel</button></div>)}</div>}
        </div>
        <p className="text-[10px] leading-relaxed text-white/35">Offers remain on the Stellar SDEX until filled or cancelled. Issued-asset offers require trustlines for the assets involved. Verify the asset code and issuer before signing.</p>
      </div>
    </DialogContent>
  </Dialog>;
}
