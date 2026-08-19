"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
   LayoutDashboard,
   GitBranch,
   Bot,
   Store,
   KeyRound,
   Settings,
   PanelLeftDashed,
} from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuRadioGroup,
   DropdownMenuRadioItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const ICON_SIZE = 18;
const ICON_STROKE = 1.5;
const BEHAVIOR_KEY = "provance_sidebar_behaviour";
type Behaviour = "expandable" | "open" | "closed";

const topRoutes = [
   { key: "overview", label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
   { key: "workflows", label: "Workflows", icon: GitBranch, href: "/dashboard/workflows" },
   { key: "credentials", label: "Credentials", icon: KeyRound, href: "/dashboard/credentials" },
];
const middleRoutes = [
   { key: "agents", label: "My Agents", icon: Bot, href: "/dashboard/agents" },
];
const bottomRoutes = [
   { key: "marketplace", label: "Marketplace", icon: Store, href: "/dashboard/marketplace" },
   { key: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

function NavItem({
   route,
   isExpanded,
}: {
   route: { key: string; label: string; icon: React.ElementType; href: string };
   isExpanded: boolean;
}) {
   const pathname = usePathname();
   const isActive = pathname === route.href || (route.href !== "/dashboard" && pathname.startsWith(route.href));
   const Icon = route.icon;

   const inner = (
      <Link
         href={route.href}
         className={cn(
            "flex items-center gap-3 w-full py-2 rounded-md text-sm transition-colors",
            isExpanded ? "px-3" : "justify-center px-0",
            isActive
               ? "bg-sidebar-accent text-sidebar-foreground"
               : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
         )}
      >
         <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} className="shrink-0" />
         {isExpanded && <span className="truncate">{route.label}</span>}
      </Link>
   );

   if (isExpanded) return <li>{inner}</li>;

   return (
      <li>
         <Tooltip>
            <TooltipTrigger asChild>{inner}</TooltipTrigger>
            <TooltipContent side="right" className="bg-[#141414] text-white border border-white/10 [--tooltip-arrow-fill:#141414]">
               {route.label}
            </TooltipContent>
         </Tooltip>
      </li>
   );
}

export default function DashboardSidebar() {
   const [behaviour, setBehaviour] = useState<Behaviour>("expandable");
   const [hovered, setHovered] = useState(false);

   useEffect(() => {
      const stored = localStorage.getItem(BEHAVIOR_KEY) as Behaviour | null;
      if (stored) setBehaviour(stored);
   }, []);

   const handleBehaviourChange = (value: string) => {
      const b = value as Behaviour;
      setBehaviour(b);
      localStorage.setItem(BEHAVIOR_KEY, b);
   };

   const isExpanded = behaviour === "open" || (behaviour === "expandable" && hovered);
   const isOverlay = behaviour === "expandable";

   return (
      <div className={cn("relative shrink-0 h-full", behaviour === "open" ? "w-56" : "w-12")}>
         <aside
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
               "h-full flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden transition-[width] duration-200 ease-linear",
               isOverlay ? "absolute z-20 top-0 left-0" : "relative",
               isExpanded ? "w-56" : "w-12",
            )}
         >
            <div className="flex-1 overflow-y-auto py-2 px-1.5 flex flex-col gap-3">
               <ul className="flex flex-col gap-0.5 list-none">
                  {[...topRoutes, ...middleRoutes].map((r) => (
                     <NavItem key={r.key} route={r} isExpanded={isExpanded} />
                  ))}
               </ul>

               <ul className="flex flex-col gap-0.5 list-none mt-auto">
                  {bottomRoutes.map((r) => (
                     <NavItem key={r.key} route={r} isExpanded={isExpanded} />
                  ))}
               </ul>
            </div>

            {/* Footer */}
            <div className="px-1.5 py-2 border-t border-sidebar-border">
               <DropdownMenu>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                           <button
                              className="flex items-center justify-center w-9 h-9 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
                              aria-label="Sidebar control"
                           >
                              <PanelLeftDashed size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                           </button>
                        </DropdownMenuTrigger>
                     </TooltipTrigger>
                     <TooltipContent side="right" className="bg-[#141414] text-white border border-white/10 [--tooltip-arrow-fill:#141414]">
                        Sidebar control
                     </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent side="top" align="start" className="w-44">
                     <DropdownMenuLabel>Sidebar control</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     <DropdownMenuRadioGroup value={behaviour} onValueChange={handleBehaviourChange}>
                        <DropdownMenuRadioItem value="open" className="cursor-pointer">Expanded</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="closed" className="cursor-pointer">Collapsed</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="expandable" className="cursor-pointer">Expand on hover</DropdownMenuRadioItem>
                     </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </aside>
      </div>
   );
}
