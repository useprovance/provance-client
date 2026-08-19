import { cn } from "@/lib/utils";

export function HeaderDivider({
   className,
   ...props
}: React.HTMLProps<HTMLSpanElement>) {
   return (
      <span className={cn("text-white/20", className)} {...props}>
         <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            shapeRendering="geometricPrecision"
            aria-hidden={true}
         >
            <path d="M16 3.549L7.12 20.600" />
         </svg>
      </span>
   );
}
