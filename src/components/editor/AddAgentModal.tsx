import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { ServiceSourceFilter } from '@/components/agents/ServiceSourceFilter';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Check, ChevronLeft, ChevronRight, ExternalLink, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { agentService, type Agent } from "@/services/agent.service";
import { extractActions, getChainName, truncateAddress } from "@/utils/agent.utils";
import { useEditorStore } from "@/stores/editor.store";
import { Link } from 'react-router';
import { useMasterkeyAvailability } from '@/services/masterkey.service';
import { freeMasterkeyActionKeys, masterkeyOperationStatus, masterkeyServiceStatus } from '@/utils/masterkey-availability';

export function AddAgentModal() {
   const { isModalOpen, closeModal, addAgentNode } = useEditorStore();
   const [search, setSearch] = useState("");
   const [selected, setSelected] = useState<Agent | null>(null);
   const [source,setSource]=useState('all');
   const [freeOnly,setFreeOnly]=useState(false);
   const [visible,setVisible]=useState(60);
   const availability = useMasterkeyAvailability(isModalOpen);

   const { data: agents = [], isLoading } = useQuery({
      queryKey: ["agents", "explore"],
      queryFn: () => agentService.exploreAll(),
      enabled: isModalOpen,
   });

   const filtered = agents.filter((a) =>
      (source==='all'||(source==='masterkey')===a.id.startsWith('masterkey:')) &&
      (!freeOnly || freeMasterkeyActionKeys(a.id, availability.data).length > 0) &&
      (!search || [a.name,a.description,...a.tags].join(' ').toLowerCase().includes(search.toLowerCase()))
   );

   const freeActionKeys = selected ? freeMasterkeyActionKeys(selected.id, availability.data) : [];
   const actions = selected ? extractActions(selected.services).filter(action => !freeOnly || freeActionKeys.includes(action.key)) : [];
   const selectedStatus = selected ? freeOnly ? masterkeyOperationStatus(selected.id, actions[0]?.key ?? '', availability.data) : masterkeyServiceStatus(selected.id, availability.data) : null;
   const resultsLoading = isLoading || (freeOnly && availability.isPending);
   const freeUnavailable = freeOnly && !availability.isPending && !availability.data?.ready;
   const chainName = selected ? getChainName(selected.chain_id) : "";
   const webEndpoint = selected?.services.web?.endpoint;

   const handleSelectAction = (action: typeof actions[number]) => {
      if (!selected) return;
      if (freeOnly && !freeActionKeys.includes(action.key)) return;
      if (!masterkeyOperationStatus(selected.id, action.key, availability.data).executable) return;
      addAgentNode(
         { agentId: selected.id, label: selected.name, image_url: selected.image_url },
         { key: action.key, label: action.name, endpoint: action.endpoint, x402: !!action.x402, execution:action.execution }
      );
      setSelected(null);
      setSearch("");
   };

   return (
      <Dialog open={isModalOpen} onOpenChange={(o) => { if (!o) { closeModal(); setSelected(null); setSearch(""); } }}>
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
                           placeholder="Search agents, services or categories..."
                           value={search}
                           onChange={(e) => {setSearch(e.target.value);setVisible(60);}}
                           className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 outline-none"
                        />
                     </div>
                     <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/65">
                        <ServiceSourceFilter value={source} onChange={value => { setSource(value); setVisible(60); }} disabled={isLoading} />
                        <button
                           type="button"
                           aria-pressed={freeOnly}
                           onClick={() => { setFreeOnly(value => !value); setVisible(60); }}
                           className={`inline-flex h-8 items-center gap-2 rounded-sm border px-3 text-[12px] outline-none transition-colors focus-visible:border-orange focus-visible:ring-1 focus-visible:ring-orange ${freeOnly ? 'border-orange/60 bg-orange/10 text-sand' : 'border-white/15 bg-[#1c1c1c] text-white/85 hover:border-white/30 hover:bg-white/8'}`}
                        >
                           <Check aria-hidden="true" size={13} className={freeOnly ? 'opacity-100' : 'opacity-0'} />
                           Free to use
                        </button>
                     </div>
                     <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/65">
                        <span role="status" aria-live="polite" className="whitespace-nowrap tabular-nums">{resultsLoading ? 'Checking services…' : `${filtered.length.toLocaleString()} ${freeOnly ? 'free services' : 'results'}`}</span>
                        <Link onClick={closeModal} to="/app/settings" className="ml-auto whitespace-nowrap text-sand underline underline-offset-2">Services &amp; budgets</Link>
                     </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                     {resultsLoading ? (
                        <div className="p-2 flex flex-col gap-0.5">
                           {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                                 <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse shrink-0" />
                                 <div className="flex flex-col gap-1.5 flex-1">
                                    <div className="h-3 w-28 rounded bg-white/8 animate-pulse" />
                                    <div className="h-2.5 w-44 rounded bg-white/5 animate-pulse" />
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 gap-2 text-center">
                           <p className="text-[13px] text-white/85">{freeUnavailable ? 'Free service availability could not be verified' : freeOnly ? 'No free services found' : 'No agents found'}</p>
                           <p className="text-[12px] leading-relaxed text-white/65">{freeUnavailable ? 'Refresh availability to check which services can run.' : 'Try another search or source, or clear your filters.'}</p>
                           {freeUnavailable ? <button type="button" disabled={availability.isFetching} onClick={() => void availability.refetch()} className="mt-2 rounded-sm px-3 py-2 text-[12px] text-sand underline underline-offset-2 outline-none focus-visible:ring-1 focus-visible:ring-orange disabled:opacity-50">{availability.isFetching ? 'Refreshing…' : 'Refresh availability'}</button> : <button type="button" onClick={() => { setSearch(''); setSource('all'); setFreeOnly(false); setVisible(60); }} className="mt-2 rounded-sm px-3 py-2 text-[12px] text-sand underline underline-offset-2 outline-none focus-visible:ring-1 focus-visible:ring-orange">Clear filters</button>}
                        </div>
                     ) : (
                        <div className="p-2 flex flex-col gap-0.5">
                           {filtered.slice(0,visible).map((agent) => (
                              <button
                                 key={agent.id}
                                 onClick={() => setSelected(agent)}
                                 className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer text-left rounded-sm"
                              >
                                 <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                                    <AgentAvatar name={agent.name} src={agent.image_url} className="w-full h-full rounded-full" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-white leading-tight truncate">{agent.name}{agent.id.startsWith('masterkey:')&&<span className="ml-2 text-[10px] text-white/65">{freeOnly ? 'Free' : masterkeyServiceStatus(agent.id, availability.data).label}</span>}</p>
                                    {agent.description && (
                                       <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">{agent.description}</p>
                                    )}
                                 </div>
                              </button>
                           ))}
                           {filtered.length>visible&&<button onClick={()=>setVisible(v=>v+60)} className="text-sm text-sand p-3">Show more services</button>}
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
                              <AgentAvatar name={selected.name} src={selected.image_url} className="w-full h-full rounded-full" />
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
                                 <span className={`w-2 h-2 rounded-full shrink-0 ${(selected.id.startsWith('masterkey:') ? selectedStatus?.executable : selected.is_active) ? "bg-emerald-400" : "bg-sand/30"}`} />
                                 {selected.id.startsWith('masterkey:') ? selectedStatus?.label : selected.is_active ? "Active" : "Inactive"}
                              </span>
                              {selected.supported_protocols.map((p) => (
                                 <span key={p} className="text-[10px] font-mono uppercase tracking-widest text-white/60 px-2.5 py-1 bg-white/5">
                                    {p}
                                 </span>
                              ))}
                           </div>
                        </div>

                        {selected.id.startsWith('masterkey:')&&<p role="status" className="text-xs text-amber-200/90">{selectedStatus?.reason} No separate Masterkey login is needed.</p>}
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
                              {actions.map((action) => {
                                 const status = masterkeyOperationStatus(selected.id, action.key, availability.data);
                                 return (
                                 <button
                                    key={action.key}
                                    disabled={!status.executable}
                                    onClick={() => handleSelectAction(action)}
                                    className="w-full flex items-start gap-3 px-3 py-3 bg-white/4 border border-white/6 enabled:hover:bg-white/7 enabled:hover:border-white/12 transition-colors cursor-pointer text-left group disabled:cursor-not-allowed"
                                 >
                                    <span className={`mt-0.5 text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 shrink-0 ${action.method === "GET" ? "bg-sky-500/10 text-sky-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                       {action.method}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-[13px] font-medium text-white leading-tight">{action.name}</p>
                                       {selected.id.startsWith('masterkey:') && <p className="text-[11px] leading-relaxed text-amber-200/85 mt-1">{status.label} · {status.reason}</p>}
                                       {action.description && (
                                          <p className="text-[11px] text-white/55 mt-0.5 line-clamp-2 leading-relaxed">{action.description}</p>
                                       )}
                                       {action.payment && (
                                          <div className="flex items-center gap-1.5 mt-1.5">
                                             <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-1 bg-white/6 text-white/55 ring-1 ring-white/10 ring-offset-1 ring-offset-[#141414]">x402</span>
                                             <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-1 bg-white/6 text-white/75 ring-1 ring-white/10 ring-offset-1 ring-offset-[#141414]">${action.payment.amount} {action.payment.token}</span>
                                          </div>
                                       )}
                                    </div>
                                    <ChevronRight size={13} strokeWidth={1.5} className="text-white/25 group-hover:text-white/60 shrink-0 transition-colors mt-0.5" />
                                 </button>
                              );})}
                           </div>
                        )}
                        {freeOnly && actions.length === 0 && <p role="status" className="text-[12px] leading-relaxed text-white/65">This service has no free actions available right now. Go back to choose another service.</p>}

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
