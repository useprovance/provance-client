import { Trash2, MoreHorizontal } from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NodeToolbarProps {
   visible: boolean;
   onDelete: () => void;
   onMouseEnter?: () => void;
   onMouseLeave?: () => void;
}

export function NodeToolbar({ visible, onDelete, onMouseEnter, onMouseLeave }: NodeToolbarProps) {
   return (
      <div
         onMouseEnter={onMouseEnter}
         onMouseLeave={onMouseLeave}
         className={`nodrag absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-px bg-[hsl(0,0%,13%)] border border-white/10 rounded px-0.5 py-0.5 transition-opacity duration-150 ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
         <button
            onClick={onDelete}
            title="Delete"
            className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
         >
            <Trash2 size={9} strokeWidth={2} />
         </button>

         <div className="w-px h-2.5 bg-white/10 mx-0.5" />

         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button
                  title="More"
                  className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
               >
                  <MoreHorizontal size={10} strokeWidth={2} />
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
