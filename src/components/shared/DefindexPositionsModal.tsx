import { useEffect, useState } from "react";
import { ExternalLink, Loader2, RefreshCw, X, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { defindexService, type DefindexActionQuote, type DefindexPosition, type DefindexVault, type DefindexVaultInfo } from "@/services/defindex.service";

interface DefindexPositionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
}

function shortAddress(address: string) {
  return `${address.slice(0, 7)}…${address.slice(-5)}`;
}

export function DefindexPositionsModal({ open, onOpenChange, walletAddress }: DefindexPositionsModalProps) {
  const [network, setNetwork] = useState<"mainnet" | "testnet">("mainnet");
  const [vaults, setVaults] = useState<DefindexVault[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [position, setPosition] = useState<{ vault: DefindexVaultInfo; position: DefindexPosition } | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(false);
  const [action, setAction] = useState<"deposit" | "withdraw" | null>(null);
  const [amounts, setAmounts] = useState<string[]>([]);
  const [invest, setInvest] = useState(true);
  const [slippageBps, setSlippageBps] = useState(50);
  const [quote, setQuote] = useState<DefindexActionQuote | null>(null);
  const [quoteTime, setQuoteTime] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);

  function toStroops(value: string): string {
    if (!/^\d+(\.\d{1,7})?$/.test(value)) throw new Error("Enter a valid amount with up to 7 decimal places");
    const [whole, fraction = ""] = value.split(".");
    return (BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, "0"))).toString();
  }

  async function loadVaults() {
    setLoading(true);
    try {
      const response = await defindexService.getVaults();
      setNetwork(response.network);
      setVaults(response.vaults);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load DeFindex vaults");
    } finally { setLoading(false); }
  }

  async function showPosition(vaultAddress: string) {
    setSelectedVault(vaultAddress);
    setPosition(null);
    setLoadingPosition(true);
    try {
      const response = await defindexService.getPosition(walletAddress, vaultAddress);
      setNetwork(response.network);
      setPosition({ vault: response.vault, position: response.position });
      setAmounts(response.vault.assets?.map(() => "") ?? []);
      setAction(null);
      setQuote(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load this vault position");
    } finally { setLoadingPosition(false); }
  }

  async function prepareAction() {
    if (!selectedVault || !position || !action) return;
    setActionBusy(true);
    try {
      const stroops = amounts.map((value) => value.trim() ? toStroops(value.trim()) : "0");
      if (!stroops.some((value) => BigInt(value) > 0n)) throw new Error("Enter an amount for at least one vault asset");
      if (action === "withdraw") {
        for (let index = 0; index < stroops.length; index += 1) {
          if (BigInt(stroops[index]) > BigInt(position.position.underlyingBalance[index] ?? 0)) throw new Error(`Requested withdrawal exceeds the displayed underlying balance for asset ${index + 1}`);
        }
      }
      const nextQuote = await defindexService.prepareAction({ address: walletAddress, vaultAddress: selectedVault, action, amounts: stroops, invest: action === "deposit" ? invest : false, slippageBps });
      setQuote(nextQuote);
      setQuoteTime(Date.now());
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not prepare DeFindex transaction"); }
    finally { setActionBusy(false); }
  }

  async function signAndSubmit() {
    if (!quote) return;
    if (Date.now() - quoteTime > quote.expiresInSeconds * 1000) { toast.error("This transaction review expired. Prepare it again."); setQuote(null); return; }
    setActionBusy(true);
    try {
      const result = await defindexService.signAndSubmit(quote);
      toast.success(result.success ? `${quote.action === "deposit" ? "Deposit" : "Withdrawal"} submitted: ${result.transactionHash.slice(0, 10)}…` : `Transaction failed: ${result.transactionHash.slice(0, 10)}…`);
      if (!result.historySaved) toast.error("Transaction was submitted, but activity could not be saved");
      setQuote(null);
      await showPosition(quote.vaultAddress);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not submit DeFindex transaction"); }
    finally { setActionBusy(false); }
  }

  useEffect(() => { if (open) void loadVaults(); }, [open, walletAddress]);

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[560px] [&>button]:hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div><DialogTitle className="text-[15px] font-semibold text-white font-manrope">DeFindex vaults</DialogTitle><DialogDescription className="text-[11px] text-white/40 mt-1">Browse Stellar vaults and inspect this wallet’s position.</DialogDescription></div>
        <button onClick={() => onOpenChange(false)} aria-label="Close DeFindex dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center"><X size={14} className="text-white/70" /></button>
      </div>
      <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 text-[10px] text-white/40"><span className="truncate font-mono">{walletAddress}</span><span className="shrink-0 capitalize">{network}</span></div>
        {position && selectedVault && <div className="border border-sand/20 bg-sand/[0.04] p-3 space-y-2">
          <div className="flex justify-between gap-2"><div><p className="text-[12px] text-white font-semibold">{position.vault.name ?? "DeFindex vault"} {position.vault.symbol ? `(${position.vault.symbol})` : ""}</p><p className="mt-1 text-[10px] text-white/40 font-mono">{shortAddress(selectedVault)}</p></div><button onClick={() => window.open(`https://stellar.expert/explorer/${network === "testnet" ? "testnet" : "public"}/contract/${selectedVault}`, "_blank", "noopener,noreferrer")} title="View vault contract" className="text-white/40 hover:text-white"><ExternalLink size={14} /></button></div>
          <p className="text-[10px] text-white/55">Vault shares: <span className="text-white">{position.position.dfTokens}</span></p>
          <div className="space-y-1">{position.position.underlyingBalance.map((value, index) => <p key={index} className="text-[10px] text-white/55">Underlying asset {position.vault.assets?.[index]?.symbol ?? index + 1}: <span className="text-white">{value} raw units</span></p>)}</div>
          {position.vault.apy !== undefined && <p className="text-[10px] text-white/55">Current reported APY: <span className="text-white">{position.vault.apy}%</span></p>}
          <p className="text-[9px] text-white/35">Balances are returned by DeFindex in smallest units. Values are not converted to display units here.</p>
          <div className="flex gap-2 pt-2"><button onClick={() => { setAction("deposit"); setAmounts(position.vault.assets?.map(() => "") ?? []); setQuote(null); }} className="flex-1 flex items-center justify-center gap-2 bg-sand px-3 py-2 text-[11px] font-bold text-ink-dark"><ArrowDownToLine size={13} />Deposit</button><button onClick={() => { setAction("withdraw"); setAmounts(position.vault.assets?.map(() => "") ?? []); setQuote(null); }} className="flex-1 flex items-center justify-center gap-2 border border-white/15 px-3 py-2 text-[11px] font-semibold text-white"><ArrowUpFromLine size={13} />Withdraw</button></div>
        </div>}
        {action && position && selectedVault && <div className="border border-white/10 p-3 space-y-3">
          <div className="flex items-center justify-between"><p className="text-[11px] text-white font-semibold">{action === "deposit" ? "Deposit into vault" : "Withdraw from vault"}</p><button onClick={() => { setAction(null); setQuote(null); }} disabled={actionBusy} className="text-[10px] text-white/40 hover:text-white">Close</button></div>
          {position.vault.assets?.map((asset, index) => <label key={asset.address} className="block text-[10px] text-white/55">{asset.symbol ?? asset.name ?? `Asset ${index + 1}`} ({asset.address.slice(0, 6)}…{asset.address.slice(-4)}){action === "withdraw" && <span className="ml-1 text-white/35">available: {position.position.underlyingBalance[index] ?? 0} raw units</span>}<input inputMode="decimal" value={amounts[index] ?? ""} onChange={(event) => { setAmounts((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value)); setQuote(null); }} placeholder="0.00" className="mt-1 w-full bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-white outline-none" /></label>)}
          {action === "deposit" && <label className="flex items-center gap-2 text-[10px] text-white/55"><input type="checkbox" checked={invest} onChange={(event) => { setInvest(event.target.checked); setQuote(null); }} />Invest deposited assets into the vault strategy</label>}
          <label className="block text-[10px] text-white/55">Slippage tolerance<select value={slippageBps} onChange={(event) => { setSlippageBps(Number(event.target.value)); setQuote(null); }} className="mt-1 w-full bg-[#202020] border border-white/10 px-3 py-2 text-[11px] text-white outline-none"><option value={50}>0.5%</option><option value={100}>1%</option><option value={300}>3%</option><option value={500}>5%</option></select></label>
          {quote ? <div className="space-y-2"><p className="text-[10px] text-white/50">Review {quote.action} amounts in smallest units: {quote.amounts.join(", ")}. The XDR expires in 5 minutes.</p><button onClick={() => void signAndSubmit()} disabled={actionBusy} className="w-full flex items-center justify-center gap-2 bg-sand px-3 py-2.5 text-[11px] font-bold text-ink-dark disabled:opacity-50">{actionBusy ? <Loader2 size={13} className="animate-spin" /> : null}{actionBusy ? "Waiting for Freighter…" : "Review and sign with Freighter"}</button></div> : <button onClick={() => void prepareAction()} disabled={actionBusy} className="w-full flex items-center justify-center gap-2 border border-white/15 px-3 py-2.5 text-[11px] font-semibold text-white disabled:opacity-50">{actionBusy ? <Loader2 size={13} className="animate-spin" /> : null}{actionBusy ? "Preparing transaction…" : "Prepare transaction"}</button>}
          <p className="text-[9px] leading-relaxed text-white/35">The backend prepares an unsigned transaction. Freighter must approve it before submission. Deposit and withdrawal are on-chain operations and may be affected by strategy liquidity and slippage.</p>
        </div>}
        <div className="flex items-center justify-between"><h3 className="text-[12px] font-semibold text-white">Available vaults</h3><button onClick={() => void loadVaults()} disabled={loading} className="flex items-center gap-1 text-[10px] text-white/45 hover:text-white disabled:opacity-40"><RefreshCw size={11} className={loading ? "animate-spin" : ""} />Refresh</button></div>
        {loading && vaults.length === 0 ? <div className="flex items-center gap-2 text-[11px] text-white/40"><Loader2 size={13} className="animate-spin" />Loading vaults…</div> : vaults.length === 0 ? <p className="text-[11px] text-white/35">No vaults were returned for this network.</p> : <div className="space-y-2">{vaults.map((vault) => <button key={vault.address} onClick={() => void showPosition(vault.address)} disabled={loadingPosition} className="w-full flex items-center justify-between gap-3 border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] px-3 py-3 text-left disabled:opacity-50"><span className="min-w-0"><span className="block text-[11px] text-white">{shortAddress(vault.address)}</span><span className="block mt-1 text-[9px] text-white/35 font-mono">{vault.address}</span></span><span className="shrink-0 text-right"><span className="block text-[11px] text-white">{vault.apy === undefined ? "APY —" : `${vault.apy}% APY`}</span><span className="block mt-1 text-[9px] text-white/35">{selectedVault === vault.address && loadingPosition ? "Loading…" : "View position"}</span></span></button>)}</div>}
        <p className="text-[10px] leading-relaxed text-white/35">Vault details, positions, deposits, and withdrawals require `DEFINDEX_API_KEY` on the Provance backend. The API key stays server-side; Freighter approves every transaction.</p>
      </div>
    </DialogContent>
  </Dialog>;
}
