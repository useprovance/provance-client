"use client";

import { useState, useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import {
   Search,
   Star,
   CloudDownload,
   Plus,
   ChevronDown,
   ExternalLink,
   X,
} from "lucide-react";
import Image from "next/image";
import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEditor } from "./EditorContext";
import { EDGE_STYLE } from "./editor.constants";
import { AGENTS, type Agent } from "@/services/agent.service";

type ModalTab = "details" | "features" | "changelog";

function StarRating({ rating }: { rating: number }) {
   return (
      <span className="flex items-center gap-0.5 text-sm text-sand/70">
         <Star size={13} className="fill-yellow-500 text-yellow-500" />
         {rating}
      </span>
   );
}

function SectionHeader({
   label,
   count,
   open,
   onToggle,
}: {
   label: string;
   count: number;
   open: boolean;
   onToggle: () => void;
}) {
   const padded = count < 10 ? `0${count}` : `${count}`;
   return (
      <button
         onClick={onToggle}
         className="w-full flex items-center gap-2 px-3 py-2 hover:bg-sand/4 transition-colors cursor-pointer"
      >
         <ChevronDown
            size={11}
            strokeWidth={2.5}
            className={`text-sand/50 transition-transform shrink-0 ${open ? "" : "-rotate-90"}`}
         />
         <span className="text-[11px] font-semibold uppercase tracking-widest text-sand/55 flex-1 text-left">
            {label}
         </span>
         <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-ink bg-sand rounded-full leading-none shrink-0">
            {padded}
         </span>
      </button>
   );
}

