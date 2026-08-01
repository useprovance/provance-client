"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
   ArrowUpRight,
   MoreHorizontal,
   Pause,
   Play,
   Trash2,
} from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AgentStatus = "active" | "paused" | "idle";

export interface Agent {
   id: string;
   name: string;
   icon: string;
   status: AgentStatus;
   lastRun: string;
   runsToday: number;
   earned: string;
   workflow: string;
   author: string;
}


const STATUS: Record<AgentStatus, { label: string; dot: string }> = {
   active: { label: "Active", dot: "bg-emerald-400" },
   paused: { label: "Paused", dot: "bg-amber-400"   },
   idle:   { label: "Idle",   dot: "bg-sand/30"     },
};

export function AgentCard({ agent }: { agent: Agent }) {
   const [status, setStatus] = useState<AgentStatus>(agent.status);
   const s = STATUS[status];

   return (
      <div className="relative flex flex-col bg-[#141414] border border-[#222] hover:border-[#2e2e2e] transition-colors overflow-hidden">

         {/* Dot header */}
         <div className="relative h-16 shrink-0">
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
            {/* Menu — bottom right inside dot area */}
            <div className="absolute top-3 right-4 z-10">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button className="w-8 h-8 rounded-full bg-[#1a1a1a]/80 flex items-center justify-center text-sand/50 hover:text-sand/80 transition-colors cursor-pointer border border-[#333]">
                        <MoreHorizontal size={15} strokeWidth={1.5} />
                     </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-[#1c1c1c] border border-[#2a2a2a] p-1">
                     <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[14px] [&_svg]:!text-current">
                        <Link href={`/dashboard/agents/${agent.id}`}>
                           <ArrowUpRight strokeWidth={1.5} />
                           Open in editor
                        </Link>
                     </DropdownMenuItem>
                     {status === "active" ? (
                        <DropdownMenuItem onClick={() => setStatus("paused")} className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[14px] [&_svg]:!text-current">
                           <Pause strokeWidth={1.5} />
                           Pause
                        </DropdownMenuItem>
                     ) : (
                        <DropdownMenuItem onClick={() => setStatus("active")} className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[14px] [&_svg]:!text-current">
                           <Play strokeWidth={1.5} />
                           Resume
                        </DropdownMenuItem>
                     )}
                     <DropdownMenuSeparator className="bg-white/6 my-1" />
                     <DropdownMenuItem className="cursor-pointer px-3 py-2 text-[13px] text-red-400/70 focus:text-red-400 focus:bg-red-400/8 gap-2.5 [&_svg]:!size-[14px] [&_svg]:!text-current">
                        <Trash2 strokeWidth={1.5} />
                        Delete
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </div>

         {/* Icon — overlaps dot header bottom edge */}
         <div className="absolute top-[40px] left-5 w-12 h-12 bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-10">
            <Image src={agent.icon} alt={agent.name} width={24} height={24} className="object-contain" />
         </div>

         <div className="flex flex-col gap-4 p-5 pt-10 flex-1">

            {/* Author + name */}
            <div>
               <p className="text-[12px] text-sand/40 mb-0.5">{agent.author}</p>
               <p className="text-[20px] font-semibold text-sand leading-tight font-geist">{agent.name}</p>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
               <span className="flex items-center gap-1.5 text-[12px] font-medium text-sand/60 px-2.5 py-1 bg-white/5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                  {s.label}
               </span>
               <span className="text-[12px] font-medium text-sand/50 px-2.5 py-1 bg-white/5">
                  {agent.workflow}
               </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="flex items-center justify-between pt-5 border-t border-white/5">
               <div>
                  <p className="text-[15px] font-bold font-mono text-sand leading-none">{agent.earned}</p>
                  <p className="text-[11px] text-sand/35 mt-1">{agent.runsToday} runs · {agent.lastRun}</p>
               </div>
               <Link
                  href={`/dashboard/agents/${agent.id}`}
                  className="flex items-center gap-1.5 bg-sand hover:bg-sand-light text-ink-dark text-[13px] font-semibold px-6 py-2 transition-colors"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
               >
                  Open
                  <ArrowUpRight size={14} strokeWidth={2} />
               </Link>
            </div>
         </div>

      </div>
   );
}
