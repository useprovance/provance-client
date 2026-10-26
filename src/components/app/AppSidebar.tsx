import { Link, useLocation, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Bot, Wallet, Settings, LogOut, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";

const NAV = [
   {
      section: "WORKSPACE",
      items: [
         { label: "Workflows", icon: LayoutDashboard, to: "/app" },
         { label: "Agents", icon: Bot, to: "/app/agents" },
         { label: "Wallet", icon: Wallet, to: "/app/wallet" },
      ],
   },
];

function NavItem({ label, icon: Icon, to, active }: { label: string; icon: React.ElementType; to: string; active: boolean }) {
   return (
      <Link
         to={to}
         className={cn(
            "flex items-center w-full py-2.5 transition-colors",
            active ? "bg-white/8 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
         )}
      >
         <span className="w-12 flex items-center justify-center shrink-0">
            <Icon className="size-[20px]" />
         </span>
         <span className="text-[13px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pr-3">
            {label}
         </span>
      </Link>
   );
}

export default function AppSidebar() {
   const { pathname } = useLocation();
   const navigate = useNavigate();
   const queryClient = useQueryClient();

   async function handleLogout() {
      await authService.logout();
      queryClient.clear();
      navigate("/");
   }

   return (
      <aside className="group flex flex-col h-full bg-[#141414] border-r border-white/10 w-12 hover:w-56 transition-all duration-200 ease-in-out overflow-hidden shrink-0 z-40">
         <nav className="flex-1 pb-3 flex flex-col gap-1 overflow-hidden">
            {NAV.map(({ section, items }, i) => (
               <div key={section}>
                  {i > 0 && (
                     <div className="relative h-6 mb-1">
                        <hr className="absolute inset-x-3 top-1/2 border-white/10 opacity-100 group-hover:opacity-0 transition-opacity duration-200" />
                        <p className="absolute inset-x-0 top-0 pl-4 leading-6 text-[10px] font-semibold text-white/30 tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                           {section}
                        </p>
                     </div>
                  )}
                  {items.map(({ label, icon, to }) => (
                     <NavItem key={to} label={label} icon={icon} to={to} active={pathname === to} />
                  ))}
               </div>
            ))}
         </nav>

         <div className="pb-4 pt-3 flex flex-col gap-1">
            <NavItem label="Marketplace" icon={Store} to="/app/marketplace" active={pathname === "/app/marketplace"} />
            <NavItem label="Settings" icon={Settings} to="/app/settings" active={pathname === "/app/settings"} />
            <hr className="border-white/10 my-1" />
            <button
               onClick={handleLogout}
               className="flex items-center w-full py-2.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors"
            >
               <span className="w-12 flex items-center justify-center shrink-0">
                  <LogOut className="size-[20px]" />
               </span>
               <span className="text-[13px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pr-3">
                  Sign out
               </span>
            </button>
         </div>
      </aside>
   );
}
