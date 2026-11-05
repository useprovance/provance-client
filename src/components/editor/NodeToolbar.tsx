import { Trash2, MoreHorizontal, Play } from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NodeToolbarProps {
   visible: boolean;
   onDelete: () => void;
   onRun?: () => void;
   runDisabled?: boolean;
   onMouseEnter?: () => void;
   onMouseLeave?: () => void;
}

export function NodeToolbar({ visible, onDelete, onRun, runDisabled, onMouseEnter, onMouseLeave }: NodeToolbarProps) {
   return (
      <div
         onClick={event=>event.stopPropagation()}
         onMouseEnter={onMouseEnter}
         onMouseLeave={onMouseLeave}
         className={`nodrag absolute -top-11 left-1/2 -translate-x-1/2 w-max flex items-center gap-0.5 bg-[hsl(0,0%,13%)] border border-white/10 rounded-md px-1 py-1 transition-opacity duration-150 focus-within:opacity-100 focus-within:pointer-events-auto ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
         {onRun&&<button type="button" onClick={onRun} disabled={runDisabled} className="h-7 flex items-center gap-1.5 whitespace-nowrap px-2 text-xs text-sand hover:bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-orange"><Play size={12}/>Run block</button>}
         <button
            onClick={onDelete}
            title="Delete"
            className="w-7 h-7 flex items-center justify-center rounded text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
         >
            <Trash2 size={12} strokeWidth={2} />
         </button>

         <div className="w-px h-4 bg-white/10 mx-0.5" />

         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button
                  title="More"
                  className="w-7 h-7 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
               >
                  <MoreHorizontal size={13} strokeWidth={2} />
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
               side="top"
               align="start"
               className="w-36 bg-[hsl(0,0%,13%)] border-white/10 text-white shadow-xl"
            >
               <DropdownMenuItem
                  onClick={onDelete}
                  className="text-sm text-red-400 focus:bg-white/8 focus:text-red-400 cursor-pointer py-2"
               >
                  Delete
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}
