import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeftRight, Check, Loader2, RefreshCw, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { bridgeService, NATIVE_EVM_TOKEN, type BridgeQuote, type BridgeStatus } from "@/services/bridge.service";
import { evmSwapService, EVM_SWAP_NETWORKS, formatEvmSwapAmount, parseEvmSwapAmount } from "@/services/evm-swap.service";

interface Props {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   address: string;
   onSubmitted?: () => void;
}

export function EvmBridgeModal({ open, onOpenChange, address, onSubmitted }: Props) {
   const networks = EVM_SWAP_NETWORKS;
   const [fromChainId, setFromChainId] = useState(networks[0]?.id ?? 1);
   const [toChainId, setToChainId] = useState(networks.find((item) => item.id === 42161)?.id ?? networks[1]?.id ?? 1);
   const [fromToken, setFromToken] = useState(NATIVE_EVM_TOKEN);
   const [toToken, setToToken] = useState(NATIVE_EVM_TOKEN);
   const [fromDecimals, setFromDecimals] = useState(18);
   const [toDecimals, setToDecimals] = useState(18);
   const [fromSymbol, setFromSymbol] = useState("native");
   const [toSymbol, setToSymbol] = useState("native");
   const [amount, setAmount] = useState("");
   const [quote, setQuote] = useState<BridgeQuote | null>(null);
   const [quotedAt, setQuotedAt] = useState(0);
   const [busy, setBusy] = useState(false);
   const [hash, setHash] = useState<string | null>(null);
   const [status, setStatus] = useState<BridgeStatus | null>(null);

   const fromAmount = useMemo(() => {
      try { return amount ? parseEvmSwapAmount(amount, fromDecimals).toString() : ""; } catch { return ""; }
   }, [amount, fromDecimals]);

   function resetQuote() { setQuote(null); setHash(null); setStatus(null); }

   async function readToken(side: "from" | "to") {
      const chainId = side === "from" ? fromChainId : toChainId;
      const token = (side === "from" ? fromToken : toToken).trim();
      if (!token) return;
      setBusy(true);
      try {
         if (token.toLowerCase() === NATIVE_EVM_TOKEN) {
            if (side === "from") { setFromDecimals(18); setFromSymbol("native"); }
            else { setToDecimals(18); setToSymbol("native"); }
            resetQuote();
            return;
         }
         const metadata = await evmSwapService.getTokenMetadata(chainId, token);
         if (side === "from") { setFromDecimals(metadata.decimals); setFromSymbol(metadata.symbol); }
         else { setToDecimals(metadata.decimals); setToSymbol(metadata.symbol); }
         resetQuote();
      } catch (error) {
         toast.error(error instanceof Error ? error.message : "Could not read token details");
      } finally { setBusy(false); }
   }

   async function getQuote() {
      if (fromChainId === toChainId) { toast.error("Choose two different networks."); return; }
      if (!fromAmount) { toast.error("Enter an amount greater than zero."); return; }
      setBusy(true);
      try {
         const next = await bridgeService.quote({
            fromChainId,
            toChainId,
            fromToken: fromToken.trim(),
            toToken: toToken.trim(),
            fromAddress: address,
            fromAmount,
            fromTokenDecimals: fromDecimals,
            toTokenDecimals: toDecimals,
         });
         setQuote(next);
         setQuotedAt(Date.now());
         setStatus(null);
      } catch (error) {
         setQuote(null);
         toast.error(error instanceof Error ? error.message : "Could not quote this bridge");
      } finally { setBusy(false); }
   }

   async function execute() {
      if (!quote) return;
      if (Date.now() - quotedAt > quote.expiresInSeconds * 1000) {
         toast.error("This quote expired. Get a fresh quote before bridging.");
         setQuote(null);
         return;
      }
      setBusy(true);
      try {
         const result = await bridgeService.execute(quote, address);
         setHash(result.hash);
         toast.success(`Bridge submitted: ${result.hash.slice(0, 10)}…`);
         onSubmitted?.();
         try {
            await bridgeService.waitForTransaction(quote.fromChainId, result.hash);
            const next = await bridgeService.status(result.hash);
            setStatus(next);
         } catch { /* destination status is reconciled in the background */ }
      } catch (error) {
         toast.error(error instanceof Error ? error.message : "Bridge submission failed");
      } finally { setBusy(false); }
   }

   async function refreshStatus() {
      if (!hash) return;
      setBusy(true);
      try { setStatus(await bridgeService.status(hash)); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Could not refresh bridge status"); }
      finally { setBusy(false); }
   }

   return (
      <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
         <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[520px] [&>button]:hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
               <div>
                  <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Bridge tokens</DialogTitle>
                  <DialogDescription className="text-[11px] text-white/40 mt-1">LI.FI routes across supported EVM networks. Your wallet signs the source transaction.</DialogDescription>
               </div>
               <button onClick={() => onOpenChange(false)} disabled={busy} aria-label="Close bridge dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center disabled:opacity-40"><X size={14} className="text-white/70" /></button>
            </div>

            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void getQuote(); }} className="p-6 space-y-3.5">
               <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[11px] text-white/50">From network
                     <select value={fromChainId} onChange={(event) => { setFromChainId(Number(event.target.value)); resetQuote(); }} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">
                        {networks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                     </select>
                  </label>
                  <label className="block text-[11px] text-white/50">To network
                     <select value={toChainId} onChange={(event) => { setToChainId(Number(event.target.value)); resetQuote(); }} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">
                        {networks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                     </select>
                  </label>
               </div>

               <label className="block text-[11px] text-white/50">Wallet
                  <input readOnly value={address} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[10px] text-white/60 font-mono outline-none" />
               </label>

               <TokenField
                  label="From token (use 0x000…000 for native)"
                  value={fromToken}
                  symbol={fromSymbol}
                  decimals={fromDecimals}
                  onChange={(value) => { setFromToken(value); resetQuote(); }}
                  onRead={() => void readToken("from")}
                  busy={busy}
               />
               <div className="grid grid-cols-[1fr_84px] gap-2">
                  <label className="block text-[11px] text-white/50">Amount
                     <input required inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); resetQuote(); }} placeholder="0.00" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none" />
                  </label>
                  <label className="block text-[11px] text-white/50">Decimals
                     <input readOnly type="number" value={fromDecimals} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white/50 outline-none" />
                  </label>
               </div>
               <TokenField
                  label="To token (use 0x000…000 for native)"
                  value={toToken}
                  symbol={toSymbol}
                  decimals={toDecimals}
                  onChange={(value) => { setToToken(value); resetQuote(); }}
                  onRead={() => void readToken("to")}
                  busy={busy}
               />

               {quote && (
                  <div className="border border-white/10 bg-white/[.03] p-3 text-[11px] space-y-1.5">
                     <p className="flex justify-between text-white/55"><span>Estimated receive</span><span className="text-white">{formatEvmSwapAmount(quote.toAmount, toDecimals)} {toSymbol}</span></p>
                     <p className="flex justify-between text-white/55"><span>Minimum receive</span><span className="text-white">{formatEvmSwapAmount(quote.toAmountMin, toDecimals)} {toSymbol}</span></p>
                     <p className="text-white/35">Route: {quote.tool ?? "LI.FI"}{quote.executionDurationSeconds ? ` · ~${Math.ceil(quote.executionDurationSeconds / 60)} min` : ""}</p>
                     {quote.fromAmountUsd && <p className="text-white/35">Value: ${Number(quote.fromAmountUsd).toFixed(2)}</p>}
                  </div>
               )}

               {hash && (
                  <div className="border border-white/10 bg-white/[.03] p-3 text-[11px] space-y-1.5">
                     <p className="text-white/55">Source transaction</p>
                     <p className="font-mono text-white/80 break-all">{hash}</p>
                     <p className="text-white/55">Status: <span className="text-white">{status?.status ?? "submitted"}</span></p>
                     {typeof status?.details.destinationTransactionHash === "string" && <p className="font-mono text-white/50 break-all">Destination: {status.details.destinationTransactionHash}</p>}
                     <button type="button" onClick={() => void refreshStatus()} disabled={busy} className="flex items-center gap-1.5 text-white/70 hover:text-white disabled:opacity-40"><RefreshCw size={12} /> Refresh status</button>
                  </div>
               )}

               <p className="text-[10px] leading-relaxed text-white/35">Bridge routes can take several minutes. Source and destination transactions are recorded in wallet activity. Verify the destination address and token contract before signing.</p>

               {!quote ? (
                  <button type="submit" disabled={busy || !fromAmount || fromChainId === toChainId} className="w-full flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-4 py-3 disabled:opacity-50">
                     {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}{busy ? "Getting quote…" : "Get bridge quote"}
                  </button>
               ) : (
                  <div className="grid grid-cols-2 gap-2">
                     <button type="button" onClick={() => void getQuote()} disabled={busy} className="flex items-center justify-center gap-2 border border-white/15 text-white text-[11px] font-semibold px-3 py-3 disabled:opacity-50"><RefreshCw size={13} />Refresh</button>
                     <button type="button" onClick={() => void execute()} disabled={busy || Boolean(hash)} className="flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[11px] font-bold px-3 py-3 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Review and bridge</button>
                  </div>
               )}
            </form>
         </DialogContent>
      </Dialog>
   );
}

function TokenField(props: {
   label: string; value: string; symbol: string; decimals: number;
   onChange: (value: string) => void; onRead: () => void; busy: boolean;
}) {
   return (
      <div className="block text-[11px] text-white/50">{props.label}
         <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-2">
            <input value={props.value} onChange={(event) => props.onChange(event.target.value)} placeholder="0x…" className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white font-mono outline-none focus:border-white/30" />
            <button type="button" onClick={props.onRead} disabled={props.busy || !props.value.trim()} className="flex items-center gap-1.5 border border-white/15 px-2.5 text-[10px] text-white/70 disabled:opacity-40"><Search size={12} />Read</button>
         </div>
         <p className="mt-1 text-[10px] text-emerald-200/75">{props.symbol} · {props.decimals} decimals</p>
      </div>
   );
}
