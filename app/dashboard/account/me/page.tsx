"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, Loader2, Copy, Plus, User, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useConnectWallet } from "@privy-io/react-auth";

import { WalletBlockie } from "@/components/account/WalletBlockie";
import { FormInput } from "@/components/ui/form-input";
import { useAuthStore } from "@/stores/useAuthStore";

type WalletRow = {
   id: string;
   address: string;
   chain: string;
   label: string | null;
   created_at: string;
};

function Section({
   title,
   description,
   children,
}: {
   title: string;
   description: string;
   children: React.ReactNode;
}) {
   return (
      <div className="flex flex-col gap-4">
         <div>
            <h2 className="text-[15px] font-semibold text-white">{title}</h2>
            <p className="text-[12px] text-white/40 mt-0.5">{description}</p>
         </div>
         {children}
      </div>
   );
}

function Card({ children }: { children: React.ReactNode }) {
   return (
      <div className="border border-white/8 bg-[#161616] rounded-lg overflow-hidden divide-y divide-white/8">
         {children}
      </div>
   );
}

export default function AccountMePage() {
   const user = useAuthStore((s) => s.user);
   const setUser = useAuthStore((s) => s.setUser);

   const [name, setName] = useState("");
   const [saving, setSaving] = useState(false);
   const [saved, setSaved] = useState(false);
   const [profileError, setProfileError] = useState<string | null>(null);

   const [wallets, setWallets] = useState<WalletRow[]>([]);
   const [walletError, setWalletError] = useState<string | null>(null);

   const { connectWallet } = useConnectWallet({
      onSuccess: async (wallet) => {
         setWalletError(null);
         const res = await fetch("/api/account/wallets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: wallet.address, chain: "stellar" }),
         });
         const data = await res.json() as { error?: string };
         if (!res.ok) {
            setWalletError(data.error ?? "Could not save wallet");
         } else {
            void fetchWallets();
         }
      },
      onError: (error) => {
         const msg = error instanceof Error ? error.message : String(error);
         if (!msg.toLowerCase().includes("cancel") && !msg.toLowerCase().includes("reject")) {
            setWalletError(msg);
         }
      },
   });

   useEffect(() => {
      if (user?.name) setName(user.name);
   }, [user?.name]);

   const fetchWallets = useCallback(async () => {
      const res = await fetch("/api/account/wallets");
      if (res.ok) {
         const data = (await res.json()) as { wallets: WalletRow[] };
         setWallets(data.wallets);
      }
   }, []);

   useEffect(() => {
      void fetchWallets();
   }, [fetchWallets]);

   const handleSave = async () => {
      if (!name.trim() || name.trim() === user?.name) return;
      setSaving(true);
      setProfileError(null);

      const res = await fetch("/api/account/profile", {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ name: name.trim() }),
      });

      const data = (await res.json()) as {
         ok?: boolean;
         user?: typeof user;
         error?: string;
      };
      setSaving(false);

      if (!res.ok || !data.ok) {
         setProfileError(data.error ?? "Could not save");
         return;
      }
      if (data.user) setUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
   };

   const handleDisconnect = async (id: string) => {
      await fetch(`/api/account/wallets/${id}`, { method: "DELETE" });
      setWallets((prev) => prev.filter((w) => w.id !== id));
   };

   return (
      <div className="flex-1 overflow-y-auto bg-[#111111]">
         <div className="max-w-lg mx-auto px-6 py-10 flex flex-col gap-10">
            <div>
               <h1 className="text-xl font-bold text-white uppercase tracking-wide font-geist">
                  Account
               </h1>
               <p className="text-[12px] text-white/40 mt-1">
                  Manage your profile, sign-in method, and connected wallets.
               </p>
            </div>

            {/* Profile */}
            <Section
               title="Profile information"
               description="Your display name shown across Provance."
            >
               <div className="flex flex-col gap-5 [&_input]:font-medium [&_input]:text-[15px]">
                  <FormInput
                     label="Name"
                     value={name}
                     onChange={setName}
                     placeholder="Your name"
                     prefix={
                        <span className="flex items-center justify-center w-12 self-stretch shrink-0 bg-white/4 text-white/40">
                           <User size={22} strokeWidth={1.6} />
                        </span>
                     }
                  />
                  <FormInput
                     label="Email"
                     value={user?.email ?? ""}
                     onChange={() => {}}
                     type="email"
                     disabled
                     prefix={
                        <span className="flex items-center justify-center w-12 self-stretch shrink-0 bg-white/4 text-white/40">
                           <Mail size={22} strokeWidth={1.6} />
                        </span>
                     }
                  />
                  <div className="flex items-center gap-3 pt-1">
                     <button
                        onClick={handleSave}
                        disabled={
                           saving || !name.trim() || name.trim() === user?.name
                        }
                        className="flex items-center gap-2 bg-white hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed text-[#111111] text-[13px] font-semibold px-6 py-3 rounded-md transition-colors cursor-pointer"
                     >
                        {saving ? (
                           <Loader2 size={12} className="animate-spin" />
                        ) : saved ? (
                           <Check size={12} />
                        ) : null}
                        {saved ? "Saved" : "Save changes"}
                     </button>
                     {profileError && (
                        <p className="text-[11px] text-red-400">
                           {profileError}
                        </p>
                     )}
                  </div>
               </div>
            </Section>

            {/* Wallets */}
            <Section
               title="Wallets"
               description="Stellar wallets linked to your account for on-chain payments and agent interactions."
            >
               <Card>
                  {[
                     ...wallets,
                     ...(wallets.length === 0
                        ? [{ id: "dummy", address: "GDWBNK2WL5B2F45GAHKQUA6DN2WJ6ZIH6FVVZBVBHRL2AXBOIJ2VQ5QI", chain: "stellar", label: null, created_at: "" }]
                        : []),
                  ].map((w) => (
                     <div key={w.id} className="flex items-center gap-4 px-5 py-4">
                        <WalletBlockie address={w.address} size={48} />
                        <div className="flex-1 min-w-0">
                           <p className="text-[13px] text-white font-mono truncate">
                              {w.address.slice(0, 6)}...{w.address.slice(-6)}
                           </p>
                           <p className="text-[11px] text-white/40 mt-0.5 uppercase">Stellar</p>
                        </div>
                        <button
                           onClick={() => {
                              void navigator.clipboard.writeText(w.address);
                              toast.success("Address copied");
                           }}
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                           title="Copy address"
                        >
                           <Copy size={20} strokeWidth={1.5} />
                        </button>
                     </div>
                  ))}
                  <div className="flex items-center justify-between px-5 py-3">
                     {walletError && (
                        <p className="text-[11px] text-red-400 mr-auto">
                           {walletError}
                        </p>
                     )}
                     <button
                        onClick={() => connectWallet()}
                        className="ml-auto flex items-center gap-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                     >
                        <Plus size={12} strokeWidth={2} />
                        Add wallet
                     </button>
                  </div>
               </Card>
            </Section>

         </div>
      </div>
   );
}
