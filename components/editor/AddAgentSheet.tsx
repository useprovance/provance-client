"use client";

import { useState, useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { Search, Star, CloudDownload, Plus, ChevronDown, ExternalLink } from "lucide-react";
import Image from "next/image";
import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
} from "@/components/ui/sheet";
import {
   Dialog,
   DialogContent,
   DialogTitle,
} from "@/components/ui/dialog";
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
   version: string;
   category: string;
   identifier: string;
   publishedAt: string;
   lastReleased: string;
   features: string[];
}

// Agents the user already has installed (matches canvas)
const DEFAULT_INSTALLED: AgentDef[] = [
   {
      id: "trigger",
      label: "DeFi Protocol Trigger",
      description: "Starts your workflow on a schedule, webhook, or manual run. Supports cron expressions, webhooks, and one-click manual triggers.",
      author: "Provance",
      downloads: "12.4K",
      rating: 5,
      icon: "/icons/agents/trigger.svg",
      version: "1.2.0",
      category: "Triggers",
      identifier: "provance.trigger-agent",
      publishedAt: "8 months ago",
      lastReleased: "2 weeks ago",
      features: ["Schedule via cron expression", "Webhook trigger support", "Manual one-click run", "Retry on failure"],
   },
   {
      id: "defillama",
      label: "DefiLlama Agent",
      description: "Fetches TVL, volume, and fee data from DeFiLlama across protocols. Monitors threshold breaches and passes structured data downstream.",
      author: "Provance",
      downloads: "7.2K",
      rating: 4.5,
      icon: "/icons/agents/defillama.svg",
      version: "1.0.4",
      category: "DeFi Data",
      identifier: "provance.defillama-agent",
      publishedAt: "6 months ago",
      lastReleased: "1 month ago",
      features: ["TVL tracking across chains", "Volume and fee metrics", "Multi-protocol support", "Threshold alerting"],
   },
   {
      id: "dune",
      label: "Dune Analytics Agent",
      description: "Runs Dune queries and pulls on-chain analytics into your workflow. Returns structured results ready for downstream processing.",
      author: "Provance",
      downloads: "5.8K",
      rating: 4.5,
      icon: "/icons/agents/dune.svg",
      version: "1.1.0",
      category: "On-chain Analytics",
      identifier: "provance.dune-agent",
      publishedAt: "5 months ago",
      lastReleased: "3 weeks ago",
      features: ["Custom query execution", "Scheduled refresh", "Structured JSON output", "Dune API key support"],
   },
   {
      id: "goplus",
      label: "GoPlus Agent",
      description: "Runs on-chain security checks on token contracts and flags risks. Detects honeypots, rug pulls, and other vulnerabilities.",
      author: "Provance",
      downloads: "4.9K",
      rating: 4,
      icon: "/icons/agents/goplus.png",
      version: "1.0.2",
      category: "Security",
      identifier: "provance.goplus-agent",
      publishedAt: "4 months ago",
      lastReleased: "5 weeks ago",
      features: ["Honeypot detection", "Rug pull analysis", "Multi-chain support", "Risk level scoring"],
   },
   {
      id: "openai",
      label: "OpenAI Agent",
      description: "Summarises all collected DeFi signals into a human-readable risk report using GPT-4o. Configurable system prompt and temperature.",
      author: "Provance",
      downloads: "18.3K",
      rating: 5,
      icon: "/icons/agents/openai.svg",
      version: "2.0.1",
      category: "AI",
      identifier: "provance.openai-agent",
      publishedAt: "10 months ago",
      lastReleased: "1 week ago",
      features: ["GPT-4o support", "Custom system prompt", "Temperature control", "Max token limit", "Structured output mode"],
   },
   {
      id: "telegram",
      label: "Telegram Agent",
      description: "Sends formatted alerts to a Telegram channel or group when risk is detected. Supports custom message templates with dynamic variables.",
      author: "Provance",
      downloads: "9.1K",
      rating: 4.5,
      icon: "/icons/agents/telegram.svg",
      version: "1.3.0",
      category: "Notifications",
      identifier: "provance.telegram-agent",
      publishedAt: "7 months ago",
      lastReleased: "2 weeks ago",
      features: ["Channel and group support", "Custom message templates", "Dynamic variable injection", "Markdown formatting"],
   },
];

