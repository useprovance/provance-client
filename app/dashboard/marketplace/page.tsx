"use client";

import { useState } from "react";
import { Search, Store, Layers, TrendingUp, Users } from "lucide-react";
import { FormInput } from "@/components/ui/form-input";
import { AgentCard, type Agent } from "@/components/dashboard/AgentCard";
import Footer from "@/components/landing-page/Footer";
import { agentService } from "@/services/agent.service";

const CATEGORIES = ["All", ...Array.from(new Set(agentService.getAll().map((a) => a.category)))];

interface MarketplaceAgent extends Agent {
   category: string;
   totalRuns: number;
}

const MARKETPLACE_AGENTS: MarketplaceAgent[] = agentService.getAll().map((a) => ({
   id: a.id,
   name: a.label,
   icon: a.icon,
   status: "active" as const,
   lastRun: "Never",
   runsToday: 0,
   earned: "Free",
   workflow: a.category,
   author: a.author,
   category: a.category,
   totalRuns: parseInt(a.downloads) || 0,
}));

export default function MarketplacePage() {
   const [search, setSearch] = useState("");
   const [category, setCategory] = useState("All");

   const filtered = MARKETPLACE_AGENTS.filter((a) => {
      const matchCat = category === "All" || a.category === category;
      const matchSearch =
         a.name.toLowerCase().includes(search.toLowerCase()) ||
         a.author.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
   });

   const totalRuns = MARKETPLACE_AGENTS.reduce((s, a) => s + a.totalRuns, 0);
   const authors = new Set(MARKETPLACE_AGENTS.map((a) => a.author)).size;

   return (
      <div className="flex flex-col h-full bg-[#181818] overflow-y-auto">
         <div className="max-w-7xl w-full mx-auto px-8 py-10 flex flex-col gap-8">
            {/* Badge strip */}
            <div className="flex items-center justify-between w-full py-3">
               <div className="flex items-center gap-2 pr-6 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange shrink-0" />
                  <p className="text-sand text-xs font-mono uppercase tracking-widest">
                     Marketplace
                  </p>
               </div>
               <div className="flex-1" />
            </div>

            {/* Stats */}
            <div className="hidden grid-cols-2 lg:grid-cols-4 gap-1.5">
               {[
                  {
                     label: "Total Agents",
                     display: String(MARKETPLACE_AGENTS.length).padStart(
                        2,
                        "0",
                     ),
                     icon: Store,
                  },
                  {
                     label: "Categories",
                     display: String(CATEGORIES.length - 1).padStart(2, "0"),
                     icon: Layers,
                  },
                  {
                     label: "All-time Runs",
                     display: (totalRuns / 1000).toFixed(0) + "K",
                     icon: TrendingUp,
                  },
                  {
                     label: "Contributors",
                     display: String(authors).padStart(2, "0"),
                     icon: Users,
                  },
               ].map(({ label, display, icon: Icon }) => (
                  <div
                     key={label}
                     className="relative flex flex-col justify-between bg-[#0f0f0f] border-t-3 border border-t-sand/30 p-5 pb-10 overflow-hidden"
                  >
                     <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-mono uppercase tracking-widest text-sand/40">
                           {label}
                        </p>
                        <Icon
                           size={15}
                           strokeWidth={1.5}
                           className="text-sand/70 shrink-0"
                        />
                     </div>
                     <p className="text-[28px] font-bold text-sand leading-none font-mono">
                        {display}
                     </p>
                     {/* Base stripe */}
                     <div
                        className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
                        style={{
                           backgroundImage:
                              "repeating-linear-gradient(-45deg, var(--sand) 0, var(--sand) 1px, transparent 0, transparent 50%)",
                           backgroundSize: "6px 6px",
                           opacity: 0.12,
                        }}
                     />
                  </div>
               ))}
            </div>

            {/* Search + filters */}
            <div className="flex flex-col gap-3">
               <FormInput
                  label=""
                  value={search}
                  onChange={setSearch}
                  placeholder="Search agents or contributors..."
                  prefix={
                     <span className="pl-3">
                        <Search
                           size={16}
                           strokeWidth={1.5}
                           className="text-sand/35"
                        />
                     </span>
                  }
                  className="[&_label]:hidden mb-3"
               />
               <div className="flex items-center gap-2 flex-wrap">
                  {CATEGORIES.map((cat) => (
                     <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer border ${
                           category === cat
                              ? "bg-orange text-white border-orange"
                              : "text-sand/50 border-sand/15 hover:border-sand/30 hover:text-sand/80 bg-transparent"
                        }`}
                     >
                        {cat}
                     </button>
                  ))}
               </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
               <div className="flex items-center justify-center h-48 border border-sand/10 text-sand/30 text-[13px]">
                  No agents found
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filtered.map((agent) => (
                     <AgentCard
                        key={agent.id}
                        agent={agent}
                        variant="marketplace"
                     />
                  ))}
               </div>
            )}
         </div>

         <Footer />
      </div>
   );
}
