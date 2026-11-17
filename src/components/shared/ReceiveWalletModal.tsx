import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, Copy, ExternalLink, Loader2, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getEvmSendNetworks } from "@/services/evm-transfer.service";
import { walletService, type IncomingEvmTransaction, type IncomingStellarPayment, type WalletChain } from "@/services/wallet.service";

interface ReceiveWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  walletChain: WalletChain;
}

const STELLAR_EXPLORER = "https://stellar.expert/explorer";
export function ReceiveWalletModal({ open, onOpenChange, address, walletChain }: ReceiveWalletModalProps) {
  const evmNetworks = getEvmSendNetworks(walletChain);
  const [network, setNetwork] = useState(walletChain === "stellar" ? "mainnet" : String(evmNetworks[0]?.id ?? ""));
  const [payments, setPayments] = useState<IncomingStellarPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [evmTransactions, setEvmTransactions] = useState<IncomingEvmTransaction[]>([]);
  const [loadingEvmTransactions, setLoadingEvmTransactions] = useState(false);
  const [evmHistoryError, setEvmHistoryError] = useState("");
  const stellar = walletChain === "stellar";
  const selectedEvmNetwork = evmNetworks.find((chain) => String(chain.id) === network) ?? evmNetworks[0];

  const loadIncoming = useCallback(async () => {
    if (!stellar) return;
    setLoadingPayments(true);
    try {
      setPayments(await walletService.getStellarIncoming(address, network === "testnet" ? "testnet" : "mainnet"));
    } catch (error) {
      setPayments([]);
      toast.error(error instanceof Error ? error.message : "Could not load incoming payments");
    } finally { setLoadingPayments(false); }
  }, [address, network, stellar]);

  useEffect(() => {
    if (open && stellar) void loadIncoming();
  }, [open, stellar, loadIncoming]);

  const loadEvmIncoming = useCallback(async () => {
    if (stellar || !selectedEvmNetwork) return;
    setLoadingEvmTransactions(true);
    setEvmHistoryError("");
    try {
      setEvmTransactions(await walletService.getEvmIncoming(address, selectedEvmNetwork.id));
    } catch (error) {
      setEvmTransactions([]);
      setEvmHistoryError(error instanceof Error ? error.message : "Could not load incoming EVM transactions");
    } finally { setLoadingEvmTransactions(false); }
  }, [address, selectedEvmNetwork, stellar]);

  useEffect(() => {
    if (open && !stellar) void loadEvmIncoming();
  }, [open, stellar, loadEvmIncoming]);

  async function copyAddress() {
    try { await navigator.clipboard.writeText(address); toast.success("Receive address copied"); }
    catch { toast.error("Could not copy address"); }
  }

  const explorerUrl = stellar
    ? `${STELLAR_EXPLORER}/${network === "testnet" ? "testnet" : "public"}/account/${address}`
    : selectedEvmNetwork?.blockExplorers?.default.url ? `${selectedEvmNetwork.blockExplorers.default.url}/address/${address}` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[520px] [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Receive {stellar ? "Stellar assets" : "crypto"}</DialogTitle>
            <DialogDescription className="text-[11px] text-white/40 mt-1">Use this address on the selected network.</DialogDescription>
          </div>
          <button onClick={() => onOpenChange(false)} aria-label="Close receive dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center"><X size={14} className="text-white/70" /></button>
        </div>
        <div className="p-6 space-y-4">
          <label className="block text-[11px] text-white/50">Network
            {stellar ? <select value={network} onChange={(event) => setNetwork(event.target.value)} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none"><option value="mainnet">Stellar Mainnet · XLM</option><option value="testnet">Stellar Testnet · XLM</option></select> : <select value={network} onChange={(event) => setNetwork(event.target.value)} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none">{evmNetworks.map((chain) => <option key={chain.id} value={chain.id}>{chain.name} · {chain.nativeCurrency.symbol}</option>)}</select>}
          </label>
          <div className="border border-white/10 bg-white/[.03] p-4">
            <p className="text-[10px] uppercase tracking-wide text-white/35">Receive address</p>
            <p className="mt-2 break-all text-[12px] leading-relaxed text-white font-mono">{address}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => void copyAddress()} className="flex items-center gap-2 border border-white/15 px-3 py-2 text-[10px] font-semibold text-white/75"><Copy size={12} />Copy address</button>
              {explorerUrl && <a href={explorerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-white/15 px-3 py-2 text-[10px] font-semibold text-white/75"><ExternalLink size={12} />View explorer</a>}
            </div>
          </div>
          {stellar ? <>
            <div className="space-y-1 text-[10px] leading-relaxed text-white/45">
              <p>Send XLM or a Stellar asset only on the selected network.</p>
              <p>A new Stellar account must be created with a qualifying XLM payment before it can receive other payments. Receiving an issued asset also requires a trustline for that asset.</p>
            </div>
            <div className="border border-white/8">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <div><p className="text-[11px] font-semibold text-white">Recent incoming payments</p><p className="mt-0.5 text-[9px] text-white/35">Latest 50 Stellar payments, filtered to this address</p></div>
                <button onClick={() => void loadIncoming()} disabled={loadingPayments} title="Refresh incoming payments" className="flex size-7 items-center justify-center text-white/45 hover:text-white disabled:opacity-40"><RefreshCw size={12} className={loadingPayments ? "animate-spin" : ""} /></button>
              </div>
              {loadingPayments ? <p className="flex items-center gap-2 px-4 py-4 text-[10px] text-white/40"><Loader2 size={12} className="animate-spin" />Checking Horizon…</p> : payments.length === 0 ? <p className="px-4 py-4 text-[10px] text-white/40">No incoming payments found on {network}.</p> : payments.slice(0, 8).map((payment) => (
                <div key={payment.id} className="flex items-center gap-3 border-t border-white/6 px-4 py-2.5">
                  <ArrowDownToLine size={13} className="shrink-0 text-emerald-300/75" />
                  <div className="min-w-0 flex-1"><p className="text-[11px] text-white">{payment.amount} {payment.asset.split(" · ")[0]}</p><p className="mt-0.5 truncate text-[9px] text-white/35">From {payment.from.slice(0, 8)}…{payment.from.slice(-6)} · {new Date(payment.createdAt).toLocaleString()}</p></div>
                  <a href={`${STELLAR_EXPLORER}/${network === "testnet" ? "testnet" : "public"}/tx/${payment.transactionHash}`} target="_blank" rel="noreferrer" className="shrink-0 font-mono text-[9px] text-white/40 hover:text-white">{payment.transactionHash.slice(0, 8)}…</a>
                </div>
              ))}
            </div>
          </> : <>
            <div className="space-y-1 text-[10px] leading-relaxed text-white/45"><p>Send only assets on {selectedEvmNetwork?.name ?? "the selected EVM network"} to this address.</p><p>Confirm deposits on the selected network before using received assets.</p></div>
            <div className="border border-white/8">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <div><p className="text-[11px] font-semibold text-white">Recent incoming transactions</p><p className="mt-0.5 text-[9px] text-white/35">Native assets and ERC-20 transfers · Powered by Etherscan APIs</p></div>
                <button onClick={() => void loadEvmIncoming()} disabled={loadingEvmTransactions} title="Refresh incoming transactions" className="flex size-7 items-center justify-center text-white/45 hover:text-white disabled:opacity-40"><RefreshCw size={12} className={loadingEvmTransactions ? "animate-spin" : ""} /></button>
              </div>
              {loadingEvmTransactions ? <p className="flex items-center gap-2 px-4 py-4 text-[10px] text-white/40"><Loader2 size={12} className="animate-spin" />Checking indexed transactions…</p> : evmHistoryError ? <p className="px-4 py-4 text-[10px] leading-relaxed text-amber-200/70">{evmHistoryError}</p> : evmTransactions.length === 0 ? <p className="px-4 py-4 text-[10px] text-white/40">No incoming transactions found on {selectedEvmNetwork?.name}.</p> : evmTransactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 border-t border-white/6 px-4 py-2.5">
                  <ArrowDownToLine size={13} className="shrink-0 text-emerald-300/75" />
                  <div className="min-w-0 flex-1"><p className="text-[11px] text-white">{tx.amount} {tx.asset}</p><p className="mt-0.5 truncate text-[9px] text-white/35">From {tx.from.slice(0, 8)}…{tx.from.slice(-6)} · {new Date(tx.createdAt).toLocaleString()}</p></div>
                  <a href={`${selectedEvmNetwork?.blockExplorers?.default.url}/tx/${tx.transactionHash}`} target="_blank" rel="noreferrer" className="shrink-0 font-mono text-[9px] text-white/40 hover:text-white">{tx.transactionHash.slice(0, 8)}…</a>
                </div>
              ))}
            </div>
          </>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
