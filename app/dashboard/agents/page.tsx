"use client";

import { useState } from "react";
import { Plus, Bot, Activity, Zap, TrendingUp } from "lucide-react";
import { AgentCard, type Agent } from "@/components/dashboard/AgentCard";
import { SubmitAgentModal } from "@/components/dashboard/SubmitAgentModal";

const MOCK_AGENTS: Agent[] = [
   {
      id: "1",
      name: "DeFi Protocol Trigger",
      icon: "/icons/agents/trigger.svg",
      status: "active",
      lastRun: "2 min ago",
      runsToday: 142,
      earned: "0.84 USDC",
      workflow: "DeFi Risk Monitor",
      author: "Provance",
   },
   {
      id: "2",
      name: "DefiLlama Agent",
      icon: "/icons/agents/defillama.svg",
      status: "active",
      lastRun: "2 min ago",
      runsToday: 142,
      earned: "1.20 USDC",
      workflow: "DeFi Risk Monitor",
      author: "Provance",
   },
   {
      id: "3",
      name: "GoPlus Agent",
      icon: "/icons/agents/goplus.png",
      status: "active",
      lastRun: "2 min ago",
      runsToday: 98,
      earned: "0.63 USDC",
      workflow: "DeFi Risk Monitor",
      author: "Provance",
   },
   {
      id: "4",
      name: "OpenAI Agent",
      icon: "/icons/agents/openai.svg",
      status: "paused",
      lastRun: "1 hr ago",
      runsToday: 0,
      earned: "2.10 USDC",
      workflow: "DeFi Risk Monitor",
      author: "Provance",
   },
   {
      id: "5",
      name: "Telegram Agent",
      icon: "/icons/agents/telegram.svg",
      status: "idle",
      lastRun: "3 hr ago",
      runsToday: 3,
      earned: "0.12 USDC",
      workflow: "DeFi Risk Monitor",
      author: "Provance",
   },
   {
      id: "6",
      name: "Wallet Tracker",
      icon: "/icons/agents/wallet-tracker.svg",
      status: "idle",
      lastRun: "Yesterday",
      runsToday: 0,
      earned: "0.00 USDC",
      workflow: "Whale Watch",
      author: "ChainWatch",
   },
];

export default function AgentsPage() {
   const [submitOpen, setSubmitOpen] = useState(false);
   const active = MOCK_AGENTS.filter((a) => a.status === "active").length;
   const totalRuns = MOCK_AGENTS.reduce((s, a) => s + a.runsToday, 0);

   return (
      <>
      <div className="flex flex-col h-full bg-[#111] overflow-y-auto">
         <div className="max-w-5xl w-full mx-auto px-8 py-10 flex flex-col gap-8">
            <div className="flex flex-col gap-3">
               {/* Badge strip */}
               <div className="flex items-center justify-between w-full border-t border-b border-sand/25 py-3">
                  <div className="flex items-center gap-2 pr-6 shrink-0">
                     <div className="w-2.5 h-2.5 rounded-full bg-orange shrink-0" />
                     <p className="text-sand text-xs font-mono uppercase tracking-widest">
                        My Agents
                     </p>
                  </div>
                  <div
                     className="flex-1 h-full min-h-[16px]"
                     style={{
                        backgroundImage:
                           "repeating-linear-gradient(-45deg, var(--sand) 0, var(--sand) 1px, transparent 0, transparent 50%)",
                        backgroundSize: "6px 6px",
                        opacity: 0.15,
                     }}
                  />
                  <button
                     onClick={() => setSubmitOpen(true)}
                     className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 ml-6 shrink-0 transition-colors cursor-pointer"
                     style={{
                        clipPath:
                           "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                     }}
                  >
                     <Plus size={13} strokeWidth={2.5} />
                     New Agent
                  </button>
               </div>
            </div>

            {/* Stats */}
            <div className="relative p-1.5 border border-sand/10">
               <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                     backgroundImage:
                        "repeating-linear-gradient(-45deg, var(--sand) 0, var(--sand) 1px, transparent 0, transparent 50%)",
                     backgroundSize: "6px 6px",
                     opacity: 0.25,
                  }}
               />
               <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-1.5">
                  {[
                     {
                        label: "Total Agents",
                        display: String(MOCK_AGENTS.length).padStart(2, "0"),
                        icon: Bot,
                     },
                     {
                        label: "Active Now",
                        display: String(active).padStart(2, "0"),
                        icon: Activity,
                     },
                     {
                        label: "Runs Today",
                        display: String(totalRuns),
                        icon: Zap,
                     },
                     {
                        label: "Earned Today",
                        display: "4.89 USDC",
                        icon: TrendingUp,
                     },
                  ].map(({ label, display, icon: Icon }) => (
                     <div
                        key={label}
                        className="flex flex-col justify-between bg-[#0f0f0f] border border-sand/20 p-5"
                     >
                        <div className="flex items-center justify-between mb-3">
                           <p className="text-[11px] font-mono uppercase tracking-widest text-sand/40">
                              {label}
                           </p>
                           <Icon size={15} strokeWidth={1.5} className="text-sand/70 shrink-0" />
                        </div>
                        <p className="text-[28px] font-bold text-sand leading-none font-mono">
                           {display}
                        </p>
                     </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {MOCK_AGENTS.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
               ))}
            </div>
         </div>
      </div>

      <SubmitAgentModal open={submitOpen} onOpenChange={setSubmitOpen} />
      </>
   );
}
