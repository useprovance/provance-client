import { type NodeProps } from "@xyflow/react";
import { Plus, Sparkles } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

export function EmptyCanvasNode(_: NodeProps) {
   const openModal = useEditorStore((s) => s.openModal);

   return (
      <div
         className="flex items-center gap-8"
         onMouseDown={(e) => e.stopPropagation()}
      >
         <div className="flex flex-col items-center gap-3">
            <button
               onClick={() => openModal()}
               className="nodrag w-[100px] h-[100px] rounded-xl bg-white/[0.04] border-2 border-dashed border-white/15 flex items-center justify-center hover:bg-white/[0.08] hover:border-white/25 transition-colors cursor-pointer group"
            >
               <Plus size={36} strokeWidth={1.5} className="text-white/30 group-hover:text-white/55 transition-colors" />
            </button>
            <p className="text-[13px] font-medium text-white/35 whitespace-nowrap">Add first step</p>
         </div>

         <p className="text-[13px] text-white/20 mb-6">or</p>

         <div className="flex flex-col items-center gap-3">
            <button className="nodrag w-[100px] h-[100px] rounded-xl bg-white/[0.04] border-2 border-dashed border-white/15 flex items-center justify-center hover:bg-white/[0.08] hover:border-white/25 transition-colors cursor-pointer group">
               <Sparkles size={36} strokeWidth={1.5} className="text-white/30 group-hover:text-white/55 transition-colors" />
            </button>
            <p className="text-[13px] font-medium text-white/35 whitespace-nowrap">Build with AI</p>
         </div>
      </div>
   );
}
