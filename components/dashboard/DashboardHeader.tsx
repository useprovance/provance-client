"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, User, Settings2, LogOut, Wallet } from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeaderDivider } from "@/components/common/dashboard/HeaderDivider";
import {
   OrgSelector,
   type Org,
} from "@/components/common/dashboard/OrgSelector";
import ProvanceLogo from "@/components/shared/ProvanceLogo";
import { useAuthStore } from "@/stores/useAuthStore";

const ORGS: Org[] = [
   { id: "personal", name: "Personal", type: "personal" },
];

export default function DashboardHeader() {
   const router = useRouter();
   const user = useAuthStore((s) => s.user);
   const clearUser = useAuthStore((s) => s.clearUser);
   const [selectedOrgId, setSelectedOrgId] = useState(ORGS[0].id);

   const orgs = user?.name
      ? [{ id: "personal", name: user.name, type: "personal" as const }, ...ORGS.slice(1)]
      : ORGS;

   const handleLogout = async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      clearUser();
      router.push("/");
   };

   return (
      <header className="flex h-12 shrink-0 items-center border-b border-sand-faint bg-ink-dark w-full px-3 gap-1">
         {/* Logo */}
         <Link href="/dashboard" className="flex items-center shrink-0 px-1">
            <ProvanceLogo className="h-10 w-auto text-sand" />
         </Link>

         <HeaderDivider />

         {/* Org selector */}
         <OrgSelector
            orgs={orgs}
            selectedId={selectedOrgId}
            onSelect={(o) => setSelectedOrgId(o.id)}
         />

         {/* Spacer */}
         <div className="flex-1" />

         {/* Search */}
         <button className="hidden md:flex h-7 items-center gap-2 rounded-full border border-sand-faint bg-transparent px-3 text-xs text-sand/40 hover:text-sand/70 transition-colors cursor-pointer">
            <Search size={12} strokeWidth={1.5} />
            <span>Search...</span>
            <kbd className="text-[10px] text-sand/25 border border-sand-faint rounded px-1">
               ⌘K
            </kbd>
         </button>

         {/* User dropdown */}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button className="flex size-8 items-center justify-center rounded-full bg-sand shrink-0 overflow-hidden hover:bg-sand-light transition-colors cursor-pointer">
                  <User size={18} strokeWidth={1.5} className="text-ink" />
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
               side="bottom"
               align="end"
               className="w-64 bg-[#1c1c1c] border border-[#2a2a2a] p-1 shadow-2xl"
            >
               {/* User info */}
               <div className="px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-sand leading-tight truncate">{user?.name ?? "—"}</p>
                  {user?.email && <p className="text-[11px] text-sand/40 truncate mt-0.5">{user.email}</p>}
                  {user?.wallet_address && (
                     <div className="flex items-center gap-1.5 mt-2 bg-[#252525] rounded-md px-2 py-1.5">
                        <Wallet size={12} strokeWidth={1} className="text-sand/40 shrink-0" />
                        <span className="text-[11px] text-sand/50 font-mono truncate">
                           {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                        </span>
                     </div>
                  )}
               </div>

               <DropdownMenuSeparator className="bg-[#2a2a2a]" />

<DropdownMenuItem asChild className="cursor-pointer px-3 py-2 text-[13px] text-sand/60 focus:text-sand focus:bg-[#252525] gap-3 [&_svg]:!size-[18px] [&_svg]:!text-current">
                  <Link href="/dashboard/settings">
                     <Settings2 strokeWidth={1} className="shrink-0" />
                     Settings
                  </Link>
               </DropdownMenuItem>

               <DropdownMenuSeparator className="bg-[#2a2a2a]" />

               <DropdownMenuItem
                  onSelect={handleLogout}
                  className="cursor-pointer px-3 py-2 text-[13px] text-sand/40 focus:text-red-400 focus:bg-red-400/8 gap-3 [&_svg]:!size-[18px] [&_svg]:!text-current"
               >
                  <LogOut strokeWidth={1} className="shrink-0" />
                  Sign out
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </header>
   );
}
