import { ChevronsUpDown } from "lucide-react";
import { Link } from "react-router";
import { forwardRef, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const HeaderDropdownTrigger = forwardRef<
   HTMLButtonElement,
   React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
   <button
      ref={ref}
      className={cn("flex items-center justify-center px-1.5 py-1 text-white/40 hover:text-white transition-colors cursor-pointer", className)}
      {...props}
   >
      <ChevronsUpDown size={14} strokeWidth={1.5} />
   </button>
));
HeaderDropdownTrigger.displayName = "HeaderDropdownTrigger";

interface HeaderDropdownWithPopoverProps {
   linkTo: string;
   linkContent: ReactNode;
   linkClassName?: string;
   commandContent: ReactNode;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   triggerButton?: ReactNode;
}

export function HeaderDropdownWithPopover({
   linkTo,
   linkContent,
   linkClassName = "flex items-center gap-2 shrink-0 text-sm",
   commandContent,
   open,
   onOpenChange,
   triggerButton,
}: HeaderDropdownWithPopoverProps) {
   return (
      <Popover open={open} onOpenChange={onOpenChange} modal={false}>
         <div className="flex items-center shrink-0">
            <Link to={linkTo} className={linkClassName}>
               {linkContent}
            </Link>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
         </div>
         <PopoverContent className="p-0 bg-[#141414] border border-white/10" side="bottom" align="start">
            {commandContent}
         </PopoverContent>
      </Popover>
   );
}
