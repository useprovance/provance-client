import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Plus } from "lucide-react";
import type { WorkflowNode } from "@/services/workflow.service";
import { useEditorStore } from "@/stores/editorStore";

const BOX_SIZE = 96;

export function AgentNode({ id, data, selected }: NodeProps<Node<WorkflowNode>>) {
   const openModal = useEditorStore((s) => s.openModal);

   return (
      <div className="relative" style={{ width: BOX_SIZE }}>
         <div
            style={{ width: BOX_SIZE, height: BOX_SIZE, borderWidth: "1.5px" }}
            className={`
               relative flex items-center justify-center rounded-md cursor-pointer
               bg-[hsl(0,0%,17%)] [background-clip:padding-box] transition-shadow
               border border-[oklch(100%_0_89.88_/_0.2)]
               ${selected ? "shadow-[0_0_0_6px_oklch(100%_0_89.88_/_0.4)]" : ""}
            `}
         >
            <Handle
               type="target"
               position={Position.Left}
               className="!w-4 !h-4 !bg-[hsl(0,0%,17%)] !border !border-[oklch(0.5_0_0)] !rounded-full !transition-[transform,background,border-width] !duration-200 hover:!scale-150 hover:!border-[1.5px] hover:!border-[oklch(88.53%_0_89.88)] hover:!bg-[hsl(0,0%,38%)]"
            />
            <Handle
               type="source"
               position={Position.Right}
               className="!w-4 !h-4 !bg-[hsl(0,0%,17%)] !border !border-[oklch(0.5_0_0)] !rounded-full !transition-[transform,background,border-width] !duration-200 hover:!scale-150 hover:!border-[1.5px] hover:!border-[oklch(88.53%_0_89.88)] hover:!bg-[hsl(0,0%,38%)] !z-20"
            />

            {data.image_url ? (
               <img src={data.image_url} alt={data.label} className="w-12 h-12 object-contain p-1.5 rounded-full" />
            ) : (
               <div className="w-12 h-12 rounded-sm bg-white/8 flex items-center justify-center">
                  <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest text-center leading-tight px-1">
                     {data.label?.slice(0, 4) ?? "?"}
                  </span>
               </div>
            )}
         </div>

         {/* + button on right edge */}
         <button
            onPointerDown={(e) => { e.stopPropagation(); openModal(id); }}
            className="nodrag absolute top-1/2 -translate-y-1/2 -right-8 w-6 h-6 rounded-full bg-[#2a2a2a] border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 hover:bg-[#333] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
         >
            <Plus size={12} strokeWidth={2} />
         </button>

         <div
            className="absolute pointer-events-none text-center"
            style={{ top: "100%", marginTop: 8, left: "50%", transform: "translateX(-50%)", minWidth: BOX_SIZE * 2 }}
         >
            <p
               className="text-[1rem] font-medium text-white text-center leading-[1.25] overflow-hidden"
               style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflowWrap: "anywhere" }}
            >
               {data.label ?? data.nodeId}
            </p>
            {data.action?.label && (
               <p className="text-[0.8125rem] font-normal text-white/45 text-center leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
                  {data.action.label}
               </p>
            )}
         </div>
      </div>
   );
}
