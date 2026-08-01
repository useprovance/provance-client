"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Wallet, ChevronRight } from "lucide-react";
import {
   Dialog,
   DialogContent,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import ProvanceLogo from "@/components/shared/ProvanceLogo";
import { FormInput } from "@/components/ui/form-input";

type AuthMode = "default" | "wallet-select" | "onboarding";

interface WalletProvider {
   info: { uuid: string; name: string; icon: string; rdns: string };
   provider: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
   };
}

const GOAT_CHAIN_ID = "0x929"; // 2345

async function switchToGoat(provider: WalletProvider["provider"]) {
   try {
      await provider.request({
         method: "wallet_switchEthereumChain",
         params: [{ chainId: GOAT_CHAIN_ID }],
      });
   } catch (err: unknown) {
      if ((err as { code?: number }).code === 4902) {
         await provider.request({
            method: "wallet_addEthereumChain",
            params: [
               {
                  chainId: GOAT_CHAIN_ID,
                  chainName: "GOAT Network",
                  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
                  rpcUrls: ["https://rpc.goat.network"],
                  blockExplorerUrls: ["https://explorer.goat.network"],
               },
            ],
         });
      }
   }
}

function discoverWallets(): Promise<WalletProvider[]> {
   return new Promise((resolve) => {
      const found: WalletProvider[] = [];
      const handler = (e: Event) =>
         found.push((e as CustomEvent<WalletProvider>).detail);
      window.addEventListener("eip6963:announceProvider", handler);
      window.dispatchEvent(new Event("eip6963:requestProvider"));
      setTimeout(() => {
         window.removeEventListener("eip6963:announceProvider", handler);
         resolve(found);
      }, 200);
   });
}

