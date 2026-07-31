"use client";

import { useState, useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { Search, Settings, Star, CloudDownload } from "lucide-react";
import Image from "next/image";
import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
} from "@/components/ui/sheet";
import { useEditor } from "./EditorContext";
import { EDGE_STYLE } from "./editor.constants";

interface AgentDef {
   id: string;
   label: string;
   description: string;
   author: string;
   downloads: string;
   rating: number;
   icon: string;
   installed: boolean;
}

const AGENTS: AgentDef[] = [
   {
      id: "trigger",
      label: "Trigger Agent",
      description: "Starts your workflow on a schedule, webhook, or manual run",
      author: "Provance",
      downloads: "12.4K",
      rating: 5,
      icon: "/icons/agents/trigger.svg",
      installed: true,
   },
   {
      id: "gmail-agent",
      label: "Gmail Agent",
      description: "Read, send, and manage emails via Gmail",
      author: "Provance",
      downloads: "8.1K",
      rating: 4.5,
      icon: "/icons/agents/gmail.svg",
      installed: true,
   },
   {
      id: "whatsapp-agent",
      label: "WhatsApp Agent",
      description: "Send and receive WhatsApp messages automatically",
      author: "Provance",
      downloads: "6.3K",
      rating: 4,
      icon: "/icons/agents/whatsapp.svg",
      installed: true,
   },
   {
      id: "contract-analyzer",
      label: "Contract Analyzer",
      description: "Scans smart contracts for red flags and vulnerabilities",
      author: "Web3 Labs",
      downloads: "5.2K",
      rating: 4.5,
      icon: "/icons/agents/contract-analyzer.svg",
      installed: false,
   },
   {
      id: "price-monitor",
      label: "Price Monitor",
      description: "Watches token prices and triggers alerts on thresholds",
      author: "DeFi Tools",
      downloads: "9.8K",
      rating: 4,
      icon: "/icons/agents/price-monitor.svg",
      installed: false,
   },
   {
      id: "alert-agent",
      label: "Alert Agent",
      description: "Sends alerts to Telegram, Discord, or email",
      author: "Provance",
      downloads: "7.4K",
      rating: 5,
      icon: "/icons/agents/alert.svg",
      installed: false,
   },
   {
      id: "wallet-tracker",
      label: "Wallet Tracker",
      description: "Tracks on-chain activity for a set of wallets",
      author: "ChainWatch",
      downloads: "4.1K",
      rating: 4,
      icon: "/icons/agents/wallet-tracker.svg",
      installed: false,
   },
   {
      id: "risk-scorer",
      label: "Risk Scorer",
      description: "Combines signals into a Low / Medium / High risk score",
      author: "Web3 Labs",
      downloads: "3.6K",
      rating: 4.5,
      icon: "/icons/agents/risk-scorer.svg",
      installed: false,
   },
   {
      id: "trello-agent",
      label: "Trello Agent",
      description: "Create and manage Trello cards and boards",
      author: "Atlassian",
      downloads: "11.2K",
      rating: 4,
      icon: "/icons/agents/trello.svg",
      installed: false,
   },
   {
      id: "cloud-agent",
      label: "Cloud Storage Agent",
      description: "Upload, fetch, and manage files in cloud storage",
      author: "Provance",
      downloads: "2.9K",
      rating: 3.5,
      icon: "/icons/agents/cloud.svg",
      installed: false,
   },
   {
      id: "summarizer",
      label: "Summarizer",
      description: "Condenses research and data into a clean report",
      author: "AI Core",
      downloads: "6.7K",
      rating: 5,
      icon: "/icons/agents/summarizer.svg",
      installed: false,
   },
   {
      id: "webhook",
      label: "Webhook Agent",
      description: "Send data payloads to any external HTTP endpoint",
      author: "Provance",
      downloads: "8.8K",
      rating: 4.5,
      icon: "/icons/agents/webhook.svg",
      installed: false,
   },
];

function StarRating({ rating }: { rating: number }) {
   return (
      <span className="flex items-center gap-0.5 text-sm text-sand/70">
         <Star size={13} className="fill-yellow-500 text-yellow-500" />
         {rating}
      </span>
   );
}

