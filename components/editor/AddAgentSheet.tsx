"use client";

import { useState, useMemo, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { Search, ChevronRight, ChevronLeft, X, Zap, Plus, GitBranch } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEditor } from "./EditorContext";
import { EDGE_STYLE } from "./editor.constants";
import { AGENTS, TRIGGERS, type Agent } from "@/services/agent.service";

export function AddAgentSheet({ workflowId }: { workflowId: string }) {
   const { isSheetOpen, closeSheet, sourceNodeId, sourceHandleId } = useEditor();
   const { addNodes, addEdges, getNode } = useReactFlow();
   const [search, setSearch] = useState("");
   const [selected, setSelected] = useState<Agent | "trigger" | "flow" | null>(null);

   const filteredAgents = useMemo(() => {
      const q = search.toLowerCase();
      return AGENTS.filter(
         (a) =>
            a.nodeType === "agent" &&
            (a.label.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.author.toLowerCase().includes(q)),
      );
   }, [search]);

   const filteredTriggers = useMemo(() => {
      const q = search.toLowerCase();
      return TRIGGERS.filter(
         (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
   }, [search]);

   const showTriggerCard = !search || "trigger".includes(search.toLowerCase());
   const showFlowCard = !search || "flow if condition branch".includes(search.toLowerCase());

   useEffect(() => {
      if (isSheetOpen) { setSearch(""); setSelected(null); }
   }, [isSheetOpen]);

   const handleClose = () => { closeSheet(); };

   const handleAddAgent = (agent: Agent, actionKey: string, actionLabel: string) => {
      const newId = `${Date.now()}`;
      const source = sourceNodeId ? getNode(sourceNodeId) : null;
      const position = source
         ? { x: source.position.x + 280, y: source.position.y }
         : { x: 0, y: 0 };
      addNodes([{
         id: newId, type: "agent" as const, position,
         data: { label: agent.label, icon: agent.icon, agentId: agent.id, action: { key: actionKey, label: actionLabel } },
      }]);
      if (sourceNodeId) {
         addEdges([{ id: `e${sourceNodeId}-${newId}`, source: sourceNodeId, target: newId, type: "provance", style: EDGE_STYLE, ...(sourceHandleId ? { sourceHandle: sourceHandleId } : {}) }]);
      }
      handleClose();
   };

   const handleAddCondition = () => {
      const newId = `flow-${Date.now()}`;
      const source = sourceNodeId ? getNode(sourceNodeId) : null;
      const position = source
         ? { x: source.position.x + 280, y: source.position.y }
         : { x: 0, y: 0 };
      addNodes([{
         id: newId, type: "flow" as const, position,
         data: { label: "IF", icon: "/icons/agents/condition.svg", agentId: "flow", config: {} },
      }]);
      if (sourceNodeId) {
         addEdges([{ id: `e${sourceNodeId}-${newId}`, source: sourceNodeId, target: newId, type: "provance", style: EDGE_STYLE, ...(sourceHandleId ? { sourceHandle: sourceHandleId } : {}) }]);
      }
      handleClose();
   };

   const handleAddTrigger = (t: Agent) => {
      const newId = `trigger-${Date.now()}`;
      const source = sourceNodeId ? getNode(sourceNodeId) : null;
      const position = source
         ? { x: source.position.x + 280, y: source.position.y + 160 }
         : { x: 0, y: 0 };
      addNodes([{
         id: newId, type: "trigger" as const, position,
         data: { label: t.label, triggerType: t.id, icon: t.icon, agentId: t.id, action: { key: t.id, label: t.label } },
      }]);
      handleClose();
   };

   return (
      <Dialog open={isSheetOpen} onOpenChange={(o) => { if (!o) handleClose(); }}>
         <DialogContent
            aria-describedby={undefined}
            showCloseButton={false}
            className="w-[420px] !max-w-[95vw] max-h-[80vh] bg-ink-dark border border-sand/4 p-0 flex flex-col gap-0 rounded-lg overflow-visible"
         >
            <DialogTitle className="sr-only">Add node</DialogTitle>

            {/* Floating back chip — sits above the dialog */}
            {selected !== null && (
               <button
                  onClick={() => { setSelected(null); setSearch(""); }}
                  className="absolute -top-10 left-0 flex items-center gap-1.5 px-2.5 py-1 bg-ink-dark border border-white/15 rounded-sm text-[12px] text-white cursor-pointer hover:bg-white/10 transition-colors"
               >
                  <ChevronLeft size={12} strokeWidth={2} />
                  Go Back
               </button>
            )}

            <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-lg">

            {selected === "flow" ? (
               /* ── Flow list view ── */
               <>
                  <div className="flex-1 overflow-y-auto">
                     <div
                        onClick={handleAddCondition}
                        className="group flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                     >
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                           <Image src="/icons/agents/condition.svg" alt="IF" width={22} height={22} className="object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[13px] font-medium text-white/75 group-hover:text-white transition-colors">IF</p>
                           <p className="text-[11px] text-white/30 leading-snug mt-0.5">Route items to different branches based on a condition</p>
                        </div>
                     </div>
                  </div>
               </>
            ) : selected === "trigger" ? (
               /* ── Trigger list view ── */
               <>
                  <div className="px-1.5 pt-1.5 pb-3 shrink-0">
                     <div className="flex items-center gap-2 bg-[#141414] border border-sand/12 px-3 h-11 rounded-sm focus-within:border-sand/20 transition-all">
                        <Search size={15} strokeWidth={1.5} className="text-white/30 shrink-0" />
                        <input
                           autoFocus
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           placeholder="Search triggers..."
                           className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none"
                        />
                        {search && (
                           <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/60 transition-colors cursor-pointer shrink-0">
                              <X size={12} strokeWidth={2} />
                           </button>
                        )}
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                     {filteredTriggers.length > 0 ? (
                        filteredTriggers.map((t) => (
                           <div
                              key={t.id}
                              onClick={() => handleAddTrigger(t)}
                              className="group flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                           >
                              <div className="w-8 h-8 shrink-0 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                                 <Image src={t.icon} alt={t.label} width={22} height={22} className="object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-[13px] font-medium text-white/75 group-hover:text-white transition-colors">{t.label}</p>
                                 <p className="text-[11px] text-white/30 leading-snug mt-0.5">{t.description}</p>
                              </div>
                           </div>
                        ))
                     ) : (
                        <p className="text-xs text-white/30 text-center py-10">No triggers found</p>
                     )}
                  </div>
               </>
            ) : !selected ? (
               /* ── Main list view ── */
               <>
                  <div className="px-1.5 pt-1.5 pb-3 shrink-0">
                     <div className="flex items-center gap-2 bg-[#141414] border border-sand/12 px-3 h-11 rounded-sm focus-within:border-sand/20 transition-all">
                        <Search size={15} strokeWidth={1.5} className="text-sand/30 shrink-0" />
                        <input
                           autoFocus
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           placeholder="Search nodes..."
                           className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none"
                        />
                        {search && (
                           <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/60 transition-colors cursor-pointer shrink-0">
                              <X size={12} strokeWidth={2} />
                           </button>
                        )}
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                     {/* Trigger card */}
                     {showTriggerCard && (
                        <div
                           onClick={() => { setSelected("trigger"); setSearch(""); }}
                           className="group flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                           <div className="w-8 h-8 shrink-0 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                              <Zap size={18} strokeWidth={1.5} fill="currentColor" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-white/70 group-hover:text-white transition-colors truncate">Triggers</p>
                              <p className="text-[11px] text-white/30 leading-snug">Start your workflow on a schedule or event</p>
                           </div>
                           <ChevronRight size={17} strokeWidth={1.5} className="text-white/30 group-hover:text-white/60 shrink-0 transition-colors" />
                        </div>
                     )}

                     {/* Flow category */}
                     {showFlowCard && (
                        <div
                           onClick={() => { setSelected("flow"); setSearch(""); }}
                           className="group flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                           <div className="w-8 h-8 shrink-0 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                              <GitBranch size={18} strokeWidth={1.5} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-white/70 group-hover:text-white transition-colors truncate">Flow</p>
                              <p className="text-[11px] text-white/30 leading-snug">Branch and control how items move through your workflow</p>
                           </div>
                           <ChevronRight size={17} strokeWidth={1.5} className="text-white/30 group-hover:text-white/60 shrink-0 transition-colors" />
                        </div>
                     )}


                     {filteredAgents.length > 0 ? (
                        filteredAgents.map((a) => (
                           <div
                              key={a.id}
                              onClick={() => setSelected(a)}
                              className="group flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
                           >
                              <div className="w-8 h-8 shrink-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                                 <Image src={a.icon} alt={a.label} width={512} height={512} className="object-contain" style={{ width: 22, height: 22 }} />
                              </div>
                              <span className="flex-1 text-[13px] font-medium text-white/70 group-hover:text-white transition-colors truncate">
                                 {a.label}
                              </span>
                              <ChevronRight size={17} strokeWidth={1.5} className="text-white/30 group-hover:text-white/60 shrink-0 transition-colors" />
                           </div>
                        ))
                     ) : !showTriggerCard ? (
                        <p className="text-xs text-white/30 text-center py-10">No nodes found</p>
                     ) : null}
                  </div>
               </>
            ) : (
               /* ── Agent detail view ── */
               <>
                  <div className="flex flex-col items-center text-center px-6 pt-6 pb-5 shrink-0">
                     <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                        <Image src={selected.icon} alt={selected.label} width={512} height={512} className="object-contain" style={{ width: 40, height: 40 }} />
                     </div>
                     <p className="text-[17px] font-semibold text-white">{selected.label}</p>
                     <p className="text-[12px] text-white/65 mt-1.5 leading-relaxed max-w-[280px]">{selected.description}</p>
                  </div>

                  <div className="h-px bg-white/6 mx-4 shrink-0" />

                  <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1">
                     {/* Actions */}
                     <p className="px-4 pt-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                        Actions
                     </p>
                     {(selected.actions ?? []).map((action) => (
                        <div
                           key={action.key}
                           onClick={() => handleAddAgent(selected, action.key, action.label)}
                           className="group flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                           <div className="w-7 h-7 shrink-0 flex items-center justify-center opacity-55 group-hover:opacity-100 transition-opacity">
                              <Image src={selected.icon} alt={action.label} width={512} height={512} className="object-contain" style={{ width: 20, height: 20 }} />
                           </div>
                           <span className="flex-1 text-[13px] text-white/85 group-hover:text-white transition-colors">
                              {action.label}
                           </span>
                           {action.price !== undefined && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/8 text-white/45 shrink-0">
                                 ${action.price}
                              </span>
                           )}
                           <Plus size={18} strokeWidth={2} className="text-white/40 group-hover:text-white/80 transition-colors shrink-0" />
                        </div>
                     ))}

                     {/* Features */}
                     {selected.features && selected.features.length > 0 && (
                        <>
                           <div className="h-px bg-white/6 mx-4 my-2" />
                           <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                              Features
                           </p>
                           <div className="px-4 flex flex-col gap-1.5 pb-2">
                              {selected.features.map((f) => (
                                 <div key={f} className="flex items-start gap-2">
                                    <span className="mt-[5px] w-1 h-1 rounded-full bg-white/50 shrink-0" />
                                    <span className="text-[12px] text-white/80 leading-snug">{f}</span>
                                 </div>
                              ))}
                           </div>
                        </>
                     )}

                     {/* Outputs */}
                     {selected.outputs && selected.outputs.length > 0 && (
                        <>
                           <div className="h-px bg-white/6 mx-4 my-2" />
                           <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                              Outputs
                           </p>
                           <div className="px-4 flex flex-wrap gap-1.5 pb-2">
                              {selected.outputs.map((o) => (
                                 <span key={o.key} className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/8 text-white/70">
                                    {o.key}
                                 </span>
                              ))}
                           </div>
                        </>
                     )}

                     {/* Payment */}
                     {selected.payment && (
                        <>
                           <div className="h-px bg-white/6 mx-4 my-2" />
                           <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                              Payment
                           </p>
                           <div className="px-4 pb-4 flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                 <span className="text-[12px] text-white/60">Token</span>
                                 <span className="text-[12px] font-medium text-white">{selected.payment.token}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                 <span className="text-[12px] text-white/60">Chain ID</span>
                                 <span className="text-[12px] font-medium text-white">{selected.payment.chainId}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                 <span className="text-[12px] text-white/60 shrink-0">Contract</span>
                                 <span className="text-[11px] font-mono text-white/60 truncate">{selected.payment.address}</span>
                              </div>
                           </div>
                        </>
                     )}
                  </div>
               </>
            )}
            </div>
         </DialogContent>
      </Dialog>
   );
}
