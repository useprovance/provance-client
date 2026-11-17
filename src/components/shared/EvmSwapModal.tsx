import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeftRight, Check, Loader2, RefreshCw, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { evmSwapService, EVM_SWAP_NETWORKS, formatEvmSwapAmount, parseEvmSwapAmount, type EvmSwapQuote, type EvmTokenSearchResult } from "@/services/evm-swap.service";
import { walletService, type EvmTokenVerification, type WalletChain } from "@/services/wallet.service";

function formatUsd(value: number): string {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: value < 100 ? 2 : 0 });
}

interface EvmSwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  walletChain: WalletChain;
  onSubmitted?: () => void;
}

export function EvmSwapModal({ open, onOpenChange, address, onSubmitted }: EvmSwapModalProps) {
  const networks = EVM_SWAP_NETWORKS;
  const [chainId, setChainId] = useState(networks[0]?.id ?? 1);
  const [sellToken, setSellToken] = useState("");
  const [buyToken, setBuyToken] = useState("");
  const [amount, setAmount] = useState("");
  const [sellDecimals, setSellDecimals] = useState("18");
  const [buyDecimals, setBuyDecimals] = useState("18");
  const [sellTokenInfo, setSellTokenInfo] = useState<{ address: string; chainId: number; name: string; symbol: string; decimals: number } | null>(null);
  const [buyTokenInfo, setBuyTokenInfo] = useState<{ address: string; chainId: number; name: string; symbol: string; decimals: number } | null>(null);
  const [sellTokenResults, setSellTokenResults] = useState<EvmTokenSearchResult[]>([]);
  const [buyTokenResults, setBuyTokenResults] = useState<EvmTokenSearchResult[]>([]);
  const [sellSearchBusy, setSellSearchBusy] = useState(false);
  const [buySearchBusy, setBuySearchBusy] = useState(false);
  const [sellVerification, setSellVerification] = useState<EvmTokenVerification | null>(null);
  const [buyVerification, setBuyVerification] = useState<EvmTokenVerification | null>(null);
  const [sellVerificationError, setSellVerificationError] = useState("");
  const [buyVerificationError, setBuyVerificationError] = useState("");
  const [slippageBps, setSlippageBps] = useState(100);
  const [quote, setQuote] = useState<EvmSwapQuote | null>(null);
  const [quotedAt, setQuotedAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const chain = networks.find((item) => item.id === chainId) ?? networks[0];
  const sellAmount = useMemo(() => {
    try { return amount ? parseEvmSwapAmount(amount, Number(sellDecimals)).toString() : ""; } catch { return ""; }
  }, [amount, sellDecimals]);
  const needsApproval = Boolean(quote?.allowanceTarget);

  useEffect(() => {
    if (sellToken.trim().length < 2) { setSellTokenResults([]); return; }
    let current = true;
    const timer = window.setTimeout(() => {
      setSellSearchBusy(true);
      void evmSwapService.searchTokens(chainId, sellToken.trim()).then((tokens) => { if (current) setSellTokenResults(tokens); })
        .catch(() => { if (current) setSellTokenResults([]); })
        .finally(() => { if (current) setSellSearchBusy(false); });
    }, 300);
    return () => { current = false; window.clearTimeout(timer); };
  }, [sellToken, chainId]);

  useEffect(() => {
    if (buyToken.trim().length < 2) { setBuyTokenResults([]); return; }
    let current = true;
    const timer = window.setTimeout(() => {
      setBuySearchBusy(true);
      void evmSwapService.searchTokens(chainId, buyToken.trim()).then((tokens) => { if (current) setBuyTokenResults(tokens); })
        .catch(() => { if (current) setBuyTokenResults([]); })
        .finally(() => { if (current) setBuySearchBusy(false); });
    }, 300);
    return () => { current = false; window.clearTimeout(timer); };
  }, [buyToken, chainId]);

  const sellMetadataReady = sellTokenInfo?.chainId === chainId && sellTokenInfo.address.toLowerCase() === sellToken.trim().toLowerCase();
  const buyMetadataReady = buyTokenInfo?.chainId === chainId && buyTokenInfo.address.toLowerCase() === buyToken.trim().toLowerCase();

  async function loadTokenMetadata(side: "sell" | "buy") {
    const token = (side === "sell" ? sellToken : buyToken).trim();
    if (!chain || !token) return;
    if (side === "sell") { setSellVerification(null); setSellVerificationError(""); }
    else { setBuyVerification(null); setBuyVerificationError(""); }
    setBusy(true);
    try {
      const verificationPromise = walletService.verifyEvmToken(token, chainId)
        .then((result) => ({ verification: result, error: "" }))
        .catch((error: unknown) => ({ verification: null, error: error instanceof Error ? error.message : "GeckoTerminal verification is unavailable" }));
      const metadata = await evmSwapService.getTokenMetadata(chainId, token);
      const info = { address: token, chainId, ...metadata };
      if (side === "sell") {
        setSellTokenInfo(info);
        setSellDecimals(String(metadata.decimals));
      } else {
        setBuyTokenInfo(info);
        setBuyDecimals(String(metadata.decimals));
      }
      const verificationResult = await verificationPromise;
      if (side === "sell") {
        setSellVerification(verificationResult.verification);
        setSellVerificationError(verificationResult.error);
      } else {
        setBuyVerification(verificationResult.verification);
        setBuyVerificationError(verificationResult.error);
      }
      setQuote(null);
    } catch (error) {
      if (side === "sell") { setSellTokenInfo(null); setSellVerification(null); }
      else { setBuyTokenInfo(null); setBuyVerification(null); }
      toast.error(error instanceof Error ? error.message : "Could not read token details");
    } finally { setBusy(false); }
  }

  async function getQuote() {
    if (!chain) return;
    if (!sellMetadataReady || !buyMetadataReady) {
      toast.error("Load token details for both contracts before quoting.");
      return;
    }
    setBusy(true);
    try {
      const next = await evmSwapService.quote({ address, chainId, sellToken: sellToken.trim(), buyToken: buyToken.trim(), sellTokenDecimals: Number(sellDecimals), buyTokenDecimals: Number(buyDecimals), sellAmount, slippageBps });
      setQuote(next);
      setQuotedAt(Date.now());
    } catch (error) {
      setQuote(null);
      toast.error(error instanceof Error ? error.message : "Could not get a swap quote");
    } finally { setBusy(false); }
  }

  async function approveToken() {
    if (!quote?.allowanceTarget) return;
    setBusy(true);
    try {
      const allowance = await evmSwapService.allowance({ chainId, owner: address, token: sellToken.trim(), spender: quote.allowanceTarget });
      const required = BigInt(quote.sellAmount);
      if (allowance < required) {
        const hash = await evmSwapService.approve({ source: address, chainId, token: sellToken.trim(), spender: quote.allowanceTarget, amount: required });
        toast.success(`Approval submitted: ${hash.slice(0, 10)}…`);
        await evmSwapService.waitForTransaction(chainId, hash);
      }
      await getQuote();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Token approval failed");
    } finally { setBusy(false); }
  }

  async function executeSwap() {
    if (!quote) return;
    if (Date.now() - quotedAt > quote.expiresInSeconds * 1000) {
      toast.error("This quote expired. Get a fresh quote before swapping.");
      setQuote(null);
      return;
    }
    setBusy(true);
    try {
      const result = await evmSwapService.execute(quote);
      toast.success(result.historySaved
        ? `Swap recorded: ${result.hash.slice(0, 10)}…`
        : `Swap submitted: ${result.hash.slice(0, 10)}… (activity could not be saved)`);
      onSubmitted?.();
      setQuote(null);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Swap failed");
    } finally { setBusy(false); }
  }

  function resetForNetwork(nextChainId: number) {
    setChainId(nextChainId);
    setQuote(null);
    setSellTokenInfo(null);
    setBuyTokenInfo(null);
    setSellVerification(null);
    setBuyVerification(null);
    setSellVerificationError("");
    setBuyVerificationError("");
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[460px] [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Swap EVM tokens</DialogTitle>
            <DialogDescription className="text-[11px] text-white/40 mt-1">Quotes use 0x or Uniswap, depending on the network. Your wallet signs each approval and swap.</DialogDescription>
          </div>
          <button onClick={() => onOpenChange(false)} disabled={busy} aria-label="Close swap dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center disabled:opacity-40"><X size={14} className="text-white/70" /></button>
        </div>
        <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void getQuote(); }} className="p-6 space-y-3.5">
          <label className="block text-[11px] text-white/50">Network
            <select value={chainId} onChange={(event) => resetForNetwork(Number(event.target.value))} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">
              {networks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-[11px] text-white/50">Wallet
            <input readOnly value={address} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[10px] text-white/60 font-mono outline-none" />
          </label>
          <div className="block text-[11px] text-white/50">Token to sell (ERC-20 address)
            <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-2">
              <input required value={sellToken} onChange={(event) => { setSellToken(event.target.value); setSellTokenInfo(null); setSellVerification(null); setSellVerificationError(""); setQuote(null); }} placeholder="0x…" className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white font-mono outline-none focus:border-white/30" />
              <button type="button" onClick={() => void loadTokenMetadata("sell")} disabled={busy || !sellToken.trim()} className="flex items-center gap-1.5 border border-white/15 px-2.5 text-[10px] text-white/70 disabled:opacity-40"><Search size={12} />Read</button>
            </div>
            {sellTokenResults.length > 0 && <div className="mt-1 max-h-32 overflow-y-auto border border-white/10 bg-[#1b1b1b]">{sellTokenResults.map((token) => <button key={token.address} type="button" onClick={() => { setSellToken(token.address); setSellTokenInfo(null); setSellVerification(null); setSellVerificationError(""); setSellTokenResults([]); setQuote(null); }} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/8"><span className="text-[11px] text-white">{token.name} <span className="text-white/45">({token.symbol})</span></span><span className="text-[9px] text-white/35">{token.address.slice(0, 6)}…{token.address.slice(-4)}</span></button>)}</div>}
            {sellSearchBusy && <p className="mt-1 text-[9px] text-white/35">Searching supported tokens…</p>}
            {sellMetadataReady && <p className="mt-1 text-[10px] text-emerald-200/75">{sellTokenInfo.name} ({sellTokenInfo.symbol}) · {sellTokenInfo.decimals} decimals</p>}
            {sellMetadataReady && sellVerification && sellVerification.tokenAddress.toLowerCase() === sellTokenInfo.address.toLowerCase() && <p className={`mt-1 text-[10px] ${sellVerification.verified ? "text-emerald-200/75" : "text-amber-200/75"}`}>GeckoTerminal: {sellVerification.verified ? "verified" : "not verified"} · {sellVerification.gtVerified ? "GT Verified" : "no GT Verified badge"}{sellVerification.gtScore !== null ? ` · score ${sellVerification.gtScore.toFixed(1)}` : ""} · liquidity {formatUsd(sellVerification.liquidityUsd)}</p>}
            {sellMetadataReady && sellVerificationError && <p className="mt-1 text-[9px] text-white/35">GeckoTerminal verification unavailable: {sellVerificationError}</p>}
          </div>
          <div className="grid grid-cols-[1fr_84px] gap-2">
            <label className="block text-[11px] text-white/50">Amount<input required inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setQuote(null); }} placeholder="0.00" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none" /></label>
            <label className="block text-[11px] text-white/50">Decimals<input readOnly type="number" min="0" max="36" value={sellDecimals} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white/50 outline-none" /></label>
          </div>
          <div className="block text-[11px] text-white/50">Token to buy (ERC-20 address)
            <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-2">
              <input required value={buyToken} onChange={(event) => { setBuyToken(event.target.value); setBuyTokenInfo(null); setBuyVerification(null); setBuyVerificationError(""); setQuote(null); }} placeholder="0x…" className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white font-mono outline-none focus:border-white/30" />
              <button type="button" onClick={() => void loadTokenMetadata("buy")} disabled={busy || !buyToken.trim()} className="flex items-center gap-1.5 border border-white/15 px-2.5 text-[10px] text-white/70 disabled:opacity-40"><Search size={12} />Read</button>
            </div>
            {buyTokenResults.length > 0 && <div className="mt-1 max-h-32 overflow-y-auto border border-white/10 bg-[#1b1b1b]">{buyTokenResults.map((token) => <button key={token.address} type="button" onClick={() => { setBuyToken(token.address); setBuyTokenInfo(null); setBuyVerification(null); setBuyVerificationError(""); setBuyTokenResults([]); setQuote(null); }} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/8"><span className="text-[11px] text-white">{token.name} <span className="text-white/45">({token.symbol})</span></span><span className="text-[9px] text-white/35">{token.address.slice(0, 6)}…{token.address.slice(-4)}</span></button>)}</div>}
            {buySearchBusy && <p className="mt-1 text-[9px] text-white/35">Searching supported tokens…</p>}
            {buyMetadataReady && <p className="mt-1 text-[10px] text-emerald-200/75">{buyTokenInfo.name} ({buyTokenInfo.symbol}) · {buyTokenInfo.decimals} decimals</p>}
            {buyMetadataReady && buyVerification && buyVerification.tokenAddress.toLowerCase() === buyTokenInfo.address.toLowerCase() && <p className={`mt-1 text-[10px] ${buyVerification.verified ? "text-emerald-200/75" : "text-amber-200/75"}`}>GeckoTerminal: {buyVerification.verified ? "verified" : "not verified"} · {buyVerification.gtVerified ? "GT Verified" : "no GT Verified badge"}{buyVerification.gtScore !== null ? ` · score ${buyVerification.gtScore.toFixed(1)}` : ""} · liquidity {formatUsd(buyVerification.liquidityUsd)}</p>}
            {buyMetadataReady && buyVerificationError && <p className="mt-1 text-[9px] text-white/35">GeckoTerminal verification unavailable: {buyVerificationError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[11px] text-white/50">Buy token decimals<input readOnly type="number" min="0" max="36" value={buyDecimals} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white/50 outline-none" /></label>
            <label className="block text-[11px] text-white/50">Slippage
              <select value={slippageBps} onChange={(event) => { setSlippageBps(Number(event.target.value)); setQuote(null); }} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none"><option value={50}>0.5%</option><option value={100}>1%</option><option value={300}>3%</option><option value={500}>5%</option></select>
            </label>
          </div>
          {quote && <div className="border border-white/10 bg-white/[.03] p-3 text-[11px] space-y-1.5">
            <p className="flex justify-between text-white/55"><span>Estimated receive</span><span className="text-white">{formatEvmSwapAmount(quote.buyAmount, Number(buyDecimals))}</span></p>
            <p className="flex justify-between text-white/55"><span>Minimum receive</span><span className="text-white">{formatEvmSwapAmount(quote.minimumBuyAmount, Number(buyDecimals))}</span></p>
            <p className="text-white/35">Provider: {quote.provider === "0x" ? "0x" : "Uniswap"}. Route sources: {quote.sources.length ? quote.sources.join(", ") : quote.provider}</p>
            {needsApproval && <p className="text-amber-200/75">This token may need approval before the swap.</p>}
          </div>}
          <p className="text-[10px] leading-relaxed text-white/35">Token names and decimals come from contract metadata on the selected network. GeckoTerminal verification is an advisory signal and does not guarantee safety. Check the contract address and review the transaction in your wallet.</p>
          {!quote ? <button type="submit" disabled={busy || !sellAmount || !sellMetadataReady || !buyMetadataReady} className="w-full flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-4 py-3 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}{busy ? "Getting quote…" : "Get quote"}</button> : <div className="grid grid-cols-2 gap-2">
            {needsApproval ? <button type="button" onClick={() => void approveToken()} disabled={busy} className="flex items-center justify-center gap-2 border border-white/15 text-white text-[11px] font-semibold px-3 py-3 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Approve and refresh quote</button> : <button type="button" onClick={() => void getQuote()} disabled={busy} className="flex items-center justify-center gap-2 border border-white/15 text-white text-[11px] font-semibold px-3 py-3 disabled:opacity-50"><RefreshCw size={13} />Refresh</button>}
            <button type="button" onClick={() => void executeSwap()} disabled={busy} className="flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[11px] font-bold px-3 py-3 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}Review and swap</button>
          </div>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
