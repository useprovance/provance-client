"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, Loader2, Mail, Wallet, Globe, Unlink, Plus } from "lucide-react";
import { FormInput } from "@/components/ui/form-input";
import { WalletPickerModal } from "@/components/account/WalletPickerModal";
import { useAuthStore } from "@/stores/useAuthStore";

type WalletRow = { id: string; address: string; chain: string; label: string | null; created_at: string };

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
   return (
      <div className="flex flex-col gap-4">
         <div>
            <h2 className="text-[15px] font-semibold text-sand">{title}</h2>
            <p className="text-[12px] text-sand/50 mt-0.5">{description}</p>
         </div>
         {children}
      </div>
   );
}

function Card({ children }: { children: React.ReactNode }) {
   return (
      <div className="border border-[#2a2a2a] bg-[#161616] rounded-lg overflow-hidden divide-y divide-[#2a2a2a]">
         {children}
      </div>
   );
}

function CardRow({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
   return (
      <div className="flex items-center justify-between gap-6 px-5 py-4">
         <div className="shrink-0 w-40">
            <p className="text-[13px] text-sand">{label}</p>
            {sublabel && <p className="text-[11px] text-sand/40 mt-0.5">{sublabel}</p>}
         </div>
         <div className="flex-1">{children}</div>
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
   const [pickerOpen, setPickerOpen] = useState(false);
   const [walletError, setWalletError] = useState<string | null>(null);

   useEffect(() => {
      if (user?.name) setName(user.name);
   }, [user?.name]);

   const fetchWallets = useCallback(async () => {
      const res = await fetch("/api/account/wallets");
      if (res.ok) {
         const data = await res.json() as { wallets: WalletRow[] };
         setWallets(data.wallets);
      }
   }, []);

   useEffect(() => { void fetchWallets(); }, [fetchWallets]);

   const handleSave = async () => {
      if (!name.trim() || name.trim() === user?.name) return;
      setSaving(true);
      setProfileError(null);

      const res = await fetch("/api/account/profile", {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json() as { ok?: boolean; user?: typeof user; error?: string };
      setSaving(false);

      if (!res.ok || !data.ok) { setProfileError(data.error ?? "Could not save"); return; }
      if (data.user) setUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
   };

   const handleWalletConnected = useCallback(async (address: string, chain: "evm" | "stellar") => {
      setWalletError(null);
      const res = await fetch("/api/account/wallets", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ address, chain }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not save wallet");
      await fetchWallets();
   }, [fetchWallets]);

   const handleDisconnect = async (id: string) => {
      await fetch(`/api/account/wallets/${id}`, { method: "DELETE" });
      setWallets((prev) => prev.filter((w) => w.id !== id));
   };

   const providerIcon = user?.provider === "google"
      ? <Globe size={18} strokeWidth={1.5} className="text-sand/60 shrink-0" />
      : <Mail size={18} strokeWidth={1.5} className="text-sand/60 shrink-0" />;

   return (
      <div className="flex-1 overflow-y-auto">
         <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-10">

            <div>
               <h1 className="text-xl font-bold text-sand uppercase tracking-wide font-geist">Account</h1>
               <p className="text-[12px] text-sand/50 mt-1">Manage your profile, sign-in method, and connected wallets.</p>
            </div>

            {/* Profile */}
            <Section title="Profile information" description="Your display name shown across Provance.">
               <Card>
                  <CardRow label="Name" sublabel="Shown on your dashboard">
                     <FormInput label="" value={name} onChange={setName} placeholder="Your name" />
                  </CardRow>
                  <CardRow label="Email" sublabel="Used for sign-in and notifications">
                     <FormInput label="" value={user?.email ?? ""} onChange={() => {}} type="email" disabled />
                  </CardRow>
                  <div className="flex justify-end items-center px-5 py-3 gap-3">
                     {profileError && <p className="text-[11px] text-red-400 mr-auto">{profileError}</p>}
                     <button
                        onClick={handleSave}
                        disabled={saving || !name.trim() || name.trim() === user?.name}
                        className="flex items-center gap-2 bg-sand hover:bg-sand-light disabled:opacity-40 disabled:cursor-not-allowed text-ink text-[12px] font-medium px-4 py-1.5 rounded-md transition-colors cursor-pointer"
                     >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : null}
                        {saved ? "Saved" : "Save"}
                     </button>
                  </div>
               </Card>
            </Section>

            {/* Sign-in method */}
            <Section title="Sign-in method" description="How you authenticate into your Provance account.">
               <Card>
                  <div className="flex items-center gap-4 px-5 py-4">
                     {providerIcon}
                     <div>
                        <p className="text-[13px] text-sand">{user?.provider === "google" ? "Google" : "Email"}</p>
                        <p className="text-[11px] text-sand/50 mt-0.5">{user?.email}</p>
                     </div>
                  </div>
               </Card>
            </Section>

            {/* Wallets */}
            <Section title="Connected wallets" description="Wallets linked to your account for on-chain payments and agent interactions.">
               <Card>
                  {wallets.length === 0 ? (
                     <div className="flex items-center gap-4 px-5 py-5">
                        <Wallet size={18} strokeWidth={1.5} className="text-sand/30 shrink-0" />
                        <div>
                           <p className="text-[13px] text-sand/50">No wallets connected yet</p>
                           <p className="text-[11px] text-sand/30 mt-0.5">Connect a wallet to enable on-chain agent actions.</p>
                        </div>
                     </div>
                  ) : (
                     wallets.map((w) => (
                        <div key={w.id} className="flex items-center gap-4 px-5 py-4">
                           <Wallet size={16} strokeWidth={1.5} className="text-sand/50 shrink-0" />
                           <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-sand font-mono truncate">{w.address}</p>
                              <p className="text-[11px] text-sand/40 mt-0.5 uppercase">{w.chain}</p>
                           </div>
                           <button
                              onClick={() => handleDisconnect(w.id)}
                              className="text-sand/30 hover:text-red-400 transition-colors cursor-pointer"
                              title="Disconnect wallet"
                           >
                              <Unlink size={14} strokeWidth={1.5} />
                           </button>
                        </div>
                     ))
                  )}
                  <div className="flex items-center justify-between px-5 py-3">
                     {walletError && <p className="text-[11px] text-red-400 mr-auto">{walletError}</p>}
                     <button
                        onClick={() => { setWalletError(null); setPickerOpen(true); }}
                        className="ml-auto flex items-center gap-2 border border-sand-faint text-sand text-[12px] font-medium px-3 py-1.5 rounded-md hover:bg-sand-faint transition-colors cursor-pointer"
                     >
                        <Plus size={12} strokeWidth={2} />
                        Add wallet
                     </button>
                  </div>
               </Card>
            </Section>

            <WalletPickerModal
               open={pickerOpen}
               onOpenChange={setPickerOpen}
               onConnected={handleWalletConnected}
               onError={(msg) => setWalletError(msg)}
            />

         </div>
      </div>
   );
}
