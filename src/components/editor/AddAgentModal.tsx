import { useState, useEffect } from "react";
import { Search, X, ChevronLeft, ChevronRight, ExternalLink, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { agentService, type Agent } from "@/services/agent.service";
import { extractActions, getChainName, truncateAddress } from "@/utils/agent.utils";
import { useEditorStore } from "@/stores/editor.store";

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
   const chainName = selected ? getChainName(selected.chain_id) : "";
   const webEndpoint = selected?.services.web?.endpoint;

   return (
      <Dialog open={isModalOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[480px] max-h-[85vh] [&>button]:hidden overflow-hidden"
         >
            <DialogTitle className="sr-only">{selected ? selected.name : "Add Agent"}</DialogTitle>

            {!selected ? (
               /* ── Step 1: agent list ── */
               <>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
                     <p className="text-[14px] font-semibold text-white font-manrope">Add agent</p>
                     <button
                        onClick={closeModal}
                        className="w-7 h-7 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
                     >
                        <X size={13} strokeWidth={2} />
                     </button>
                  </div>

                  <div className="px-4 py-2.5 border-b border-white/8 shrink-0">
                     <div className="flex items-center gap-2 bg-white/5 border border-white/8 px-3 py-2">
                        <Search size={13} strokeWidth={1.5} className="text-white/50 shrink-0" />
                        <input
                           autoFocus
                           type="text"
                           placeholder="Search agents..."
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 outline-none"
                        />
                     </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                     {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                           <p className="text-[13px] text-white/50">No agents found</p>
                           <p className="text-[11px] text-white/40">Add agents from the Agents page first</p>
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
                                       <span className="text-white/40 text-sm">◈</span>
                                    )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-white leading-tight truncate">{agent.name}</p>
                                    {agent.description && (
                                       <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">{agent.description}</p>
                                    )}
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               </>
            ) : (
               /* ── Step 2: agent detail + action picker ── */
               <>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
                     <button
                        onClick={() => setSelected(null)}
                        className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors cursor-pointer"
                     >
                        <ChevronLeft size={14} strokeWidth={2} />
                        Back
                     </button>
                     <button
                        onClick={closeModal}
                        className="w-7 h-7 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
                     >
                        <X size={13} strokeWidth={2} />
                     </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
                     <div className="px-6 pt-5 pb-6 flex flex-col gap-5">

                        {/* Avatar + name */}
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-[#1e1e1e] border border-white/10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                              {selected.image_url ? (
                                 <img src={selected.image_url} alt={selected.name} className="w-full h-full object-contain p-1.5" />
                              ) : (
                                 <span className="text-white/40 text-xl">◈</span>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-white/50 font-mono uppercase tracking-widest mb-0.5">{chainName}</p>
                              <p className="text-[17px] font-semibold text-white leading-tight font-manrope truncate">{selected.name}</p>
                           </div>
                        </div>

                        {/* Description + pills */}
                        <div>
                           {selected.description && (
                              <p className="text-[13px] text-white/60 leading-relaxed">{selected.description}</p>
                           )}
                           <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <span className="flex items-center gap-1.5 text-[12px] font-medium text-white/70 px-2.5 py-1 bg-white/5">
                                 <span className={`w-2 h-2 rounded-full shrink-0 ${selected.is_active ? "bg-emerald-400" : "bg-sand/30"}`} />
                                 {selected.is_active ? "Active" : "Inactive"}
                              </span>
                              {selected.supported_protocols.map((p) => (
                                 <span key={p} className="text-[10px] font-mono uppercase tracking-widest text-white/60 px-2.5 py-1 bg-white/5">
                                    {p}
                                 </span>
                              ))}
                           </div>
                        </div>

                        {/* Owner + agent wallet */}
                        <div className="border-t border-white/8 pt-4 flex flex-col gap-3">
                           <div>
                              <p className="text-[11px] font-mono uppercase tracking-widest text-white/50 mb-1">Owner</p>
                              <p className="text-[12px] text-white/70 font-mono break-all">{selected.owner_address}</p>
                           </div>
                           {selected.agent_wallet && (
                              <div>
                                 <p className="text-[11px] font-mono uppercase tracking-widest text-white/50 mb-1">Agent wallet</p>
                                 <div className="flex items-center gap-1.5">
                                    <Wallet size={11} strokeWidth={1.5} className="text-white/40 shrink-0" />
                                    <p className="text-[12px] text-white/70 font-mono">{truncateAddress(selected.agent_wallet)}</p>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* Actions */}
                        {actions.length > 0 && (
                           <div className="flex flex-col gap-2">
                              <p className="text-[11px] font-mono uppercase tracking-widest text-white/50 mb-1">Actions</p>
                              {actions.map((action) => (
                                 <button
                                    key={action.key}
                                    onClick={() =>
                                       addAgentNode(
                                          { agentId: selected.id, label: selected.name, image_url: selected.image_url },
                                          { key: action.key, label: action.name, endpoint: action.endpoint }
                                       )
                                    }
                                    className="w-full flex items-start gap-3 px-3 py-3 bg-white/4 border border-white/6 hover:bg-white/7 hover:border-white/12 transition-colors cursor-pointer text-left group"
                                 >
                                    <span className={`mt-0.5 text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 shrink-0 ${action.method === "GET" ? "bg-sky-500/10 text-sky-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                       {action.method}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-[13px] font-medium text-white leading-tight">{action.name}</p>
                                       {action.description && (
                                          <p className="text-[11px] text-white/55 mt-0.5 line-clamp-2 leading-relaxed">{action.description}</p>
                                       )}
                                       {(action.x402 || action.price) && (
                                          <div className="flex items-center gap-2 mt-1.5">
                                             {action.x402 && (
                                                <span className="text-[9px] font-mono uppercase tracking-widest text-orange/80 bg-orange/10 px-1.5 py-0.5">x402</span>
                                             )}
                                             {action.price && (
                                                <span className="text-[10px] text-white/60 font-mono">${action.price.amount} / {action.price.unit}</span>
                                             )}
                                          </div>
                                       )}
                                    </div>
                                    <ChevronRight size={13} strokeWidth={1.5} className="text-white/25 group-hover:text-white/60 shrink-0 transition-colors mt-0.5" />
                                 </button>
                              ))}
                           </div>
                        )}

                        {webEndpoint && (
                           <a
                              href={webEndpoint}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-[12px] text-white/50 hover:text-white/80 transition-colors"
                           >
                              <ExternalLink size={12} strokeWidth={1.5} />
                              <span className="truncate">{webEndpoint}</span>
                           </a>
                        )}
                     </div>
                  </div>
               </>
            )}
         </DialogContent>
      </Dialog>
   );
}
