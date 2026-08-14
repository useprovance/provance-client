"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import ProvanceLogo from "@/components/shared/ProvanceLogo";
import { FormInput } from "@/components/ui/form-input";
import { useAuthStore, type AuthUser } from "@/stores/useAuthStore";

type SessionData = {
   id: string;
   name: string;
   email: string | null;
   avatar_url: string | null;
   provider: string;
   onboarded: boolean;
};

export default function OnboardingPage() {
   const router = useRouter();
   const setUser = useAuthStore((s) => s.setUser);

   const [session, setSession] = useState<SessionData | null>(null);
   const [name, setName] = useState("");
   const [orgName, setOrgName] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      fetch("/api/auth/me")
         .then((r) => r.ok ? r.json() : null)
         .then((data: { user: SessionData } | null) => {
            if (!data?.user) { router.push("/"); return; }
            if (data.user.onboarded) { router.push("/dashboard"); return; }
            setSession(data.user);
            setName(data.user.name ?? "");
         })
         .catch(() => router.push("/"));
   }, [router]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !orgName.trim()) return;
      setLoading(true);
      setError(null);

      try {
         const res = await fetch("/api/auth/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), org_name: orgName.trim() }),
         });

         const data = await res.json() as { user?: AuthUser; error?: string };

         if (!res.ok || !data.user) {
            setError(data.error ?? "Something went wrong. Try again.");
            setLoading(false);
            return;
         }

         setUser(data.user);
         router.push("/dashboard");
      } catch {
         setError("Something went wrong. Try again.");
         setLoading(false);
      }
   };

   return (
      <div className="relative min-h-screen bg-ink flex items-center justify-center overflow-hidden">
         {/* Grid pattern */}
         <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
               backgroundImage: `
                  linear-gradient(to right, #f5e6c8 1px, transparent 1px),
                  linear-gradient(to bottom, #f5e6c8 1px, transparent 1px)
               `,
               backgroundSize: "48px 48px",
            }}
         />
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0e0e0e_80%)]" />

         <div className="relative z-10 w-full max-w-md px-4">
            <div className="flex justify-center mb-8">
               <ProvanceLogo className="h-10 w-auto text-sand" />
            </div>

            <div className="bg-ink-dark border border-sand-faint rounded-2xl overflow-hidden shadow-2xl">
               <div className="px-8 pt-8 pb-2 text-center">
                  <h1 className="font-geist font-bold text-2xl uppercase tracking-wide text-sand">
                     Set up your account
                  </h1>
                  <p className="mt-2 text-[11px] text-sand/50">
                     Confirm your name and create your first org to get started.
                  </p>
               </div>

               <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 flex flex-col gap-5">
                  <FormInput
                     label="Your name"
                     value={name}
                     onChange={setName}
                     placeholder="Your name"
                     required
                  />

                  <FormInput
                     label="Email"
                     value={session?.email ?? ""}
                     onChange={() => {}}
                     type="email"
                     disabled
                  />

                  <div className="flex items-center gap-3 py-1">
                     <div className="flex-1 h-px bg-sand-faint" />
                     <div className="flex items-center gap-1.5 text-sand/30">
                        <Building2 size={11} strokeWidth={1.5} />
                        <span className="text-[11px] font-mono uppercase tracking-widest">Your org</span>
                     </div>
                     <div className="flex-1 h-px bg-sand-faint" />
                  </div>

                  <FormInput
                     label="Org name"
                     value={orgName}
                     onChange={setOrgName}
                     placeholder="e.g. Acme Labs"
                     required
                  />

                  {error && (
                     <p className="text-[12px] text-red-400">{error}</p>
                  )}

                  <button
                     type="submit"
                     disabled={loading || !name.trim() || !orgName.trim()}
                     className="mt-1 w-full flex items-center justify-center gap-2 bg-orange hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg px-5 py-3.5 transition-colors cursor-pointer"
                  >
                     {loading ? (
                        <>
                           <Loader2 size={15} className="animate-spin" />
                           Setting up...
                        </>
                     ) : "Continue to dashboard"}
                  </button>
               </form>

               <div className="border-t border-sand-faint bg-ink-heavy px-6 py-3 text-center">
                  <p className="text-[11px] text-sand/40">
                     By continuing you agree to our terms of service and privacy policy.
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
}
