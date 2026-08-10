"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
   ArrowUpRight,
   MoreHorizontal,
   Trash2,
   Globe,
   EyeOff,
} from "lucide-react";
import type { Workflow } from "@/stores/useWorkflowStore";
import { useWorkflowStore } from "@/stores/useWorkflowStore";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type { Workflow };

export function WorkflowCard({ workflow }: { workflow: Workflow }) {
   const router = useRouter();
   const remove = useWorkflowStore((s) => s.remove);

   const handleDelete = () => {
      void remove(workflow.id);
      if (window.location.pathname.includes(workflow.id)) {
         router.push("/dashboard/workflows");
      }
   };
   return (
      <div className="flex flex-col bg-[#0f0f0f] border border-sand/15 hover:border-sand/25 transition-colors overflow-hidden group">
         {/* Canvas preview */}
         <div className="relative h-40 overflow-hidden">
            <div
               className="absolute inset-0"
               style={{
                  backgroundImage: workflow.published
                     ? "radial-gradient(circle, rgba(0,0,0,0.4) 1px, transparent 1px)"
                     : "radial-gradient(circle, rgba(227,216,197,0.3) 1px, transparent 1px)",
                  backgroundSize: "6px 6px",
                  backgroundColor: workflow.published ? "#d95e28" : "#0a0a0a",
               }}
            />
            {/* Menu — top right, always visible */}
            <div className="absolute top-2 right-2 z-10">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button className="w-7 h-7 rounded-full flex items-center justify-center bg-[#1a1a1a] border border-[#333] text-sand/60 hover:text-sand transition-colors cursor-pointer">
                        <MoreHorizontal size={13} strokeWidth={1.5} />
                     </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-[#1c1c1c] border border-[#2a2a2a] p-1">
                     <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[14px]">
                        <Link href={`/dashboard/workflows/${workflow.id}`}>
                           <ArrowUpRight strokeWidth={1.5} />
                           Open editor
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="bg-white/6 my-1" />
                     <DropdownMenuItem
                        onClick={handleDelete}
                        className="cursor-pointer px-3 py-2 text-[13px] text-red-400/70 focus:text-red-400 focus:bg-red-400/8 gap-2.5 [&_svg]:!size-[14px]"
                     >
                        <Trash2 strokeWidth={1.5} />
                        Delete
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            {/* Open — always visible, center of canvas */}
            <Link
               href={`/dashboard/workflows/${workflow.id}`}
               className="absolute inset-0 flex items-center justify-center"
            >
               <span
                  className="flex items-center gap-1.5 bg-sand text-ink-dark text-[12px] font-bold px-5 py-2 border-2 border-ink/20"
                  style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
               >
                  Open
                  <ArrowUpRight size={13} strokeWidth={2} />
               </span>
            </Link>
         </div>

         {/* Details */}
         <div className="px-4 pt-4 pb-4 flex flex-col gap-3 border-t border-sand/8">
            <div className="min-h-[56px]">
               <p className="text-[15px] font-semibold text-sand leading-tight">
                  {workflow.name}
               </p>
               <p className="text-[12px] text-sand/55 mt-1 line-clamp-2 leading-relaxed">
                  {workflow.description}
               </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-sand/8">
               <div className="flex items-center gap-1.5">
                  {workflow.published ? (
                     <Globe size={11} strokeWidth={1.5} className="text-orange" />
                  ) : (
                     <EyeOff size={11} strokeWidth={1.5} className="text-sand/60" />
                  )}
                  <span className={`text-[12px] font-medium ${workflow.published ? "text-orange" : "text-sand/60"}`}>
                     {workflow.published ? "Published" : "Unpublished"}
                  </span>
               </div>
               <span className="text-[12px] font-mono text-sand/60">{workflow.runs.toLocaleString()} runs</span>
            </div>
         </div>
      </div>
   );
}
