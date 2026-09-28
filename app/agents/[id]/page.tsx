"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { ExternalLink, Globe, Lock, ShieldCheck, Zap } from "lucide-react";
import Header from "@/components/landing-page/Header";
import Footer from "@/components/landing-page/Footer";

type DbAgent = {
   id: string;
   name: string;
   description: string;
   icon: string | null;
   url: string;
   repository: string | null;
   protocol: string;
   authentication: string;
   category: string | null;
   version: string | null;
   identifier: string | null;
   node_type: string;
   actions: { key: string; label: string; description?: string }[] | null;
   outputs: { key: string; label: string }[] | null;
   features: string[] | null;
   created_at: string;
};

function Badge({ children }: { children: React.ReactNode }) {
   return (
      <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 border border-sand/15 text-sand/50 rounded-sm">
         {children}
      </span>
   );
}

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
   const { id } = use(params);
   const [agent, setAgent] = useState<DbAgent | null>(null);
   const [loading, setLoading] = useState(true);
   const [notFound, setNotFound] = useState(false);

   useEffect(() => {
      void fetch(`/api/agents/${id}`)
         .then((r) => r.ok ? r.json() : Promise.reject())
         .then((data: { agent: DbAgent }) => setAgent(data.agent))
         .catch(() => setNotFound(true))
         .finally(() => setLoading(false));
   }, [id]);

   return (
      <main className="bg-ink min-h-screen flex flex-col">
         <Header />

         {loading ? (
            <div className="flex-1 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-sand/20 border-t-sand/60 rounded-full animate-spin" />
            </div>
         ) : notFound || !agent ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
               <p className="text-[15px] text-sand/40">Agent not found</p>
            </div>
         ) : (
            <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 flex flex-col gap-12">

               {/* Hero */}
               <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-xl bg-white/5 border border-sand/10 flex items-center justify-center shrink-0 overflow-hidden">
                     {agent.icon ? (
                        <Image src={agent.icon} alt={agent.name} width={56} height={56} className="object-contain" />
                     ) : (
                        <Zap size={28} strokeWidth={1.5} className="text-sand/30" />
                     )}
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                     <h1 className="text-[28px] font-bold text-sand leading-tight">{agent.name}</h1>
                     <div className="flex flex-wrap gap-2">
                        {agent.category && <Badge>{agent.category}</Badge>}
                        {agent.version && <Badge>v{agent.version}</Badge>}
                        <Badge>{agent.protocol}</Badge>
                     </div>
                  </div>
               </div>

               {/* Description */}
               <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-sand/30">About</p>
                  <p className="text-[15px] text-sand/70 leading-relaxed">{agent.description}</p>
               </div>

               {/* Details */}
               <div className="grid grid-cols-2 gap-px bg-sand/8 border border-sand/8">
                  {[
                     { icon: Globe, label: "Endpoint", value: agent.url },
                     { icon: ShieldCheck, label: "Auth", value: agent.authentication },
                     { icon: Lock, label: "Protocol", value: agent.protocol },
                     { icon: Zap, label: "Type", value: agent.node_type },
                  ].map(({ icon: Icon, label, value }) => (
                     <div key={label} className="bg-ink px-5 py-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sand/30">
                           <Icon size={13} strokeWidth={1.5} />
                           <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
                        </div>
                        <p className="text-[13px] text-sand/70 font-mono truncate">{value}</p>
                     </div>
                  ))}
               </div>

               {/* Actions */}
               {agent.actions && agent.actions.length > 0 && (
                  <div className="flex flex-col gap-4">
                     <p className="text-[11px] font-mono uppercase tracking-widest text-sand/30">Actions</p>
                     <div className="flex flex-col gap-2">
                        {agent.actions.map((a) => (
                           <div key={a.key} className="flex flex-col gap-1 px-5 py-4 border border-sand/8 bg-[#111]">
                              <p className="text-[13px] font-semibold text-sand">{a.label}</p>
                              {a.description && <p className="text-[12px] text-sand/50 leading-relaxed">{a.description}</p>}
                              <span className="text-[10px] font-mono text-sand/25 mt-1">{a.key}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Outputs */}
               {agent.outputs && agent.outputs.length > 0 && (
                  <div className="flex flex-col gap-4">
                     <p className="text-[11px] font-mono uppercase tracking-widest text-sand/30">Outputs</p>
                     <div className="flex flex-wrap gap-2">
                        {agent.outputs.map((o) => (
                           <div key={o.key} className="px-3 py-1.5 border border-sand/8 bg-[#111]">
                              <span className="text-[11px] font-mono text-sand/60">{o.key}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Features */}
               {agent.features && agent.features.length > 0 && (
                  <div className="flex flex-col gap-4">
                     <p className="text-[11px] font-mono uppercase tracking-widest text-sand/30">Features</p>
                     <ul className="flex flex-col gap-2">
                        {agent.features.map((f) => (
                           <li key={f} className="flex items-start gap-3">
                              <span className="mt-[7px] w-1 h-1 rounded-full bg-orange shrink-0" />
                              <span className="text-[13px] text-sand/70">{f}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               )}

               {/* Links */}
               <div className="flex gap-3 pt-2">
                  <a
                     href={agent.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 bg-sand text-ink-dark text-[12px] font-bold px-5 py-2.5 hover:bg-sand/90 transition-colors"
                     style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                  >
                     View Endpoint
                     <ExternalLink size={12} strokeWidth={2.5} />
                  </a>
                  {agent.repository && (
                     <a
                        href={agent.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 border border-sand/15 text-sand/60 hover:text-sand hover:border-sand/30 text-[12px] font-medium px-5 py-2.5 transition-colors"
                     >
                        Repository
                        <ExternalLink size={12} strokeWidth={2} />
                     </a>
                  )}
               </div>

            </div>
         )}

         <Footer />
      </main>
   );
}