// Agents available in the marketplace (not yet installed)
const MARKETPLACE_AGENTS: AgentDef[] = [
   {
      id: "gmail-agent",
      label: "Gmail Agent",
      description: "Read, send, and manage emails via Gmail. Supports filters, labels, and reply threading.",
      author: "Provance",
      downloads: "8.1K",
      rating: 4.5,
      icon: "/icons/agents/gmail.svg",
      version: "1.0.0",
      category: "Communication",
      identifier: "provance.gmail-agent",
      publishedAt: "5 months ago",
      lastReleased: "1 month ago",
      features: ["Send and receive emails", "Label and filter support", "Thread replies", "Attachment handling"],
   },
   {
      id: "whatsapp-agent",
      label: "WhatsApp Agent",
      description: "Send and receive WhatsApp messages automatically via the WhatsApp Business API.",
      author: "Provance",
      downloads: "6.3K",
      rating: 4,
      icon: "/icons/agents/whatsapp.svg",
      version: "1.0.1",
      category: "Communication",
      identifier: "provance.whatsapp-agent",
      publishedAt: "4 months ago",
      lastReleased: "6 weeks ago",
      features: ["Business API support", "Template messages", "Media attachments", "Read receipts"],
   },
   {
      id: "contract-analyzer",
      label: "Contract Analyzer",
      description: "Scans smart contracts for red flags and vulnerabilities using static analysis and AI.",
      author: "Web3 Labs",
      downloads: "5.2K",
      rating: 4.5,
      icon: "/icons/agents/contract-analyzer.svg",
      version: "0.9.5",
      category: "Security",
      identifier: "web3labs.contract-analyzer",
      publishedAt: "3 months ago",
      lastReleased: "2 months ago",
      features: ["Static analysis", "AI-powered review", "Solidity and Vyper support", "Risk report output"],
   },
   {
      id: "price-monitor",
      label: "Price Monitor",
      description: "Watches token prices and triggers alerts on threshold breaches via any price oracle.",
      author: "DeFi Tools",
      downloads: "9.8K",
      rating: 4,
      icon: "/icons/agents/price-monitor.svg",
      version: "1.1.2",
      category: "DeFi Data",
      identifier: "defiprice.price-monitor",
      publishedAt: "6 months ago",
      lastReleased: "3 weeks ago",
      features: ["Multi-oracle support", "Percentage threshold alerts", "Price history tracking", "Token watchlist"],
   },
   {
      id: "alert-agent",
      label: "Alert Agent",
      description: "Sends alerts to Telegram, Discord, or email depending on configured channels.",
      author: "Provance",
      downloads: "7.4K",
      rating: 5,
      icon: "/icons/agents/alert.svg",
      version: "1.2.0",
      category: "Notifications",
      identifier: "provance.alert-agent",
      publishedAt: "7 months ago",
      lastReleased: "1 month ago",
      features: ["Telegram, Discord, email support", "Custom alert templates", "Severity levels", "Rate limiting"],
   },
   {
      id: "wallet-tracker",
      label: "Wallet Tracker",
      description: "Tracks on-chain activity for a watched list of wallet addresses across multiple chains.",
      author: "ChainWatch",
      downloads: "4.1K",
      rating: 4,
      icon: "/icons/agents/wallet-tracker.svg",
      version: "1.0.0",
      category: "On-chain Analytics",
      identifier: "chainwatch.wallet-tracker",
      publishedAt: "3 months ago",
      lastReleased: "2 months ago",
      features: ["Multi-wallet tracking", "Cross-chain support", "Transaction alerts", "Balance monitoring"],
   },
   {
      id: "risk-scorer",
      label: "Risk Scorer",
      description: "Combines on-chain signals into a Low, Medium, or High risk score using a configurable model.",
      author: "Web3 Labs",
      downloads: "3.6K",
      rating: 4.5,
      icon: "/icons/agents/risk-scorer.svg",
      version: "0.8.2",
      category: "Security",
      identifier: "web3labs.risk-scorer",
      publishedAt: "2 months ago",
      lastReleased: "1 month ago",
      features: ["Configurable scoring model", "Multi-signal aggregation", "Low/Medium/High output", "Explainable scores"],
   },
   {
      id: "webhook",
      label: "Webhook Agent",
      description: "Send structured data payloads to any external HTTP endpoint with custom headers and auth.",
      author: "Provance",
      downloads: "8.8K",
      rating: 4.5,
      icon: "/icons/agents/webhook.svg",
      version: "1.0.3",
      category: "Integrations",
      identifier: "provance.webhook-agent",
      publishedAt: "8 months ago",
      lastReleased: "2 weeks ago",
      features: ["Custom headers", "Bearer and API key auth", "Retry on failure", "Response validation"],
   },
];

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
   return (
      <button
         onClick={onToggle}
         className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-sand/5 transition-colors cursor-pointer"
      >
         <ChevronDown
            size={13}
            strokeWidth={2}
            className={`text-sand/40 transition-transform shrink-0 ${open ? "" : "-rotate-90"}`}
         />
         <span className="text-[11px] font-semibold uppercase tracking-widest text-sand/50 flex-1 text-left">
            {label}
         </span>
         <span className="text-[10px] font-semibold text-sand/40 bg-sand/10 rounded-full px-1.5 py-0.5 leading-none">
            {count}
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
   agent: AgentDef;
   installed: boolean;
   onInstall: (agent: AgentDef) => void;
   onOpenDetail: (agent: AgentDef) => void;
   onAddToCanvas: (agent: AgentDef) => void;
}) {
   return (
      <div
         onClick={() => onOpenDetail(agent)}
         className="flex items-start gap-3 px-4 py-3.5 hover:bg-sand/5 transition-colors border-b border-sand/5 last:border-0 cursor-pointer"
      >
         <div className="w-11 h-11 rounded-lg shrink-0 bg-ink flex items-center justify-center">
            <Image src={agent.icon} alt={agent.label} width={50} height={50} className="object-contain" />
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
               {installed ? (
                  <button
                     onClick={(e) => { e.stopPropagation(); onAddToCanvas(agent); }}
                     className="h-6 px-2.5 text-[11px] font-medium rounded bg-orange/15 text-orange hover:bg-orange hover:text-white transition-colors cursor-pointer"
                  >
                     Add
                  </button>
               ) : (
                  <button
                     onClick={(e) => { e.stopPropagation(); onInstall(agent); }}
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

function AgentDetailModal({
   agent,
   installed,
   onClose,
   onInstall,
   onAddToCanvas,
}: {
   agent: AgentDef;
   installed: boolean;
   onClose: () => void;
   onInstall: (agent: AgentDef) => void;
   onAddToCanvas: (agent: AgentDef) => void;
}) {
   const [tab, setTab] = useState<ModalTab>("details");

   return (
      <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
         <DialogContent
            aria-describedby={undefined}
            className="w-[1100px] !max-w-[95vw] max-h-[85vh] bg-[#1c1c1c] border border-[#2a2a2a] p-0 gap-0 shadow-2xl flex flex-col"
         >
            <DialogTitle className="sr-only">{agent.label}</DialogTitle>

            {/* Header */}
            <div className="flex items-start gap-4 px-6 py-5 border-b border-[#2a2a2a] shrink-0">
               <div className="w-14 h-14 rounded-xl bg-[#252525] flex items-center justify-center shrink-0">
                  <Image src={agent.icon} alt={agent.label} width={38} height={38} className="object-contain" />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[18px] font-semibold text-sand leading-tight">{agent.label}</p>
                  <p className="text-[12px] text-sand/50 mt-0.5">by {agent.author}</p>
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
                        onClick={() => { onAddToCanvas(agent); onClose(); }}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium bg-orange text-white rounded-md hover:bg-orange/90 transition-colors cursor-pointer"
                     >
                        <Plus size={14} strokeWidth={2} />
                        Add to canvas
                     </button>
                  ) : (
                     <button
                        onClick={() => { onInstall(agent); onClose(); }}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium bg-orange text-white rounded-md hover:bg-orange/90 transition-colors cursor-pointer"
                     >
                        Install
                     </button>
                  )}
               </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#2a2a2a] px-6 shrink-0">
               {(["details", "features", "changelog"] as ModalTab[]).map((t) => (
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
               ))}
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
                              <Image src={agent.icon} alt={agent.label} width={52} height={52} className="object-contain" />
                           </div>
                           <p className="text-[20px] font-semibold text-sand">{agent.label}</p>
                        </div>

                        <div className="border-t border-[#2a2a2a] pt-5">
                           <p className="text-[14px] font-semibold text-sand mb-2">About</p>
                           <p className="text-[13px] text-sand/60 leading-relaxed">{agent.description}</p>
                        </div>

                        <div>
                           <p className="text-[14px] font-semibold text-sand mb-2">How it works</p>
                           <p className="text-[13px] text-sand/60 leading-relaxed">
                              This agent runs on the developer&apos;s own infrastructure. When triggered in your workflow,
                              Provance calls its API endpoint with the input payload and passes the structured response
                              to the next node in the graph.
                           </p>
                        </div>
                     </div>
                  )}

                  {tab === "features" && (
                     <ul className="flex flex-col gap-3">
                        {agent.features.map((f, i) => (
                           <li key={i} className="flex items-start gap-3 text-[13px] text-sand/70">
                              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                              {f}
                           </li>
                        ))}
                     </ul>
                  )}

                  {tab === "changelog" && (
                     <div className="flex flex-col gap-4">
                        <div className="border-l-2 border-orange pl-4">
                           <p className="text-[13px] font-semibold text-sand">v{agent.version} <span className="text-sand/30 font-normal ml-2">{agent.lastReleased}</span></p>
                           <p className="text-[12px] text-sand/50 mt-1">Latest release. Performance improvements and bug fixes.</p>
                        </div>
                        <div className="border-l-2 border-[#2a2a2a] pl-4">
                           <p className="text-[13px] font-semibold text-sand/50">Previous versions</p>
                           <p className="text-[12px] text-sand/30 mt-1">See the repository for full changelog history.</p>
                        </div>
                     </div>
                  )}
               </div>

               {/* Sidebar */}
               <div className="w-52 shrink-0 border-l border-[#2a2a2a] px-5 py-6 flex flex-col gap-6 overflow-y-auto">
                  <div>
                     <p className="text-[13px] font-semibold text-sand mb-3">Marketplace</p>
                     <div className="flex flex-col gap-2.5 text-[12px]">
                        <div>
                           <p className="text-sand/35 mb-0.5">Identifier</p>
                           <p className="text-sand/70 font-mono text-[11px] break-all">{agent.identifier}</p>
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
                     <p className="text-[13px] font-semibold text-sand mb-3">Categories</p>
                     <span className="inline-block text-[11px] text-sand/60 border border-[#333] rounded px-2 py-0.5">
                        {agent.category}
                     </span>
                  </div>

                  <div>
                     <p className="text-[13px] font-semibold text-sand mb-3">Resources</p>
                     <div className="flex flex-col gap-2">
                        {["Repository", "Issues", "License", "Marketplace"].map((r) => (
                           <button key={r} className="flex items-center gap-1.5 text-[12px] text-sand/50 hover:text-sand transition-colors cursor-pointer text-left">
                              <ExternalLink size={11} strokeWidth={1.5} className="shrink-0" />
                              {r}
                           </button>
                        ))}
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
   const [installedAgents, setInstalledAgents] = useState<AgentDef[]>(DEFAULT_INSTALLED);
   const [detailAgent, setDetailAgent] = useState<AgentDef | null>(null);
   const [installedOpen, setInstalledOpen] = useState(true);
   const [recommendedOpen, setRecommendedOpen] = useState(true);

   const installedIds = useMemo(() => new Set(installedAgents.map((a) => a.id)), [installedAgents]);

   const marketplaceAgents = useMemo(
      () => MARKETPLACE_AGENTS.filter((a) => !installedIds.has(a.id)),
      [installedIds],
   );

   const filterFn = (a: AgentDef) => {
      const q = search.toLowerCase();
      return (
         a.label.toLowerCase().includes(q) ||
         a.description.toLowerCase().includes(q) ||
         a.author.toLowerCase().includes(q)
      );
   };

   const filteredInstalled = installedAgents.filter(filterFn);
   const filteredRecommended = marketplaceAgents.filter(filterFn);

   const handleInstall = (agent: AgentDef) => {
      setInstalledAgents((prev) => [...prev, agent]);
   };

   const handleAddToCanvas = (agent: AgentDef) => {
      const newId = `${Date.now()}`;
      const source = sourceNodeId ? getNode(sourceNodeId) : null;

      addNodes([
         {
            id: newId,
            type: "agent" as const,
            position: source
               ? { x: source.position.x + 110, y: source.position.y }
               : { x: 0, y: 0 },
            data: { label: agent.label, icon: agent.icon },
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
         <Sheet open={isSheetOpen} onOpenChange={(o) => { if (!o) closeSheet(); }}>
            <SheetContent
               side="right"
               aria-describedby={undefined}
               className="w-80 bg-ink-dark border-sand/15 p-0 flex flex-col"
            >
               <SheetHeader className="px-4 pt-5 pb-3 border-b border-sand/10">
                  <SheetTitle className="text-sm text-sand font-semibold">Agents</SheetTitle>
               </SheetHeader>

               <div className="px-3 py-3 border-b border-sand/10">
                  <div className="flex items-center gap-2 bg-ink border border-sand/15 rounded px-3 py-2">
                     <Search size={12} strokeWidth={1.5} className="text-sand/40 shrink-0" />
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
                  {filteredInstalled.length > 0 && (
                     <>
                        <SectionHeader
                           label="Installed"
                           count={filteredInstalled.length}
                           open={installedOpen}
                           onToggle={() => setInstalledOpen((v) => !v)}
                        />
                        {installedOpen && filteredInstalled.map((a) => (
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

                  {filteredRecommended.length > 0 && (
                     <>
                        <SectionHeader
                           label="Recommended"
                           count={filteredRecommended.length}
                           open={recommendedOpen}
                           onToggle={() => setRecommendedOpen((v) => !v)}
                        />
                        {recommendedOpen && filteredRecommended.map((a) => (
                           <AgentRow
                              key={a.id}
                              agent={a}
                              installed={false}
                              onInstall={handleInstall}
                              onOpenDetail={setDetailAgent}
                              onAddToCanvas={handleAddToCanvas}
                           />
                        ))}
                     </>
                  )}

                  {filteredInstalled.length === 0 && filteredRecommended.length === 0 && (
                     <p className="text-xs text-sand/30 text-center py-10">No agents found</p>
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
