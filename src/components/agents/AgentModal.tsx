import { X, Pause, Play, Trash2, GitBranch, Clock, Zap, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Agent, AgentStatus } from "./AgentCard";

const STATUS: Record<AgentStatus, { label: string; dot: string }> = {
   active: { label: "Active", dot: "bg-emerald-400" },
   paused: { label: "Paused", dot: "bg-amber-400" },
   idle: { label: "Idle", dot: "bg-sand/30" },
};

interface AgentModalProps {
   agent: Agent;
   status: AgentStatus;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onPause: () => void;
   onResume: () => void;
   onDelete: () => void;
}

export function AgentModal({ agent, status, open, onOpenChange, onPause, onResume, onDelete }: AgentModalProps) {
   const s = STATUS[status];

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[480px] [&>button]:hidden overflow-hidden"
         >
            <DialogTitle className="sr-only">{agent.name}</DialogTitle>

            {/* Dot header with agent icon */}
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
               {/* Close button */}
               <button
                  onClick={() => onOpenChange(false)}
                  className="absolute top-3 right-4 w-8 h-8 rounded-full bg-[#1a1a1a]/80 border border-[#333] flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer z-10"
               >
                  <X size={14} strokeWidth={2} />
               </button>
            </div>

            {/* Agent icon overlapping header */}
            <div className="relative px-6 pb-0">
               <div className="absolute -top-7 left-6 w-14 h-14 bg-[#1a1a1a] border-2 border-[#141414] rounded-full flex items-center justify-center z-10 ring-1 ring-[#333]">
                  <img src={agent.icon} alt={agent.name} className="w-7 h-7 object-contain" />
               </div>
            </div>

            {/* Body */}
            <div className="px-6 pt-10 pb-6 flex flex-col gap-5">
               {/* Name + status */}
               <div>
                  <p className="text-[11px] text-white/30 mb-0.5">{agent.author}</p>
                  <p className="text-[22px] font-semibold text-white leading-tight font-manrope">{agent.name}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                     <span className="flex items-center gap-1.5 text-[12px] font-medium text-white/60 px-2.5 py-1 bg-white/5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                        {s.label}
                     </span>
                     <span className="flex items-center gap-1.5 text-[12px] text-white/50 px-2.5 py-1 bg-white/5">
                        <GitBranch size={12} strokeWidth={1.5} />
                        {agent.workflow}
                     </span>
                  </div>
               </div>

               {/* Stats */}
               <div className="grid grid-cols-3 gap-2">
                  {[
                     { icon: Zap, label: "Runs today", value: String(agent.runsToday) },
                     { icon: Clock, label: "Last run", value: agent.lastRun },
                     { icon: DollarSign, label: "Earned", value: agent.earned },
                  ].map(({ icon: Icon, label, value }) => (
                     <div key={label} className="flex flex-col gap-1.5 bg-white/4 border border-white/6 p-3 rounded-md">
                        <div className="flex items-center gap-1.5 text-white/30">
                           <Icon size={12} strokeWidth={1.5} />
                           <p className="text-[10px] uppercase tracking-widest font-mono">{label}</p>
                        </div>
                        <p className="text-[14px] font-semibold text-white font-manrope">{value}</p>
                     </div>
                  ))}
               </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between">
               <button
                  onClick={() => { onDelete(); onOpenChange(false); }}
                  className="flex items-center gap-2 text-[13px] text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
               >
                  <Trash2 size={14} strokeWidth={1.5} />
                  Delete
               </button>

               {status === "active" ? (
                  <button
                     onClick={onPause}
                     className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white text-[12px] font-medium px-5 py-2 transition-colors cursor-pointer"
                  >
                     <Pause size={13} strokeWidth={1.5} />
                     Pause agent
                  </button>
               ) : (
                  <button
                     onClick={onResume}
                     className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white text-[12px] font-medium px-5 py-2 transition-colors cursor-pointer"
                  >
                     <Play size={13} strokeWidth={1.5} />
                     Resume agent
                  </button>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
}
