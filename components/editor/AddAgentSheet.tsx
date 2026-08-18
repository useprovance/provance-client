"use client";

import { useState, useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { Search, ChevronRight, ChevronLeft, Plus, X } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEditor } from "./EditorContext";
import { EDGE_STYLE } from "./editor.constants";
import { AGENTS, type Agent } from "@/services/agent.service";

export function AddAgentSheet({ workflowId }: { workflowId: string }) {
   const { isSheetOpen, closeSheet, sourceNodeId } = useEditor();
   const { addNodes, addEdges, getNode } = useReactFlow();
   const [search, setSearch] = useState("");
   const [selected, setSelected] = useState<Agent | null>(null);

   const filtered = useMemo(() => {
      const q = search.toLowerCase();
      return AGENTS.filter(
         (a) =>
            a.label.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.author.toLowerCase().includes(q),
      );
   }, [search]);

   const handleClose = () => {
      closeSheet();
      setSearch("");
      setSelected(null);
   };

   const handleAddToCanvas = (agent: Agent, actionKey?: string) => {
      const newId = `${Date.now()}`;
      const source = sourceNodeId ? getNode(sourceNodeId) : null;
      const position = source
         ? { x: source.position.x + 110, y: source.position.y }
         : { x: 0, y: 0 };

      addNodes([{
         id: newId,
         type: "agent" as const,
         position,
         data: {
            label: agent.label,
            icon: agent.icon,
            agentId: agent.id,
            ...(actionKey ? { action: { key: actionKey } } : {}),
         },
      }]);

      if (sourceNodeId) {
         addEdges([{
            id: `e${sourceNodeId}-${newId}`,
            source: sourceNodeId,
            target: newId,
            type: "provance",
            style: EDGE_STYLE,
         }]);
      }

      handleClose();
   };

   return (
      <Dialog open={isSheetOpen} onOpenChange={(o) => { if (!o) handleClose(); }}>
         <DialogContent
            aria-describedby={undefined}
            showCloseButton={false}
            className="w-[420px] !max-w-[95vw] max-h-[80vh] bg-ink-dark border border-sand/4 p-0 flex flex-col gap-0 rounded-lg overflow-hidden"
         >
            <DialogTitle className="sr-only">Node</DialogTitle>

            {!selected ? (
               /* ── List view ── */
               <>
                  <div className="px-1.5 pt-1.5 pb-3 shrink-0">
                     <div className="flex items-center gap-2 bg-[#141414] border border-sand/12 px-3 h-11 rounded-sm focus-within:border-sand/20 transition-all">
                        <Search size={15} strokeWidth={1.5} className="text-sand/30 shrink-0" />
                        <input
                           autoFocus
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           placeholder="Search agents..."
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
                     {filtered.length > 0 ? (
                        filtered.map((a) => (
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
                     ) : (
                        <p className="text-xs text-white/30 text-center py-10">No agents found</p>
                     )}
                  </div>
               </>
            ) : (
               /* ── Detail view ── */
               <>
                  {/* Back button */}
                  <button
                     onClick={() => setSelected(null)}
                     className="flex items-center gap-1.5 px-3 pt-3 pb-1 text-[12px] text-white/40 hover:text-white/70 transition-colors cursor-pointer w-fit"
                  >
                     <ChevronLeft size={14} strokeWidth={1.5} />
                     Back
                  </button>

                  {/* Icon + name + description */}
                  <div className="flex flex-col items-center text-center px-6 pt-4 pb-5 shrink-0">
                     <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                        <Image src={selected.icon} alt={selected.label} width={512} height={512} className="object-contain" style={{ width: 40, height: 40 }} />
                     </div>
                     <p className="text-[17px] font-semibold text-white">{selected.label}</p>
                     <p className="text-[12px] text-white/40 mt-1.5 leading-relaxed max-w-[280px]">{selected.description}</p>
                  </div>

                  <div className="h-px bg-white/6 mx-4 shrink-0" />

                  {/* Actions */}
                  <div className="flex-1 overflow-y-auto py-2">
                     <p className="px-4 pt-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                        Actions
                     </p>
                     {(selected.actions ?? []).map((action) => (
                        <div
                           key={action.key}
                           className="group flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                        >
                           <div className="w-7 h-7 shrink-0 flex items-center justify-center opacity-55 group-hover:opacity-100 transition-opacity">
                              <Image src={selected.icon} alt={action.label} width={512} height={512} className="object-contain" style={{ width: 20, height: 20 }} />
                           </div>
                           <span className="flex-1 text-[13px] text-white/70 group-hover:text-white transition-colors">
                              {action.label}
                           </span>
                           <button
                              onClick={() => handleAddToCanvas(selected, action.key)}
                              className="shrink-0 flex items-center gap-1 h-6 px-2.5 text-[11px] font-semibold bg-orange text-white hover:bg-orange/80 transition-colors cursor-pointer rounded-sm"
                           >
                              <Plus size={10} strokeWidth={2.5} />
                              Add
                           </button>
                        </div>
                     ))}
                  </div>
               </>
            )}
         </DialogContent>
      </Dialog>
   );
}
