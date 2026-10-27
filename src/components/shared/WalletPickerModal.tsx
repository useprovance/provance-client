import { useCallback, useRef, useState } from "react";
import { Loader2, Zap, Star, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface WalletPickerModalProps {
   open: boolean;
   onOpenChange: (v: boolean) => void;
   onConnected: (address: string, chain: "evm" | "stellar") => Promise<void>;
}

function EcosystemRow({ icon, title, wallets, loading, onClick, disabled }: {
   icon: React.ReactNode; title: string; wallets: string; loading: boolean; onClick: () => void; disabled?: boolean;
}) {
   return (
      <button
         onClick={onClick}
         disabled={loading || disabled}
         className="w-full flex items-center gap-4 border border-white/8 bg-transparent hover:bg-white/4 px-5 py-4 text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
         <div className="flex size-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 shrink-0">
            {icon}
         </div>
         <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white">{title}</p>
            <p className="text-[11px] text-white/40 mt-0.5 truncate">{wallets}</p>
         </div>
         {loading
            ? <Loader2 size={15} className="text-white/40 animate-spin shrink-0" />
            : <ChevronRight size={15} className="text-white/30 shrink-0" />
         }
      </button>
   );
}

export function WalletPickerModal({ open, onOpenChange, onConnected }: WalletPickerModalProps) {
   const [evmLoading, setEvmLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const busyRef = useRef(false);

   const handleEvm = useCallback(async () => {
      if (busyRef.current) return;
      setError(null);
      setEvmLoading(true);
      busyRef.current = true;
      try {
         const eth = (window as unknown as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } }).ethereum;
         if (!eth) { setError("No EVM wallet found. Install MetaMask or Coinbase Wallet."); return; }
         const accounts = await eth.request({ method: "eth_requestAccounts" });
         const address = accounts[0];
         if (!address) throw new Error("No account returned");
         await onConnected(address, "evm");
         onOpenChange(false);
      } catch (e: unknown) {
         const msg = e instanceof Error ? e.message : "Connection failed";
         if (!msg.includes("4001") && !msg.toLowerCase().includes("rejected") && !msg.toLowerCase().includes("cancel")) {
            setError(msg);
         }
      } finally {
         setEvmLoading(false);
         busyRef.current = false;
      }
   }, [onConnected, onOpenChange]);

   return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setError(null); } onOpenChange(o); }}>
         <DialogContent className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[380px] [&>button]:hidden overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
               <div>
                  <DialogTitle className="text-[15px] font-semibold text-white font-manrope">Connect wallet</DialogTitle>
                  <DialogDescription className="text-[11px] text-white/40 mt-0.5">Choose your wallet ecosystem to continue.</DialogDescription>
               </div>
               <button
                  onClick={() => onOpenChange(false)}
                  className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
               >
                  <X size={14} strokeWidth={2} className="text-white/70" />
               </button>
            </div>

            <div className="p-4 flex flex-col gap-2">
               <EcosystemRow
                  icon={<Zap size={16} strokeWidth={1.5} className="text-white/60" />}
                  title="EVM wallet"
                  wallets="MetaMask · Coinbase · Brave · Rabby"
                  loading={evmLoading}
                  onClick={() => void handleEvm()}
               />
               <EcosystemRow
                  icon={<Star size={16} strokeWidth={1.5} className="text-white/60" />}
                  title="Stellar wallet"
                  wallets="Albedo · xBull · Freighter · Lobstr"
                  loading={false}
                  disabled
                  onClick={() => {}}
               />
            </div>

            {error && <p className="px-6 pb-3 text-[11px] text-red-400">{error}</p>}

            <div className="border-t border-white/8 bg-white/2 px-6 py-3 text-center">
               <p className="text-[11px] text-white/30">Provance does not store your private keys.</p>
            </div>
         </DialogContent>
      </Dialog>
   );
}
