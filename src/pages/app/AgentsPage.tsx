import { useState } from "react";
import { Bot, Activity, Zap, TrendingUp, Plus, Search } from "lucide-react";
import { AgentCard, type Agent } from "@/components/agents/AgentCard";
import CreateAgentModal from "@/components/agents/CreateAgentModal";

const DUMMY_AGENTS: Agent[] = [
   { id: "1", name: "GeckoTerminal", icon: "/icons/agents/geckoterminal.svg", status: "active", lastRun: "2 mins ago", runsToday: 48, earned: "0.24 USDC", workflow: "DeFi Scanner", author: "You" },
   { id: "2", name: "GoPlus Security", icon: "/icons/agents/goplus.svg", status: "active", lastRun: "2 mins ago", runsToday: 48, earned: "0.00 USDC", workflow: "DeFi Scanner", author: "You" },
   { id: "3", name: "Gruff Trader", icon: "/icons/agents/gruff.svg", status: "paused", lastRun: "1 hour ago", runsToday: 12, earned: "1.20 USDC", workflow: "DeFi Scanner", author: "You" },
   { id: "4", name: "Telegram Bot", icon: "/icons/agents/telegram.svg", status: "idle", lastRun: "Never", runsToday: 0, earned: "0.00 USDC", workflow: "Notifications", author: "You" },
];

export default function AgentsPage() {
   const [search, setSearch] = useState("");
   const [createOpen, setCreateOpen] = useState(false);

   const filtered = DUMMY_AGENTS.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
   );

   const active = DUMMY_AGENTS.filter((a) => a.status === "active").length;
   const totalRuns = DUMMY_AGENTS.reduce((s, a) => s + a.runsToday, 0);
   const totalEarned = DUMMY_AGENTS.reduce((s, a) => s + parseFloat(a.earned), 0).toFixed(2);

   return (
      <div className="p-8">
         <CreateAgentModal open={createOpen} onOpenChange={setCreateOpen} />
         <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-orange/15 shrink-0">
               <Bot className="size-4 text-orange" />
            </div>
            <h1 className="text-2xl font-semibold text-white font-manrope">Agents</h1>
         </div>

         {/* Stats */}
         <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
               { label: "Total Agents", display: String(DUMMY_AGENTS.length).padStart(2, "0"), sub: "in your workspace", icon: Bot },
               { label: "Active Now", display: String(active).padStart(2, "0"), sub: "running right now", icon: Activity },
               { label: "Runs Today", display: String(totalRuns), sub: "across all agents", icon: Zap },
               { label: "Earned Today", display: `${totalEarned}`, sub: "USDC", icon: TrendingUp },
            ].map(({ label, display, sub, icon: Icon }) => (
               <div key={label} className="flex flex-col gap-4 bg-[#1a1a1a] border border-white/8 p-5 rounded-lg">
                  <div className="flex items-start justify-between">
                     <p className="text-[12px] font-semibold text-white/80">{label}</p>
                     <div className="flex size-8 items-center justify-center rounded-full bg-white/8">
                        <Icon size={16} strokeWidth={1.5} className="text-white/70" />
                     </div>
                  </div>
                  <div>
                     <p className="text-[32px] font-bold text-white leading-none font-manrope">{display}</p>
                     <p className="text-[11px] text-white/30 mt-1.5">{sub}</p>
                  </div>
               </div>
            ))}
         </div>

         <div className="mt-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 w-full max-w-lg rounded-full border border-white/10 bg-white/5 px-4 py-2">
               <Search className="size-4 text-white/30 shrink-0" />
               <input
                  type="text"
                  placeholder="Search agents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
               />
            </div>

            <button
               onClick={() => setCreateOpen(true)}
               className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 shrink-0 transition-colors cursor-pointer"
               style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
               <Plus size={13} strokeWidth={2.5} />
               New Agent
            </button>
         </div>

         {/* Cards */}
         <div className="mt-6">
            {filtered.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10">
                  <Bot size={40} strokeWidth={1} className="text-white/20 mb-4" />
                  <p className="text-[13px] text-white/30">No agents yet</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filtered.map((agent) => (
                     <AgentCard key={agent.id} agent={agent} />
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