function AgentRow({
   agent,
   onAdd,
}: {
   agent: AgentDef;
   onAdd: (agent: AgentDef) => void;
}) {
   return (
      <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-sand/5 transition-colors cursor-pointer border-b border-sand/5 last:border-0">
         <div className="w-11 h-11 rounded-lg shrink-0 bg-ink flex items-center justify-center">
            <Image
               src={agent.icon}
               alt={agent.label}
               width={36}
               height={36}
               className="object-contain"
            />
         </div>
         <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
               <span className="text-[15px] font-semibold text-sand leading-none truncate">
                  {agent.label}
               </span>
               <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-sand/70">
                     <CloudDownload size={15} />
                     {agent.downloads}
                  </span>
                  <StarRating rating={agent.rating} />
               </div>
            </div>
            <p className="text-[13px] text-sand/45 leading-snug mb-2 line-clamp-1">
               {agent.description}
            </p>
            <div className="flex items-center justify-between">
               <span className="text-xs font-semibold text-sand/70">
                  {agent.author}
               </span>
               {agent.installed ? (
                  <button className="text-sand/60 hover:text-sand/60 transition-colors cursor-pointer">
                     <Settings size={17} strokeWidth={1.5} />
                  </button>
               ) : (
                  <button
                     onClick={() => onAdd(agent)}
                     className="h-6 px-2.5 text-[11px] font-medium rounded bg-orange text-white hover:bg-orange/90 transition-colors cursor-pointer"
                  >
                     Install
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}

export function AddAgentSheet() {
   const { isSheetOpen, closeSheet, sourceNodeId } = useEditor();
   const { addNodes, addEdges, getNode } = useReactFlow();
   const [search, setSearch] = useState("");

   const filtered = useMemo(
      () =>
         AGENTS.filter(
            (a) =>
               a.label.toLowerCase().includes(search.toLowerCase()) ||
               a.description.toLowerCase().includes(search.toLowerCase()) ||
               a.author.toLowerCase().includes(search.toLowerCase()),
         ),
      [search],
   );

   const installed = filtered.filter((a) => a.installed);
   const available = filtered.filter((a) => !a.installed);

   const handleAdd = (agent: AgentDef) => {
      if (!sourceNodeId) return;
      const source = getNode(sourceNodeId);
      const newId = `${Date.now()}`;
      addNodes([
         {
            id: newId,
            type: "agent" as const,
            position: {
               x: (source?.position.x ?? 0) + 110,
               y: source?.position.y ?? 0,
            },
            data: { label: agent.label, icon: agent.icon },
         },
      ]);
      addEdges([
         {
            id: `e${sourceNodeId}-${newId}`,
            source: sourceNodeId,
            target: newId,
            type: "smoothstep",
            style: EDGE_STYLE,
         },
      ]);
      closeSheet();
      setSearch("");
   };

   return (
      <Sheet
         open={isSheetOpen}
         onOpenChange={(o) => {
            if (!o) closeSheet();
         }}
      >
         <SheetContent
            side="right"
            className="w-80 bg-ink-dark border-sand/15 p-0 flex flex-col"
         >
            <SheetHeader className="px-4 pt-5 pb-3 border-b border-sand/10">
               <SheetTitle className="text-sm text-sand font-semibold">
                  Agents
               </SheetTitle>
            </SheetHeader>

            <div className="px-3 py-3 border-b border-sand/10">
               <div className="flex items-center gap-2 bg-ink border border-sand/15 rounded px-3 py-2">
                  <Search
                     size={12}
                     strokeWidth={1.5}
                     className="text-sand/40 shrink-0"
                  />
                  <input
                     autoFocus
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Search agents..."
                     className="flex-1 bg-transparent text-xs text-sand placeholder:text-sand/30 outline-none"
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto">
               {installed.length > 0 && (
                  <>
                     <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sand/30">
                        Installed
                     </p>
                     {installed.map((a) => (
                        <AgentRow key={a.id} agent={a} onAdd={handleAdd} />
                     ))}
                  </>
               )}
               {available.length > 0 && (
                  <>
                     <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sand/30">
                        Available
                     </p>
                     {available.map((a) => (
                        <AgentRow key={a.id} agent={a} onAdd={handleAdd} />
                     ))}
                  </>
               )}
               {filtered.length === 0 && (
                  <p className="text-xs text-sand/30 text-center py-10">
                     No agents found
                  </p>
               )}
            </div>
         </SheetContent>
      </Sheet>
   );
}
