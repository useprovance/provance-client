import { Link } from "react-router";
import { ArrowUpRight, MoreHorizontal, Trash2, Globe, Boxes } from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Workflow, WorkflowNode } from "@/services/workflow.service";

function NodeIcon({ node }: { node: WorkflowNode }) {
   if (!node.image_url) return null;
   return (
      <div className="w-10 h-10 rounded-md bg-[#222] border border-white/10 flex items-center justify-center overflow-hidden">
         <img src={node.image_url} alt={node.label} className="w-6 h-6 object-contain" />
      </div>
   );
}

export function WorkflowCard({ workflow, onDelete }: { workflow: Workflow; onDelete?: (id: string) => void }) {
   const nodes = workflow.canvas.nodes.filter(n => n.image_url).slice(0, 6);
   const hasNodes = nodes.length > 0;

   return (
      <div className="flex flex-col bg-[#1a1a1a] hover:bg-[#212121] border border-sand/15 transition-colors overflow-hidden group rounded-md">
         {/* Canvas preview */}
         <div className="relative h-52 overflow-hidden">
            <div
               className="absolute inset-0"
               style={{
                  backgroundImage: workflow.published
                     ? "radial-gradient(circle, rgba(0,0,0,0.2) 1px, transparent 1px)"
                     : "radial-gradient(circle, rgba(227,216,197,0.12) 1px, transparent 1px)",
                  backgroundSize: "6px 6px",
                  backgroundColor: workflow.published ? "#d95e28" : "#141414",
               }}
            />

            <div className="absolute top-2 right-2 z-10">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button className="w-7 h-7 rounded-full flex items-center justify-center bg-[#1a1a1a] border border-[#333] text-sand/60 hover:text-sand transition-colors cursor-pointer">
                        <MoreHorizontal size={13} strokeWidth={1.5} />
                     </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-[#1c1c1c] border border-[#2a2a2a] p-1">
                     <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[14px]">
                        <Link to={`/app/workflows/${workflow.id}`}>
                           <ArrowUpRight strokeWidth={1.5} />
                           Open editor
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="bg-white/6 my-1" />
                     <DropdownMenuItem
                        onClick={() => onDelete?.(workflow.id)}
                        className="cursor-pointer px-3 py-2 text-[13px] text-red-400/70 focus:text-red-400 focus:bg-red-400/8 gap-2.5 [&_svg]:!size-[14px]"
                     >
                        <Trash2 strokeWidth={1.5} />
                        Delete
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            {hasNodes ? (
               <Link to={`/app/workflows/${workflow.id}`} className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-4 px-6">
                     {nodes.map(node => (
                        <NodeIcon key={node.id} node={node} />
                     ))}
                  </div>
               </Link>
            ) : (
               <Link
                  to={`/app/workflows/${workflow.id}`}
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
            )}
         </div>

         {/* Details */}
         <div className="px-4 pt-4 pb-4 flex flex-col gap-3 border-t border-sand/8">
            <div className="min-h-[40px]">
               <p className="text-[16px] font-semibold text-sand leading-tight">{workflow.name}</p>
               <p className="text-[13px] text-sand/55 mt-1 line-clamp-2 leading-relaxed">{workflow.description}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-sand/8">
               <div className="flex items-center gap-2">
                  {workflow.published ? (
                     <>
                        <Globe size={13} strokeWidth={1.5} className="text-orange" />
                        <span className="text-[13px] font-medium text-orange">Published</span>
                     </>
                  ) : (
                     <>
                        <Boxes size={15} strokeWidth={1.5} className="text-sand/80" />
                        <span className="text-[14px] font-medium text-sand/80">
                           {workflow.canvas.nodes.length} nodes
                        </span>
                     </>
                  )}
               </div>
               <span className="text-[14px] font-mono text-sand/80">
                  {(workflow.runs ?? 0).toLocaleString()} runs
               </span>
            </div>
         </div>
      </div>
   );
}
