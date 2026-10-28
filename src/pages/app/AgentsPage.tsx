import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, Activity, Zap, TrendingUp, Plus, Search } from "lucide-react";
import { AgentCard } from "@/components/agents/AgentCard";
import CreateAgentModal from "@/components/agents/CreateAgentModal";
import { agentService } from "@/services/agent.service";
import { queryClient } from "@/lib/queryClient";

export default function AgentsPage() {
   const [search, setSearch] = useState("");
   const [createOpen, setCreateOpen] = useState(false);

   const { data } = useQuery({
      queryKey: ["agents"],
      queryFn: () => agentService.getAll(),
   });

   const remove = useMutation({
      mutationFn: (id: string) => agentService.remove(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agents"] }),
   });

   const agents = (data ?? []).filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
   );

   const activeCount = agents.filter((a) => a.is_active).length;

   return (
      <div className="p-8 h-full overflow-y-auto">
         <CreateAgentModal
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={() => queryClient.invalidateQueries({ queryKey: ["agents"] })}
         />

         <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-orange/15 shrink-0">
               <Bot className="size-4 text-orange" />
            </div>
            <h1 className="text-2xl font-semibold text-white font-manrope">Agents</h1>
         </div>

         <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
               { label: "Total Agents", display: String(agents.length).padStart(2, "0"), sub: "in your workspace", icon: Bot },
               { label: "Active Now", display: String(activeCount).padStart(2, "0"), sub: "running right now", icon: Activity },
               { label: "Runs Today", display: "00", sub: "across all agents", icon: Zap },
               { label: "Earned Today", display: "0.00", sub: "USDC", icon: TrendingUp },
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

         <div className="mt-6">
            {data === undefined ? null : agents.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10">
                  <Bot size={40} strokeWidth={1} className="text-white/20 mb-4" />
                  <p className="text-[13px] text-white/30">No agents yet</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {agents.map((agent) => (
                     <AgentCard key={agent.id} agent={agent} onDelete={(id) => remove.mutate(id)} />
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
