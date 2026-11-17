import { useState, type FormEvent } from "react";
import { Loader2, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getEvmSendNetworks, sendEvmNative } from "@/services/evm-transfer.service";
import type { WalletChain } from "@/services/wallet.service";

interface EvmSendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
  walletChain: WalletChain;
  onSubmitted?: () => void;
}

export function EvmSendModal({ open, onOpenChange, source, walletChain, onSubmitted }: EvmSendModalProps) {
  const networks = getEvmSendNetworks(walletChain);
  const [chainId, setChainId] = useState(networks[0]?.id ?? 1);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const network = networks.find((chain) => chain.id === chainId) ?? networks[0];
  if (!network) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    try {
      const result = await sendEvmNative({ source, destination: destination.trim(), amount: amount.trim(), chainId });
      toast.success(result.historySaved
        ? `Transaction recorded: ${result.hash.slice(0, 10)}…`
        : `Transaction submitted: ${result.hash.slice(0, 10)}… (activity will appear when the network is reachable)`);
      onSubmitted?.();
      setDestination("");
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!sending) onOpenChange(next); }}>
      <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 sm:max-w-[420px] [&>button]:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Send {network.nativeCurrency.symbol}</DialogTitle>
            <DialogDescription className="text-[11px] text-white/40 mt-1">Select the network and review the transaction in your wallet before signing.</DialogDescription>
          </div>
          <button onClick={() => onOpenChange(false)} disabled={sending} aria-label="Close send dialog" className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center disabled:opacity-40">
            <X size={14} className="text-white/70" />
          </button>
        </div>
        <form onSubmit={(event) => void handleSubmit(event)} className="p-6 space-y-4">
          <label className="block text-[11px] text-white/50">
            Network
            <select value={chainId} onChange={(event) => setChainId(Number(event.target.value))} className="mt-1.5 w-full bg-[#1b1b1b] border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none focus:border-white/30">
              {networks.map((chain) => <option key={chain.id} value={chain.id}>{chain.name} · {chain.nativeCurrency.symbol}</option>)}
            </select>
          </label>
          <label className="block text-[11px] text-white/50">
            From
            <input readOnly value={source} className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[11px] text-white/60 font-mono outline-none" />
          </label>
          <label className="block text-[11px] text-white/50">
            Destination address
            <input required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="0x…" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white font-mono outline-none focus:border-white/30" />
          </label>
          <label className="block text-[11px] text-white/50">
            Amount ({network.nativeCurrency.symbol})
            <input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mt-1.5 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-[12px] text-white outline-none focus:border-white/30" />
          </label>
          <p className="text-[10px] leading-relaxed text-white/35">Your connected wallet will switch networks if needed and show the final gas fee and transaction details. Provance never receives your private key.</p>
          <button type="submit" disabled={sending || !destination.trim() || !amount.trim()} className="w-full flex items-center justify-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-4 py-3 disabled:opacity-50">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
            {sending ? "Waiting for wallet…" : "Review and sign in wallet"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
