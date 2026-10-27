import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { WorkflowNode } from "@/services/workflow.service";

const BOX_SIZE = 96;

export function TriggerNode({ data, selected }: NodeProps<Node<WorkflowNode>>) {
   return (
      <div className="relative" style={{ width: BOX_SIZE }}>
         <div
            style={{ width: BOX_SIZE, height: BOX_SIZE, borderRadius: "36px 8px 8px 36px", borderWidth: "1.5px" }}
            className={`
               relative flex items-center justify-center cursor-pointer
               bg-[hsl(0,0%,17%)] [background-clip:padding-box] transition-shadow
               border border-[oklch(100%_0_89.88_/_0.2)]
               ${selected ? "shadow-[0_0_0_6px_oklch(100%_0_89.88_/_0.4)]" : ""}
            `}
         >
            <Handle
               type="source"
               position={Position.Right}
               className="!w-4 !h-4 !bg-[hsl(0,0%,17%)] !border !border-[oklch(0.5_0_0)] !rounded-full !transition-[transform,background,border-width] !duration-200 hover:!scale-150 hover:!border-[1.5px] hover:!border-[oklch(88.53%_0_89.88)] hover:!bg-[hsl(0,0%,38%)]"
               style={{ zIndex: 10 }}
            />

            <div className="w-12 h-12 rounded-full bg-orange/20 flex items-center justify-center">
               <span className="text-[10px] font-mono text-orange uppercase tracking-widest">TRIG</span>
            </div>
         </div>

         {/* Label below */}
         <p
            className="absolute text-[1rem] font-medium text-white text-center leading-[1.25] pointer-events-none overflow-hidden"
            style={{
               top: "100%",
               marginTop: 8,
               left: "50%",
               transform: "translateX(-50%)",
               minWidth: BOX_SIZE * 2,
               display: "-webkit-box",
               WebkitBoxOrient: "vertical",
               WebkitLineClamp: 2,
            }}
         >
            {data.nodeId}
         </p>
      </div>
   );
}
