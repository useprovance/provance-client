import { X, Trash2, ExternalLink, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Agent, ProvanceAction } from "@/services/agent.service";

const CHAIN_NAMES: Record<number, string> = {
   1: "Ethereum", 8453: "Base", 42220: "Celo", 137: "Polygon",
   10: "Optimism", 42161: "Arbitrum", 56: "BSC", 100: "Gnosis",
   2345: "GOAT",
};

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

interface AgentModalProps {
   agent: Agent;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onDelete: () => void;
}

export function AgentModal({ agent, open, onOpenChange, onDelete }: AgentModalProps) {
   const actions = extractActions(agent.services);
   const chainName = CHAIN_NAMES[agent.chain_id] ?? `Chain ${agent.chain_id}`;
   const webEndpoint = agent.services.web?.endpoint;

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[480px] max-h-[85vh] [&>button]:hidden overflow-hidden"
         >
            <DialogTitle className="sr-only">{agent.name}</DialogTitle>

            <div className="relative h-24 shrink-0">
               <div className="absolute inset-0" style={{ backgroundColor: "rgba(204,189,159,0.06)" }} />
               <div
                  className="absolute inset-0"
                  style={{
                     WebkitMaskImage: "url('/icons/dots.svg')",
                     WebkitMaskSize: "7px 7px",
                     maskImage: "url('/icons/dots.svg')",
                     maskSize: "7px 7px",
                     backgroundColor: "rgba(204,189,159,0.12)",
                  }}
               />
               <button
                  onClick={() => onOpenChange(false)}
                  className="absolute top-3 right-4 w-8 h-8 rounded-full bg-[#1a1a1a]/80 border border-[#333] flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer z-10"
               >
                  <X size={14} strokeWidth={2} />
               </button>
            </div>

            <div className="relative px-6 pb-0">
               <div className="absolute -top-7 left-6 w-14 h-14 bg-[#1a1a1a] border-2 border-[#141414] rounded-full flex items-center justify-center z-10 ring-1 ring-[#333] overflow-hidden">
                  {agent.image_url ? (
                     <img src={agent.image_url} alt={agent.name} className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-white/20 text-xl">◈</span>
                  )}
               </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="px-6 pt-10 pb-6 flex flex-col gap-5">
               <div>
                  <p className="text-[11px] text-white/30 mb-0.5 font-mono uppercase tracking-widest">{chainName}</p>
                  <p className="text-[22px] font-semibold text-white leading-tight font-manrope">{agent.name}</p>
                  {agent.description && (
                     <p className="text-[13px] text-white/40 mt-1.5 leading-relaxed">{agent.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                     <span className="flex items-center gap-1.5 text-[12px] font-medium text-white/60 px-2.5 py-1 bg-white/5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${agent.is_active ? "bg-emerald-400" : "bg-sand/30"}`} />
                        {agent.is_active ? "Active" : "Inactive"}
                     </span>
                     {agent.supported_protocols.map((p) => (
                        <span key={p} className="text-[10px] font-mono uppercase tracking-widest text-white/40 px-2.5 py-1 bg-white/5">
                           {p}
                        </span>
                     ))}
                  </div>
               </div>

               <div className="border-t border-white/8 pt-4">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-white/30 mb-1">Owner</p>
                  <p className="text-[12px] text-white/50 font-mono break-all">{agent.owner_address}</p>
               </div>

               {actions.length > 0 && (
                  <div className="flex flex-col gap-2">
                     <p className="text-[11px] font-mono uppercase tracking-widest text-white/30">Actions</p>
                     {actions.map((action) => (
                        <div key={action.key} className="flex items-center gap-3 px-3 py-2.5 bg-white/4 border border-white/6">
                           <div className="flex size-7 items-center justify-center bg-orange/10 shrink-0">
                              <Zap size={12} strokeWidth={1.5} className="text-orange" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-white font-medium leading-tight">{action.name}</p>
                              {action.description && (
                                 <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{action.description}</p>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {webEndpoint && (
                  <a
                     href={webEndpoint}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 text-[12px] text-white/30 hover:text-white/60 transition-colors"
                  >
                     <ExternalLink size={12} strokeWidth={1.5} />
                     <span className="truncate">{webEndpoint}</span>
                  </a>
               )}
            </div>
            </div>

            <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between shrink-0 bg-[#141414] z-10">
               <button
                  onClick={() => { onDelete(); onOpenChange(false); }}
                  className="flex items-center gap-2 text-[13px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
               >
                  <Trash2 size={14} strokeWidth={1.5} />
                  Remove agent
               </button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
