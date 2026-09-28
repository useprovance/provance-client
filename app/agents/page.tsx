"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";
import Header from "@/components/landing-page/Header";
import Footer from "@/components/landing-page/Footer";

type Agent = {
   id: string;
   name: string;
   description: string;
   icon: string | null;
   category: string | null;
   version: string | null;
   node_type: string;
   features: string[] | null;
};

function AgentCard({ agent }: { agent: Agent }) {
   return (
      <div className="relative flex flex-col bg-[#141414] border border-[#222] hover:border-[#2e2e2e] transition-colors overflow-hidden">
         {/* Dot header */}
         <div className="relative h-16 shrink-0">
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(204,189,159,0.06)" }} />
            <div
               className="absolute inset-0"
               style={{
                  WebkitMaskImage: "url('/icons/dots.svg')",
                  WebkitMaskSize: "7px 7px",
                  maskImage: "url('/icons/dots.svg')",
                  maskSize: "7px 7px",
                  backgroundColor: "rgba(204,189,159,0.12)",
               }}
            />
         </div>

         {/* Icon — overlaps dot header bottom edge */}
         <div className="absolute top-[40px] left-5 w-12 h-12 bg-[#1a1a1a] border border-[#333] z-10 rounded-full overflow-hidden">
            {agent.icon ? (
               <Image src={agent.icon} alt={agent.name} fill className="object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center">
                  <Zap size={18} strokeWidth={1.5} className="text-sand/30" />
               </div>
            )}
         </div>

         <div className="flex flex-col gap-4 p-5 pt-10 flex-1">
            {/* Author + name */}
            <div>
               <p className="text-[12px] text-sand/40 mb-0.5">Provance</p>
               <p className="text-[20px] font-semibold text-sand leading-tight font-geist">
                  {agent.name}
               </p>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
               {agent.category && (
                  <span className="text-[12px] font-medium text-sand/50 px-2.5 py-1 bg-white/5">
                     {agent.category}
                  </span>
               )}
               {agent.version && (
                  <span className="text-[12px] font-medium text-sand/50 px-2.5 py-1 bg-white/5">
                     v{agent.version}
                  </span>
               )}
            </div>

            {/* Description */}
            <p className="text-[12px] text-sand/45 leading-relaxed line-clamp-2">
               {agent.description}
            </p>

            <div className="flex-1" />

            {/* Footer */}
            <div className="flex items-center justify-between pt-5 border-t border-white/5">
               <div />
               <Link
                  href={`/agents/${agent.id}`}
                  className="flex items-center gap-1.5 bg-sand hover:bg-sand-light text-ink-dark text-[13px] font-semibold px-6 py-2 transition-colors"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
               >
                  View
                  <ArrowUpRight size={14} strokeWidth={2} />
               </Link>
            </div>
         </div>
      </div>
   );
}

export default function AgentsPage() {
   const [agents, setAgents] = useState<Agent[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");

   useEffect(() => {
      void fetch("/api/agents/public")
         .then((r) => r.json())
         .then((data: { agents?: Agent[] }) => setAgents(data.agents ?? []))
         .finally(() => setLoading(false));
   }, []);

   const filtered = agents.filter((a) => {
      const q = search.toLowerCase();
      return (
         a.name.toLowerCase().includes(q) ||
         (a.description ?? "").toLowerCase().includes(q) ||
         (a.category ?? "").toLowerCase().includes(q)
      );
   });

   return (
      <main className="bg-ink min-h-screen flex flex-col">
         <Header />

         <div className="max-w-7xl mx-auto w-full px-6 py-16 flex flex-col gap-10 flex-1">

            {/* Heading */}
            <div className="flex items-end justify-between gap-4">
               <div className="flex flex-col gap-3">
                  <h1 className="font-geist text-4xl sm:text-5xl font-normal text-sand leading-tight">
                     Provance Agents
                  </h1>
                  <p className="text-sand/45 text-[14px] max-w-lg leading-relaxed">
                     Browse and install agents built by the Provance community. Each agent is a live service you can wire into your workflows.
                  </p>
               </div>
               <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search agents..."
                  className="bg-transparent border border-sand/12 text-sand text-[12px] placeholder:text-sand/25 px-4 py-2 outline-none focus:border-sand/25 transition-colors w-52 shrink-0 mb-1"
               />
            </div>

            {/* Grid */}
            {loading ? (
               <div className="flex items-center justify-center py-32">
                  <div className="w-5 h-5 border-2 border-sand/20 border-t-sand/60 rounded-full animate-spin" />
               </div>
            ) : filtered.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-32 gap-3">
                  <p className="text-[13px] text-sand/30">
                     {search ? "No agents match your search" : "No agents yet"}
                  </p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {filtered.map((a) => (
                     <AgentCard key={a.id} agent={a} />
                  ))}
               </div>
            )}
         </div>

         <Footer />
      </main>
   );
}
