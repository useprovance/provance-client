import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CircleUser, LogOut, Search, Settings2 } from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeaderDivider } from "@/components/app/HeaderDivider";
import { OrgSelector, type Org } from "@/components/app/OrgSelector";
import ProvanceLogo from "@/components/shared/ProvanceLogo";
import { authService } from "@/services/auth.service";

export default function AppHeader() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();

   const { data: profile } = useQuery({
      queryKey: ["auth", "me"],
      queryFn: () => authService.me(),
      retry: false,
      staleTime: 1000 * 60 * 5,
   });

   const defaultOrg: Org = { id: "default", name: profile?.name ?? "My Workspace" };
   const [selectedOrgId, setSelectedOrgId] = useState("default");

   async function handleLogout() {
      await authService.logout();
      queryClient.clear();
      navigate("/");
   }

   return (
      <header className="flex h-12 shrink-0 items-center border-b border-white/10 bg-[#141414] w-full px-3 gap-1">
         <Link to="/app" className="flex items-center shrink-0 px-1">
            <ProvanceLogo className="h-10 w-auto text-white" />
         </Link>

         <HeaderDivider />

         <OrgSelector
            orgs={[defaultOrg]}
            selectedId={selectedOrgId}
            onSelect={(o) => setSelectedOrgId(o.id)}
         />

         <div className="flex-1" />

         <button className="hidden md:flex h-7 items-center gap-2 rounded-full border border-white/10 bg-transparent px-3 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer">
            <Search size={12} strokeWidth={1.5} />
            <span>Search...</span>
            <kbd className="text-[10px] text-white/25 border border-white/10 rounded px-1">⌘K</kbd>
         </button>

         <button className="flex size-8 items-center justify-center rounded-full border border-white/15 hover:border-white/30 hover:bg-white/8 transition-colors cursor-pointer text-white/60 hover:text-white mx-1">
            <Bell size={16} strokeWidth={2} />
         </button>

         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button className="flex size-8 items-center justify-center rounded-full bg-white shrink-0 overflow-hidden hover:bg-white/90 transition-colors cursor-pointer">
                  {profile?.avatar_url ? (
                     <img src={profile.avatar_url} alt={profile.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-[#141414] text-xs font-semibold">
                        {profile?.name?.charAt(0).toUpperCase() ?? "?"}
                     </span>
                  )}
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-64 bg-[#141414] border border-white/10 p-1 shadow-2xl">
               <div className="px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-white leading-tight truncate">
                     {profile?.name ?? "—"}
                  </p>
                  {profile?.email && (
                     <p className="text-[11px] text-white/50 truncate mt-0.5">{profile.email}</p>
                  )}
               </div>

               <DropdownMenuSeparator className="bg-white/10" />

               <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 text-[13px] text-white focus:text-white focus:bg-white/8 gap-3 [&_svg]:!size-[18px] [&_svg]:!text-current">
                  <Link to="/app/account">
                     <CircleUser strokeWidth={1} className="shrink-0" />
                     Account
                  </Link>
               </DropdownMenuItem>

               <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 text-[13px] text-white focus:text-white focus:bg-white/8 gap-3 [&_svg]:!size-[18px] [&_svg]:!text-current">
                  <Link to="/app/settings">
                     <Settings2 strokeWidth={1} className="shrink-0" />
                     Settings
                  </Link>
               </DropdownMenuItem>

               <DropdownMenuSeparator className="bg-white/10" />

               <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer px-3 py-2 text-[13px] text-white/60 focus:text-red-400 focus:bg-red-400/8 gap-3 [&_svg]:!size-[18px] [&_svg]:!text-current">
                  <LogOut strokeWidth={1} className="shrink-0" />
                  Sign out
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </header>
   );
}