function AgentRow({
   agent,
   installed,
   onInstall,
   onOpenDetail,
   onAddToCanvas,
}: {
   agent: Agent;
   installed: boolean;
   onInstall: (agent: Agent) => void;
   onOpenDetail: (agent: Agent) => void;
   onAddToCanvas: (agent: Agent) => void;
}) {
   return (
      <div
         onClick={() => onOpenDetail(agent)}
         className="flex items-center gap-3 px-3 py-3 hover:bg-sand/5 transition-colors border-b border-sand/6 last:border-0 cursor-pointer"
      >
         {/* Icon */}
         <div className="w-11 h-11 shrink-0 flex items-center justify-center">
            <Image
               src={agent.icon}
               alt={agent.label}
               width={36}
               height={36}
               className="object-contain"
            />
         </div>

         {/* Content */}
         <div className="flex-1 min-w-0 flex flex-col gap-1">
            {/* Row 1: name + downloads + rating */}
            <div className="flex items-center justify-between gap-2">
               <span className="text-[13px] font-semibold text-sand leading-none truncate">
                  {agent.label}
               </span>
               <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-[11px] text-sand/45">
                     <CloudDownload size={11} strokeWidth={2} />
                     {agent.downloads}
                  </span>
                  <span className="flex items-center gap-0.5 text-[11px] text-sand/45">
                     <Star
                        size={11}
                        className="fill-yellow-500 text-yellow-500"
                     />
                     {agent.rating}
                  </span>
               </div>
            </div>

            {/* Row 2: description */}
            <p className="text-[12px] text-sand/40 leading-snug line-clamp-1">
               {agent.description}
            </p>

            {/* Row 3: author + action */}
            <div className="flex items-center justify-between gap-2 mt-0.5">
               <span className="text-[11px] text-sand/35 truncate">
                  {agent.author}
               </span>
               <div onClick={(e) => e.stopPropagation()}>
                  {installed ? (
                     <button
                        onClick={() => onAddToCanvas(agent)}
                        className="h-5 px-2.5 text-[10px] font-semibold bg-orange text-white hover:bg-orange/80 transition-colors cursor-pointer rounded-xs"
                     >
                        Add
                     </button>
                  ) : (
                     <button
                        onClick={() => onInstall(agent)}
                        className="h-5 px-2.5 text-[10px] font-semibold bg-sand text-ink hover:bg-sand/80 transition-colors cursor-pointer rounded-xs"
                     >
                        Install
                     </button>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}

function AgentDetailModal({
   agent,
   installed,
   onClose,
   onInstall,
   onAddToCanvas,
}: {
   agent: Agent;
   installed: boolean;
   onClose: () => void;
   onInstall: (agent: Agent) => void;
   onAddToCanvas: (agent: Agent) => void;
}) {
   const [tab, setTab] = useState<ModalTab>("details");

   return (
      <Dialog
         open
         onOpenChange={(o) => {
            if (!o) onClose();
         }}
      >
         <DialogContent
            aria-describedby={undefined}
            className="w-[1100px] !max-w-[95vw] max-h-[85vh] bg-[#1c1c1c] border border-[#2a2a2a] p-0 gap-0 shadow-2xl flex flex-col"
         >
            <DialogTitle className="sr-only">{agent.label}</DialogTitle>

            {/* Header */}
            <div className="flex items-start gap-4 px-6 py-5 border-b border-[#2a2a2a] shrink-0">
               <div className="w-14 h-14 rounded-xl bg-[#252525] flex items-center justify-center shrink-0">
                  <Image
                     src={agent.icon}
                     alt={agent.label}
                     width={38}
                     height={38}
                     className="object-contain"
                  />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[18px] font-semibold text-sand leading-tight">
                     {agent.label}
                  </p>
                  <p className="text-[12px] text-sand/50 mt-0.5">
                     by {agent.author}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                     <StarRating rating={agent.rating} />
                     <span className="flex items-center gap-1 text-[11px] text-sand/50">
                        <CloudDownload size={12} />
                        {agent.downloads} installs
                     </span>
                     <span className="text-[11px] text-sand/30 bg-sand/8 border border-sand/10 rounded px-1.5 py-0.5 font-mono">
                        v{agent.version}
                     </span>
                  </div>
               </div>
               <div className="flex items-center gap-2 shrink-0">
                  {installed ? (
                     <button
                        onClick={() => {
                           onAddToCanvas(agent);
                           onClose();
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium bg-orange text-white rounded-md hover:bg-orange/90 transition-colors cursor-pointer"
                     >
                        <Plus size={14} strokeWidth={2} />
                        Add to canvas
                     </button>
                  ) : (
                     <button
                        onClick={() => {
                           onInstall(agent);
                           onClose();
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium bg-orange text-white rounded-md hover:bg-orange/90 transition-colors cursor-pointer"
                     >
                        Install
                     </button>
                  )}
               </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#2a2a2a] px-6 shrink-0">
               {(["details", "features", "changelog"] as ModalTab[]).map(
                  (t) => (
                     <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-1 py-3 mr-6 text-[12px] font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-px ${
                           tab === t
                              ? "text-orange border-orange"
                              : "text-sand/35 border-transparent hover:text-sand/60"
                        }`}
                     >
                        {t}
                     </button>
                  ),
               )}
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
               {/* Main content */}
               <div className="flex-1 overflow-y-auto px-6 py-6">
                  {tab === "details" && (
                     <div className="flex flex-col gap-6">
                        {/* Banner */}
                        <div className="flex flex-col items-center justify-center py-8 bg-[#181818] rounded-xl border border-[#2a2a2a]">
                           <div className="w-20 h-20 rounded-2xl bg-[#252525] flex items-center justify-center mb-4">
                              <Image
                                 src={agent.icon}
                                 alt={agent.label}
                                 width={52}
                                 height={52}
                                 className="object-contain"
                              />
                           </div>
                           <p className="text-[20px] font-semibold text-sand">
                              {agent.label}
                           </p>
                        </div>

                        <div className="border-t border-[#2a2a2a] pt-5">
                           <p className="text-[14px] font-semibold text-sand mb-2">
                              About
                           </p>
                           <p className="text-[13px] text-sand/60 leading-relaxed">
                              {agent.description}
                           </p>
                        </div>

                        <div>
                           <p className="text-[14px] font-semibold text-sand mb-2">
                              How it works
                           </p>
                           <p className="text-[13px] text-sand/60 leading-relaxed">
                              This agent runs on the developer&apos;s own
                              infrastructure. When triggered in your workflow,
                              Provance calls its API endpoint with the input
                              payload and passes the structured response to the
                              next node in the graph.
                           </p>
                        </div>
                     </div>
                  )}

                  {tab === "features" && (
                     <ul className="flex flex-col gap-3">
                        {agent.features.map((f, i) => (
                           <li
                              key={i}
                              className="flex items-start gap-3 text-[13px] text-sand/70"
                           >
                              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                              {f}
                           </li>
                        ))}
                     </ul>
                  )}

                  {tab === "changelog" && (
                     <div className="flex flex-col gap-4">
                        <div className="border-l-2 border-orange pl-4">
                           <p className="text-[13px] font-semibold text-sand">
                              v{agent.version}{" "}
                              <span className="text-sand/30 font-normal ml-2">
                                 {agent.lastReleased}
                              </span>
                           </p>
                           <p className="text-[12px] text-sand/50 mt-1">
                              Latest release. Performance improvements and bug
                              fixes.
                           </p>
                        </div>
                        <div className="border-l-2 border-[#2a2a2a] pl-4">
                           <p className="text-[13px] font-semibold text-sand/50">
                              Previous versions
                           </p>
                           <p className="text-[12px] text-sand/30 mt-1">
                              See the repository for full changelog history.
                           </p>
                        </div>
                     </div>
                  )}
               </div>

               {/* Sidebar */}
               <div className="w-52 shrink-0 border-l border-[#2a2a2a] px-5 py-6 flex flex-col gap-6 overflow-y-auto">
                  <div>
                     <p className="text-[13px] font-semibold text-sand mb-3">
                        Marketplace
                     </p>
                     <div className="flex flex-col gap-2.5 text-[12px]">
                        <div>
                           <p className="text-sand/35 mb-0.5">Identifier</p>
                           <p className="text-sand/70 font-mono text-[11px] break-all">
                              {agent.identifier}
                           </p>
                        </div>
                        <div>
                           <p className="text-sand/35 mb-0.5">Version</p>
                           <p className="text-sand/70">{agent.version}</p>
                        </div>
                        <div>
                           <p className="text-sand/35 mb-0.5">Published</p>
                           <p className="text-sand/70">{agent.publishedAt}</p>
                        </div>
                        <div>
                           <p className="text-sand/35 mb-0.5">Last Released</p>
                           <p className="text-sand/70">{agent.lastReleased}</p>
                        </div>
                     </div>
                  </div>

                  <div>
                     <p className="text-[13px] font-semibold text-sand mb-3">
                        Categories
                     </p>
                     <span className="inline-block text-[11px] text-sand/60 border border-[#333] rounded px-2 py-0.5">
                        {agent.category}
                     </span>
                  </div>

                  <div>
                     <p className="text-[13px] font-semibold text-sand mb-3">
                        Resources
                     </p>
                     <div className="flex flex-col gap-2">
                        {["Repository", "Issues", "License", "Marketplace"].map(
                           (r) => (
                              <button
                                 key={r}
                                 className="flex items-center gap-1.5 text-[12px] text-sand/50 hover:text-sand transition-colors cursor-pointer text-left"
                              >
                                 <ExternalLink
                                    size={11}
                                    strokeWidth={1.5}
                                    className="shrink-0"
                                 />
                                 {r}
                              </button>
                           ),
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}

export function AddAgentSheet({ workflowId }: { workflowId: string }) {
   void workflowId;
   const { isSheetOpen, closeSheet, sourceNodeId } = useEditor();
   const { addNodes, addEdges, getNode } = useReactFlow();
   const [search, setSearch] = useState("");
   const [installedAgents, setInstalledAgents] =
      useState<Agent[]>(AGENTS);
   const [detailAgent, setDetailAgent] = useState<Agent | null>(null);
   const [installedOpen, setInstalledOpen] = useState(true);
   const installedIds = useMemo(
      () => new Set(installedAgents.map((a) => a.id)),
      [installedAgents],
   );

   const filterFn = (a: Agent) => {
      const q = search.toLowerCase();
      return (
         a.label.toLowerCase().includes(q) ||
         a.description.toLowerCase().includes(q) ||
         a.author.toLowerCase().includes(q)
      );
   };

   const filteredInstalled = installedAgents.filter(filterFn);

   const handleInstall = (agent: Agent) => {
      setInstalledAgents((prev) => [...prev, agent]);
   };

   const handleAddToCanvas = (agent: Agent) => {
      const newId = `${Date.now()}`;
      const source = sourceNodeId ? getNode(sourceNodeId) : null;

      addNodes([
         {
            id: newId,
            type: "agent" as const,
            position: source
               ? { x: source.position.x + 110, y: source.position.y }
               : { x: 0, y: 0 },
            data: {
               label: agent.label,
               icon: agent.icon,
               agentId: agent.id,
            },
         },
      ]);

      if (sourceNodeId) {
         addEdges([
            {
               id: `e${sourceNodeId}-${newId}`,
               source: sourceNodeId,
               target: newId,
               type: "smoothstep",
               style: EDGE_STYLE,
            },
         ]);
      }

      closeSheet();
      setSearch("");
   };

   return (
      <>
         <Sheet
            open={isSheetOpen}
            onOpenChange={(o) => {
               if (!o) closeSheet();
            }}
         >
            <SheetContent
               side="right"
               aria-describedby={undefined}
               className="w-80 bg-ink-dark border-sand/15 p-0 flex flex-col"
            >
               <SheetHeader className="px-4 pt-4 pb-3 shrink-0">
                  <SheetTitle className="text-[11px] uppercase tracking-widest font-semibold text-sand/40">
                     Agents
                  </SheetTitle>
               </SheetHeader>

               <div className="px-3 pb-3 shrink-0">
                  <div className="flex items-center gap-2 bg-[#141414] border border-sand/12 px-3 h-10 focus-within:border-orange/40 focus-within:ring-1 focus-within:ring-orange/10 transition-all">
                     <Search
                        size={13}
                        strokeWidth={1.5}
                        className="text-sand/30 shrink-0"
                     />
                     <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search agents..."
                        className="flex-1 bg-transparent text-[13px] text-sand placeholder:text-sand/25 outline-none"
                     />
                     {search && (
                        <button
                           onClick={() => setSearch("")}
                           className="text-sand/30 hover:text-sand/60 transition-colors cursor-pointer shrink-0"
                        >
                           <X size={12} strokeWidth={2} />
                        </button>
                     )}
                  </div>
               </div>

               <div className="h-px bg-sand/8 mx-3 shrink-0" />

               <div className="flex-1 overflow-y-auto">
                  {filteredInstalled.length > 0 && (
                     <>
                        <SectionHeader
                           label="Installed"
                           count={filteredInstalled.length}
                           open={installedOpen}
                           onToggle={() => setInstalledOpen((v) => !v)}
                        />
                        {installedOpen &&
                           filteredInstalled.map((a) => (
                              <AgentRow
                                 key={a.id}
                                 agent={a}
                                 installed
                                 onInstall={handleInstall}
                                 onOpenDetail={setDetailAgent}
                                 onAddToCanvas={handleAddToCanvas}
                              />
                           ))}
                     </>
                  )}

                  {filteredInstalled.length === 0 && (
                     <p className="text-xs text-sand/30 text-center py-10">
                        No agents found
                     </p>
                  )}
               </div>
            </SheetContent>
         </Sheet>

         {detailAgent && (
            <AgentDetailModal
               agent={detailAgent}
               installed={installedIds.has(detailAgent.id)}
               onClose={() => setDetailAgent(null)}
               onInstall={handleInstall}
               onAddToCanvas={handleAddToCanvas}
            />
         )}
      </>
   );
}