interface AuthModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
   const router = useRouter();
   const setUser = useAuthStore((s) => s.setUser);
   const [mode, setMode] = useState<AuthMode>("default");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [name, setName] = useState("");
   const [detectedWallets, setDetectedWallets] = useState<WalletProvider[]>([]);
   const [pendingWallet, setPendingWallet] = useState<{
      address: string;
      signature: string;
      message: string;
   } | null>(null);
   useEffect(() => {
      if (!open) {
         setMode("default");
         setLoading(false);
         setError(null);
         setName("");
         setDetectedWallets([]);
         setPendingWallet(null);
      }
   }, [open]);

   const handleGoogleSignIn = () => {
      window.location.href = "/api/auth/google";
   };

   const connectWithProvider = async (wallet: WalletProvider) => {
      setError(null);
      try {
         setLoading(true);
         const accounts = (await wallet.provider.request({
            method: "eth_requestAccounts",
         })) as string[];
         const address = accounts[0];
         if (!address) throw new Error("No account selected");

         await switchToGoat(wallet.provider);

         const message = `Welcome to Provance.\n\nSign this message to verify your wallet.\n\nNonce: ${Date.now()}`;
         const signature = (await wallet.provider.request({
            method: "personal_sign",
            params: [message, address],
         })) as string;

         const res = await fetch("/api/auth/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address, signature, message }),
         });

         const data = await res.json() as {
            user?: { id: string; name: string; email: string | null; avatar_url: string | null; provider: string; wallet_address: string | null };
            requiresOnboarding?: boolean;
            error?: string;
         };

         if (data.requiresOnboarding) {
            setPendingWallet({ address, signature, message });
            setMode("onboarding");
            return;
         }

         if (!res.ok || !data.user) {
            throw new Error(data.error ?? "Wallet auth failed");
         }

         setUser(data.user);
         onOpenChange(false);
         router.push("/dashboard");
      } catch (err) {
         setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
         setLoading(false);
      }
   };

   const handleWalletConnect = async () => {
      setError(null);
      try {
         setLoading(true);
         const wallets = await discoverWallets();

         if (wallets.length === 0) {
            setError("No wallet found. Install MetaMask or open in a Web3 browser.");
            return;
         }

         if (wallets.length === 1) {
            await connectWithProvider(wallets[0]!);
            return;
         }

         setDetectedWallets(wallets);
         setMode("wallet-select");
      } catch (err) {
         setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
         setLoading(false);
      }
   };

   const handleOnboardingContinue = async () => {
      if (!name.trim() || name.trim().length < 2 || !pendingWallet) return;
      setError(null);
      try {
         setLoading(true);
         const res = await fetch("/api/auth/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...pendingWallet, name: name.trim() }),
         });

         const data = await res.json() as {
            user?: { id: string; name: string; email: string | null; avatar_url: string | null; provider: string; wallet_address: string | null };
            error?: string;
         };

         if (!res.ok || !data.user) {
            throw new Error(data.error ?? "Could not create profile");
         }

         setUser(data.user);
         onOpenChange(false);
         router.push("/dashboard");
      } catch (err) {
         setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
         setLoading(false);
      }
   };

   const title =
      mode === "wallet-select"
         ? "Choose wallet"
         : mode === "onboarding"
         ? "What should we call you?"
         : "Get started";

   const subtitle =
      mode === "wallet-select"
         ? "Select the wallet you want to connect."
         : mode === "onboarding"
         ? "This is how you will appear on the network."
         : "Connect your wallet or continue with Google to access Provance.";

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            className="overflow-hidden rounded-xl border border-sand-faint bg-ink p-0 shadow-2xl sm:max-w-[380px]"
         >
            <button
               type="button"
               onClick={() => onOpenChange(false)}
               className="absolute right-4 top-4 z-10 flex size-7 items-center justify-center rounded-md text-sand/40 transition-colors hover:bg-charcoal hover:text-sand cursor-pointer"
               aria-label="Close"
            >
               <X className="size-4" />
            </button>

            <div className="px-6 pb-5 pt-10">
               {/* Logo */}
               <div className="flex justify-center">
                  <ProvanceLogo className="h-10 w-auto text-sand" />
               </div>

               {/* Title + subtitle */}
               <div className="mt-4 text-center">
                  <DialogTitle className="font-geist font-bold text-2xl uppercase tracking-wide text-sand">
                     {title}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-[11px] text-sand/50">
                     {subtitle}
                  </DialogDescription>
               </div>

               {error && (
                  <p className="mt-4 text-xs text-red-400 leading-relaxed text-center">{error}</p>
               )}

               {/* Body */}
               <div className="mt-5">
                  {mode === "wallet-select" ? (
                     <div className="space-y-2">
                        {detectedWallets.map((wallet) => (
                           <button
                              key={wallet.info.uuid}
                              type="button"
                              onClick={() => void connectWithProvider(wallet)}
                              disabled={loading}
                              className="flex w-full items-center gap-3 rounded-md border border-sand-faint bg-charcoal px-4 py-3 text-left transition-colors hover:border-orange/40 hover:bg-charcoal-light disabled:opacity-50 cursor-pointer"
                           >
                              <img
                                 src={wallet.info.icon}
                                 alt={wallet.info.name}
                                 className="size-6 shrink-0 rounded-sm"
                              />
                              <span className="text-sm text-sand">{wallet.info.name}</span>
                           </button>
                        ))}
                     </div>
                  ) : mode === "onboarding" ? (
                     <div onKeyDown={(e) => { if (e.key === "Enter" && !loading) void handleOnboardingContinue(); }}>
                        <FormInput
                           label="Display name"
                           value={name}
                           onChange={setName}
                           placeholder="Your name"
                           required
                        />
                     </div>
                  ) : (
                     <>
                        {/* Google */}
                        <button
                           type="button"
                           onClick={handleGoogleSignIn}
                           className="flex w-full items-center justify-center gap-3 border border-sand-faint bg-transparent px-5 py-4 text-sm text-sand transition-colors hover:bg-sand-faint cursor-pointer"
                        >
                           <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                           </svg>
                           Continue with Google
                        </button>

                        <div className="my-3 flex items-center gap-3">
                           <div className="h-px flex-1 bg-sand-faint" />
                           <span className="text-[11px] text-sand/30">or</span>
                           <div className="h-px flex-1 bg-sand-faint" />
                        </div>

                        {/* Connect Wallet */}
                        <button
                           type="button"
                           onClick={() => void handleWalletConnect()}
                           disabled={loading}
                           className="flex items-center justify-between w-full px-5 py-3.5 bg-orange text-ink-dark text-sm font-bold hover:bg-orange-dark transition-colors disabled:opacity-50 cursor-pointer"
                           style={{
                              clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
                           }}
                        >
                           <span className="flex items-center gap-2">
                              <Wallet className="size-4" />
                              {loading ? "Connecting…" : "Connect Wallet"}
                           </span>
                           <ChevronRight className="size-4" />
                        </button>
                     </>
                  )}

                  {/* CTA — only on onboarding */}
                  {mode === "onboarding" && (
                     <button
                        type="button"
                        onClick={() => void handleOnboardingContinue()}
                        disabled={loading || name.trim().length < 2}
                        className="mt-4 flex h-10 w-full items-center justify-center gap-1 rounded-md bg-sand text-sm font-medium text-ink-dark transition-colors hover:bg-sand-light disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                     >
                        {loading ? "Setting up…" : "Enter Provance"}
                        <ChevronRight className="size-[18px]" />
                     </button>
                  )}
               </div>
            </div>

            {/* Footer */}
            <div className="border-t border-sand-faint bg-ink-heavy px-6 py-3 text-center">
               <p className="text-[11px] text-sand/40">
                  {mode === "onboarding" || mode === "wallet-select" ? (
                     <>
                        Wrong choice?{" "}
                        <button
                           type="button"
                           onClick={() => setMode("default")}
                           className="font-medium text-sand/70 underline underline-offset-2 transition-colors hover:text-sand cursor-pointer"
                        >
                           Go back
                        </button>
                     </>
                  ) : (
                     "By continuing you agree to our terms of service and privacy policy."
                  )}
               </p>
            </div>
         </DialogContent>
      </Dialog>
   );
}
