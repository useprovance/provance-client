"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Zap, Star, ChevronRight } from "lucide-react";
import {
   Dialog,
   DialogContent,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";

interface WalletPickerModalProps {
   open: boolean;
   onOpenChange: (v: boolean) => void;
   onConnected: (address: string, chain: "evm" | "stellar") => Promise<void>;
   onError?: (msg: string) => void;
}

function EcosystemRow({
   icon, title, wallets, loading, onClick,
}: {
   icon: React.ReactNode; title: string; wallets: string; loading: boolean; onClick: () => void;
}) {
   return (
      <button
         onClick={onClick}
         disabled={loading}
         className="w-full flex items-center gap-4 border border-sand-faint bg-transparent hover:bg-sand-faint px-5 py-4 text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
         <div className="flex size-9 items-center justify-center rounded-lg bg-charcoal border border-sand-faint shrink-0">
            {icon}
         </div>
         <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-sand">{title}</p>
            <p className="text-[11px] text-sand/40 mt-0.5 truncate">{wallets}</p>
         </div>
         {loading ? (
            <Loader2 size={15} className="text-sand/40 animate-spin shrink-0" />
         ) : (
            <ChevronRight size={15} className="text-sand/30 shrink-0" />
         )}
      </button>
   );
}

// Initialize the Stellar kit eagerly so WalletConnect's async SignClient.init()
// has time to resolve before the user clicks. Runs once on first mount.
let stellarReady = false;
async function initStellarKit() {
   if (stellarReady) return;
   stellarReady = true;
   const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
   const { SwkAppDarkTheme } = await import("@creit.tech/stellar-wallets-kit/types");
   const { AlbedoModule } = await import("@creit.tech/stellar-wallets-kit/modules/albedo");
   const { xBullModule } = await import("@creit.tech/stellar-wallets-kit/modules/xbull");
   const { FreighterModule } = await import("@creit.tech/stellar-wallets-kit/modules/freighter");
   const { LobstrModule } = await import("@creit.tech/stellar-wallets-kit/modules/lobstr");
   const { WalletConnectModule } = await import("@creit.tech/stellar-wallets-kit/modules/wallet-connect");

   StellarWalletsKit.init({
      theme: { ...SwkAppDarkTheme, primary: "#d95e28" },
      modules: [
         new AlbedoModule(),
         new WalletConnectModule({
            projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
            metadata: {
               name: "Provance",
               description: "Autonomous AI agent workforce platform",
               url: process.env.NEXT_PUBLIC_APP_URL ?? "https://useprovance.xyz",
               icons: ["https://useprovance.xyz/favicon.ico"],
            },
         }),
         new xBullModule(),
         new FreighterModule(),
         new LobstrModule(),
      ],
   });
}

export function WalletPickerModal({ open, onOpenChange, onConnected, onError }: WalletPickerModalProps) {
   const [evmLoading, setEvmLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const busyRef = useRef(false);

   // Initialize Stellar kit as soon as the picker modal first opens
   useEffect(() => {
      if (open) void initStellarKit();
      else { setError(null); setEvmLoading(false); busyRef.current = false; }
   }, [open]);

   const handleEvm = useCallback(async () => {
      if (busyRef.current) return;
      setError(null);
      setEvmLoading(true);
      busyRef.current = true;
      try {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const eth = (window as any).ethereum as { request: (a: { method: string }) => Promise<string[]> } | undefined;
         if (!eth) {
            setError("No EVM wallet found. Install MetaMask or Coinbase Wallet.");
            return;
         }
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

   const handleStellar = useCallback(async () => {
      if (busyRef.current) return;
      busyRef.current = true;

      // Close our dialog first so its backdrop doesn't block the Stellar kit modal
      onOpenChange(false);
      await new Promise((r) => setTimeout(r, 200));

      try {
         const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
         const { address } = await StellarWalletsKit.authModal();
         await onConnected(address, "stellar");
      } catch (e: unknown) {
         const msg = e instanceof Error ? e.message : "";
         const isCancelled = !msg || msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("rejected");
         if (!isCancelled && onError) onError(msg);
      } finally {
         busyRef.current = false;
      }
   }, [onConnected, onOpenChange, onError]);

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            className="overflow-hidden rounded-xl border border-sand-faint bg-ink p-0 shadow-2xl sm:max-w-[360px]"
         >
            <div className="px-6 pt-7 pb-2">
               <DialogTitle className="font-geist font-bold text-lg uppercase tracking-wide text-sand">
                  Connect wallet
               </DialogTitle>
               <DialogDescription className="mt-1 text-[11px] text-sand/50">
                  Choose your wallet ecosystem to continue.
               </DialogDescription>
            </div>

            <div className="px-6 pb-2 flex flex-col gap-2.5 mt-3">
               <EcosystemRow
                  icon={<Zap size={16} strokeWidth={1.5} className="text-sand/70" />}
                  title="EVM wallet"
                  wallets="MetaMask · Coinbase · Brave · Rabby"
                  loading={evmLoading}
                  onClick={() => void handleEvm()}
               />
               <EcosystemRow
                  icon={<Star size={16} strokeWidth={1.5} className="text-sand/70" />}
                  title="Stellar wallet"
                  wallets="Albedo · WalletConnect · xBull · Freighter · Lobstr"
                  loading={false}
                  onClick={() => void handleStellar()}
               />
            </div>

            {error && <p className="px-6 pb-3 text-[11px] text-red-400">{error}</p>}

            <div className="border-t border-sand-faint bg-ink-heavy px-6 py-3 text-center">
               <p className="text-[11px] text-sand/40">
                  Provance does not store your private keys or seed phrase.
               </p>
            </div>
         </DialogContent>
      </Dialog>
   );
}
