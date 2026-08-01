"use client";

import Link from "next/link";
import {
   ArrowUpRight,
   MoreHorizontal,
   Trash2,
   Globe,
   EyeOff,
} from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Workflow {
   id: string;
   name: string;
   description: string;
   published: boolean;
   nodeCount: number;
   lastRun: string | null;
   runs: number;
}

export function WorkflowCard({ workflow }: { workflow: Workflow }) {
   return (
      <div className="flex flex-col bg-[#0f0f0f] border border-sand/15 hover:border-sand/25 transition-colors overflow-hidden group">
         {/* Canvas preview */}
         <div className="relative h-40 overflow-hidden">
            <div
               className="absolute inset-0"
               style={{
                  backgroundImage: workflow.published
                     ? "radial-gradient(circle, rgba(0,0,0,0.35) 2px, transparent 2px)"
                     : "radial-gradient(circle, rgba(227,216,197,0.25) 2px, transparent 2px)",
                  backgroundSize: "9px 9px",
                  backgroundColor: workflow.published ? "#d95e28" : "#0a0a0a",
               }}
            />
            {/* Menu */}
            <div className="absolute top-2 right-2 z-10">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button className="w-7 h-7 flex items-center justify-center bg-[#111]/80 border border-sand/10 text-sand/40 hover:text-sand/70 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                        <MoreHorizontal size={14} strokeWidth={1.5} />
                     </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                     align="end"
                     className="w-44 bg-[#1c1c1c] border border-[#2a2a2a] p-1"
                  >
                     <DropdownMenuItem
                        asChild
                        className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[14px]"
                     >
                        <Link href={`/dashboard/workflows/${workflow.id}`}>
                           <ArrowUpRight strokeWidth={1.5} />
                           Open editor
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="bg-white/6 my-1" />
                     <DropdownMenuItem className="cursor-pointer px-3 py-2 text-[13px] text-red-400/70 focus:text-red-400 focus:bg-red-400/8 gap-2.5 [&_svg]:!size-[14px]">
                        <Trash2 strokeWidth={1.5} />
                        Delete
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
            {/* Open on hover */}
            <Link
               href={`/dashboard/workflows/${workflow.id}`}
               className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
               <span
                  className="flex items-center gap-1.5 bg-sand text-ink-dark text-[12px] font-bold px-5 py-2"
                  style={{
                     clipPath:
                        "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                  }}
               >
                  Open
                  <ArrowUpRight size={13} strokeWidth={2} />
               </span>
            </Link>
         </div>

         {/* Name + description */}
         <div className="px-4 py-3 border-t border-sand/8">
            <p className="text-[15px] font-semibold text-sand truncate">
               {workflow.name}
            </p>
            <p className="text-[13px] text-sand/50 mt-1 truncate">
               {workflow.description}
            </p>
         </div>

         {/* Stats bar */}
         <div className="flex items-center gap-3 px-4 py-2.5 border-t border-sand/8">
            <span className="text-[11px] font-mono text-sand/30">
               {workflow.nodeCount} nodes
            </span>
            <span className="text-[11px] font-mono text-sand/20">·</span>
            <span className="text-[11px] font-mono text-sand/30">
               {workflow.runs.toLocaleString()} runs
            </span>
            <div className="ml-auto flex items-center gap-1.5">
               {workflow.published ? (
                  <Globe size={11} strokeWidth={1.5} className="text-orange" />
               ) : (
                  <EyeOff
                     size={11}
                     strokeWidth={1.5}
                     className="text-sand/25"
                  />
               )}
               <span
                  className={`text-[11px] font-mono ${workflow.published ? "text-orange" : "text-sand/25"}`}
               >
                  {workflow.published ? "Published" : "Unpublished"}
               </span>
            </div>
         </div>
      </div>
   );
}
