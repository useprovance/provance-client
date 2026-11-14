import { Link, useLocation, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Bot, Wallet, KeyRound, Bell, Search, LogOut, CircleUser, Settings2, SquarePen, MessageCircle } from "lucide-react";
import { chatService } from "@/services/chat.service";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import ProvanceLogo from "@/components/shared/ProvanceLogo";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
   { label: "Workflows", icon: GitBranch, to: "/app" },
   { label: "Agents", icon: Bot, to: "/app/agents" },
   { label: "Credentials", icon: KeyRound, to: "/app/credentials" },
];

function NavItem({ label, icon: Icon, to, active }: { label: string; icon: React.ElementType; to: string; active: boolean }) {
   return (
      <Link
         to={to}
         className={cn(
            "flex items-center w-full py-2 rounded-md transition-colors",
            active ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/8 hover:text-white"
         )}
      >
         <span className="w-12 shrink-0 flex items-center justify-center">
            <Icon size={20} strokeWidth={1.5} />
         </span>
         <span className="text-[14px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pr-3">
            {label}
         </span>
      </Link>
   );
}

export default function AppSidebar() {
   const { pathname } = useLocation();
   const navigate = useNavigate();
   const queryClient = useQueryClient();

   const { data: chats = [] } = useQuery({
      queryKey: ["chats"],
      queryFn: () => chatService.list(),
      staleTime: 30_000,
   });

   const { data: profile } = useQuery({
      queryKey: ["auth", "me"],
      queryFn: () => authService.me(),
      retry: false,
      staleTime: 1000 * 60 * 5,
   });

   async function handleLogout() {
      await authService.logout();
      queryClient.clear();
      navigate("/");
   }

   return (
      <aside className="group flex flex-col h-full bg-[#0f0f0f] border-r border-white/8 w-16 hover:w-56 transition-all duration-200 ease-in-out overflow-hidden shrink-0 z-40">

         {/* Logo */}
         <Link to="/app" className="flex items-center h-12 shrink-0 pl-[10px] group-hover:pl-4 transition-all duration-200">
            <ProvanceLogo className="text-white shrink-0" style={{ height: '22px', width: '44px' }} />
         </Link>

         <div className="h-px bg-white/8" />

         {/* Search */}
         <div className="px-2 pt-2 pb-1">
            <button className="flex items-center w-full py-2 rounded-md text-white/85 hover:bg-white/8 hover:text-white transition-colors cursor-pointer">
               <span className="w-12 shrink-0 flex items-center justify-center">
                  <Search size={20} strokeWidth={1.5} />
               </span>
               <span className="text-[14px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pr-3 flex items-center gap-2">
                  Search...
                  <kbd className="text-[10px] text-white/25 border border-white/10 rounded px-1 ml-auto">⌘K</kbd>
               </span>
            </button>
         </div>

         {/* New Chat */}
         <div className="px-2 pb-1">
            <Link
               to="/app/chat"
               className="flex items-center w-full py-2 rounded-md text-white/85 hover:bg-white/8 hover:text-white transition-colors"
            >
               <span className="w-12 shrink-0 flex items-center justify-center">
                  <SquarePen size={20} strokeWidth={1.5} />
               </span>
               <span className="text-[14px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pr-3">
                  New Chat
               </span>
            </Link>
         </div>

         <div className="h-px bg-white/8 mb-1" />

         {/* Nav */}
         <nav className="flex-1 flex flex-col gap-0.5 overflow-hidden px-2 pt-1">
            {NAV.map(({ label, icon, to }) => (
               <NavItem key={to} label={label} icon={icon} to={to} active={
                  to === "/app"
                     ? pathname === "/app" || pathname.startsWith("/app/workflows")
                     : pathname.startsWith(to)
               } />
            ))}

            {/* Chat history — only visible when expanded */}
            {chats.length > 0 && (
               <div className="max-h-0 opacity-0 pointer-events-none group-hover:max-h-52 group-hover:opacity-100 group-hover:pointer-events-auto overflow-hidden transition-all duration-200 flex flex-col gap-0.5">
                  <div className="py-1.5 pl-3">
                     <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30 whitespace-nowrap">
                        Recent
                     </span>
                  </div>
                  {chats.map(chat => (
                     <Link
                        key={chat.id}
                        to={`/app/chat/${chat.id}`}
                        className={cn(
                           "flex items-center w-full py-2 rounded-md transition-colors",
                           pathname === `/app/chat/${chat.id}`
                              ? "bg-white/10 text-white"
                              : "text-white/85 hover:bg-white/8 hover:text-white"
                        )}
                     >
                        <span className="w-12 shrink-0 flex items-center justify-center">
                           <MessageCircle size={20} strokeWidth={1.5} />
                        </span>
                        <span className="text-[14px] font-medium whitespace-nowrap pr-3 truncate max-w-[140px]">
                           {chat.title}
                        </span>
                     </Link>
                  ))}
               </div>
            )}
         </nav>

         {/* Bottom */}
         <div className="flex flex-col gap-0.5 px-2 pt-1 pb-2">
            <NavItem label="Wallet" icon={Wallet} to="/app/wallet" active={pathname === "/app/wallet"} />

            <button className="flex items-center w-full py-2 rounded-md text-white/85 hover:bg-white/8 hover:text-white transition-colors cursor-pointer">
               <span className="w-12 shrink-0 flex items-center justify-center">
                  <Bell size={20} strokeWidth={1.5} />
               </span>
               <span className="text-[14px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pr-3">
                  Notifications
               </span>
            </button>

            <div className="h-px bg-white/8 my-0.5" />

            {/* Profile */}
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <button className="flex items-center w-full py-1.5 rounded-md text-white/85 hover:bg-white/8 hover:text-white transition-colors cursor-pointer">
                     <span className="w-12 shrink-0 flex items-center justify-center">
                        <div className="size-8 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0">
                           {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt={profile.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                           ) : (
                              <span className="text-[#141414] text-xs font-semibold">
                                 {profile?.name?.charAt(0).toUpperCase() ?? "?"}
                              </span>
                           )}
                        </div>
                     </span>
                     <span className="text-[14px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pr-3 truncate">
                        {profile?.name ?? "Account"}
                     </span>
                  </button>
               </DropdownMenuTrigger>
               <DropdownMenuContent side="right" align="end" className="w-64 bg-[#141414] border border-white/10 p-1 shadow-2xl mb-2">
                  <div className="px-3 py-2.5">
                     <p className="text-[13px] font-semibold text-white leading-tight truncate">{profile?.name ?? "—"}</p>
                     {profile?.email && <p className="text-[11px] text-white/50 truncate mt-0.5">{profile.email}</p>}
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 text-[13px] text-white focus:text-white focus:bg-white/8 gap-3 [&_svg]:!size-[18px]">
                     <Link to="/app/account"><CircleUser strokeWidth={1} />Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 text-[13px] text-white focus:text-white focus:bg-white/8 gap-3 [&_svg]:!size-[18px]">
                     <Link to="/app/settings"><Settings2 strokeWidth={1} />Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer px-3 py-2 text-[13px] text-white/60 focus:text-red-400 focus:bg-red-400/8 gap-3 [&_svg]:!size-[18px]">
                     <LogOut strokeWidth={1} />Sign out
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </aside>
   );
}
