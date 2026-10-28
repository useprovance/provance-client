import { useState, useEffect } from "react";
import { Search, X, Zap, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { agentService, type Agent, type ProvanceAction } from "@/services/agent.service";
import { useEditorStore } from "@/stores/editorStore";

const RESERVED = new Set(["web", "mcp", "a2a", "oasf"]);

function extractActions(services: Agent["services"]): ProvanceAction[] {
   const webActions = (services.web as { actions?: ProvanceAction[] } | undefined)?.actions;
   if (Array.isArray(webActions)) return webActions;
   return Object.entries(services)
      .filter(([key, val]) =>
         !RESERVED.has(key) &&
         typeof val === "object" && val !== null &&
         "endpoint" in val && "config" in val
      )
      .map(([key, val]) => ({ key, ...(val as object) })) as ProvanceAction[];
}

export function AddAgentModal() {
   const { isModalOpen, closeModal, addAgentNode } = useEditorStore();
   const [agents, setAgents] = useState<Agent[]>([]);
   const [search, setSearch] = useState("");
   const [selected, setSelected] = useState<Agent | null>(null);

   useEffect(() => {
      if (!isModalOpen) return;
      setSearch("");
      setSelected(null);
      void agentService.getAll().then(setAgents);
   }, [isModalOpen]);

   const filtered = agents.filter((a) =>
      !search || a.name.toLowerCase().includes(search.toLowerCase())
   );

   const actions = selected ? extractActions(selected.services) : [];

   return (
      <Dialog open={isModalOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[460px] max-h-[75vh] [&>button]:hidden overflow-hidden"
         >
            <DialogTitle className="sr-only">Add Agent</DialogTitle>

            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
               {selected ? (
                  <button
                     onClick={() => setSelected(null)}
                     className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                     <ChevronLeft size={14} strokeWidth={2} />
                     Back
                  </button>
               ) : (
                  <p className="text-[14px] font-semibold text-white font-manrope">Add agent</p>
               )}
               <button
                  onClick={closeModal}
                  className="w-7 h-7 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
               >
                  <X size={13} strokeWidth={2} />
               </button>
            </div>

            {!selected && (
               <div className="px-4 py-2.5 border-b border-white/8 shrink-0">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/8 px-3 py-2">
                     <Search size={13} strokeWidth={1.5} className="text-white/30 shrink-0" />
                     <input
                        autoFocus
                        type="text"
                        placeholder="Search agents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/25 outline-none"
                     />
                  </div>
               </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
               {!selected ? (
                  filtered.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-16 gap-2">
                        <p className="text-[13px] text-white/25">No agents found</p>
                        <p className="text-[11px] text-white/15">Add agents from the Agents page first</p>
                     </div>
                  ) : (
                     <div className="p-2 flex flex-col gap-0.5">
                        {filtered.map((agent) => (
                           <button
                              key={agent.id}
                              onClick={() => setSelected(agent)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer text-left rounded-sm"
                           >
                              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                                 {agent.image_url ? (
                                    <img src={agent.image_url} alt={agent.name} className="w-full h-full object-contain p-1" />
                                 ) : (
                                    <span className="text-white/20 text-sm">◈</span>
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[13px] font-medium text-white leading-tight truncate">{agent.name}</p>
                                 {agent.description && (
                                    <p className="text-[11px] text-white/35 mt-0.5 line-clamp-1">{agent.description}</p>
                                 )}
                              </div>
                           </button>
                        ))}
                     </div>
                  )
               ) : (
                  <div className="p-3 flex flex-col gap-2">
                     <div className="flex items-center gap-2.5 px-1 pb-3 mb-1 border-b border-white/8">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                           {selected.image_url ? (
                              <img src={selected.image_url} alt={selected.name} className="w-full h-full object-contain p-1" />
                           ) : (
                              <span className="text-white/20 text-sm">◈</span>
                           )}
                        </div>
                        <p className="text-[13px] font-semibold text-white">{selected.name}</p>
                     </div>

                     {actions.length === 0 ? (
                        <p className="text-[12px] text-white/30 px-1 py-4 text-center">No actions available</p>
                     ) : (
                        actions.map((action) => (
                           <button
                              key={action.key}
                              onClick={() =>
                                 addAgentNode(
                                    { agentId: selected.id, label: selected.name, image_url: selected.image_url },
                                    { key: action.key, label: action.name, endpoint: action.endpoint }
                                 )
                              }
                              className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/3 hover:bg-white/7 border border-white/6 hover:border-white/12 transition-colors cursor-pointer text-left"
                           >
                              <div className="flex size-7 items-center justify-center bg-orange/10 shrink-0">
                                 <Zap size={12} strokeWidth={1.5} className="text-orange" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[13px] font-medium text-white leading-tight">{action.name}</p>
                                 {action.description && (
                                    <p className="text-[11px] text-white/35 mt-0.5 line-clamp-1">{action.description}</p>
                                 )}
                              </div>
                           </button>
                        ))
                     )}
                  </div>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
}
