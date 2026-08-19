"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
   Check,
   GitFork,
   Plus,
   Search,
   User,
   Settings2,
   LogOut,
   CircleUser,
   Bell,
} from "lucide-react";
import { useWorkflowStore } from "@/stores/useWorkflowStore";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
   Command,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@/components/ui/command";
import { HeaderDivider } from "@/components/common/dashboard/HeaderDivider";
import {
   DashboardHeaderDropdownTriggerButton,
   DashboardHeaderDropdownWithPopover,
} from "@/components/common/dashboard/DashboardHeaderDropdown";
import {
   OrgSelector,
   type Org,
} from "@/components/common/dashboard/OrgSelector";
import ProvanceLogo from "@/components/shared/ProvanceLogo";
import { useAuthStore } from "@/stores/useAuthStore";

export default function DashboardHeader() {
   const router = useRouter();
   const pathname = usePathname();
   const user = useAuthStore((s) => s.user);
   const clearUser = useAuthStore((s) => s.clearUser);
   const [orgs, setOrgs] = useState<Org[]>([]);
   const [selectedOrgId, setSelectedOrgId] = useState<string>("");
   const [workflowOpen, setWorkflowOpen] = useState(false);
   const [workflowSearch, setWorkflowSearch] = useState("");

   useEffect(() => {
      fetch("/api/orgs")
         .then((r) => (r.ok ? r.json() : null))
         .then((data: { orgs: { id: string; name: string }[] } | null) => {
            if (!data?.orgs?.length) return;
            const mapped: Org[] = data.orgs.map((o) => ({
               id: o.id,
               name: o.name,
               type: "personal" as const,
            }));
            setOrgs(mapped);
            setSelectedOrgId(mapped[0].id);
         })
         .catch(() => null);
   }, []);

   const workflows = useWorkflowStore((s) => s.workflows);
   const isInEditor = /^\/dashboard\/workflows\/[^/]+$/.test(pathname ?? "");
   const currentWorkflowId = isInEditor
      ? (pathname ?? "").split("/").pop()
      : null;
   const currentWorkflow = workflows.find((w) => w.id === currentWorkflowId);

   const handleLogout = async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      clearUser();
      router.push("/");
   };

   return (
      <header className="flex h-12 shrink-0 items-center border-b border-white/10 bg-[#141414] w-full px-3 gap-1">
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

         {/* Workflow selector — only visible in editor */}
         {isInEditor && (
            <>
               <HeaderDivider />
               <DashboardHeaderDropdownWithPopover
                  linkHref={`/dashboard/workflows/${currentWorkflowId}`}
                  linkContent={
                     <div className="flex items-center gap-2">
                        <GitFork
                           size={15}
                           strokeWidth={1.5}
                           className="text-white/70 shrink-0"
                        />
                        <span
                           title={currentWorkflow?.name ?? "Untitled Workflow"}
                           className="text-white font-medium max-w-32 lg:max-w-48 truncate text-sm"
                        >
                           {currentWorkflow?.name ?? "Untitled Workflow"}
                        </span>
                     </div>
                  }
                  linkClassName="flex items-center gap-2 shrink-0"
                  open={workflowOpen}
                  onOpenChange={setWorkflowOpen}
                  triggerButton={
                     <DashboardHeaderDropdownTriggerButton
                        className="shrink-0"
                        aria-label="Switch workflow"
                     />
                  }
                  commandContent={
                     <Command shouldFilter={false}>
                        <CommandInput
                           value={workflowSearch}
                           onValueChange={setWorkflowSearch}
                           showResetIcon
                           handleReset={() => setWorkflowSearch("")}
                           placeholder="Find workflow..."
                           className="text-base sm:text-sm"
                        />
                        <CommandList className="max-h-none md:max-h-[300px] overflow-y-auto overflow-x-hidden">
                           <CommandGroup>
                              {workflows
                                 .filter((w) =>
                                    w.name
                                       .toLowerCase()
                                       .includes(workflowSearch.toLowerCase()),
                                 )
                                 .map((wf) => (
                                    <CommandItem
                                       key={wf.id}
                                       value={wf.id}
                                       className="cursor-pointer w-full"
                                       onSelect={() => {
                                          router.push(
                                             `/dashboard/workflows/${wf.id}`,
                                          );
                                          setWorkflowOpen(false);
                                          setWorkflowSearch("");
                                       }}
                                    >
                                       <div className="w-full flex items-center justify-between gap-3">
                                          <p className="text-[13px] truncate">
                                             {wf.name}
                                          </p>
                                          {wf.id === currentWorkflowId && (
                                             <Check
                                                size={14}
                                                strokeWidth={2}
                                                className="text-white shrink-0"
                                             />
                                          )}
                                       </div>
                                    </CommandItem>
                                 ))}
                           </CommandGroup>
                           <div className="h-px bg-border -mx-1 shrink-0" />
                           <CommandGroup>
                              <CommandItem
                                 className="cursor-pointer w-full"
                                 onSelect={() => setWorkflowOpen(false)}
                              >
                                 <div className="flex items-center gap-2">
                                    <Plus size={14} strokeWidth={1.5} />
                                    <span>New workflow</span>
                                 </div>
                              </CommandItem>
                           </CommandGroup>
                        </CommandList>
                     </Command>
                  }
               />
            </>
         )}

         {/* Spacer */}
         <div className="flex-1" />

         {/* Search */}
         <button className="hidden md:flex h-7 items-center gap-2 rounded-full border border-white/10 bg-transparent px-3 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer">
            <Search size={12} strokeWidth={1.5} />
            <span>Search...</span>
            <kbd className="text-[10px] text-white/25 border border-white/10 rounded px-1">
               ⌘K
            </kbd>
         </button>

         {/* Notifications */}

         <button className="flex size-8 items-center justify-center rounded-full border border-white/15 hover:border-white/30 hover:bg-white/8 transition-colors cursor-pointer text-white/60 hover:text-white mx-1">
            <Bell size={16} strokeWidth={2} />
         </button>

         {/* User dropdown */}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button className="flex size-8 items-center justify-center rounded-full bg-white shrink-0 overflow-hidden hover:bg-white/90 transition-colors cursor-pointer">
                  <User
                     size={18}
                     strokeWidth={1.5}
                     className="text-[#141414]"
                  />
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
               side="bottom"
               align="end"
               className="w-64 bg-[#141414] border border-white/10 p-1 shadow-2xl"
            >
               {/* User info */}
               <div className="px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-white leading-tight truncate">
                     {user?.name ?? "—"}
                  </p>
                  {user?.email && (
                     <p className="text-[11px] text-white/50 truncate mt-0.5">
                        {user.email}
                     </p>
                  )}
               </div>

               <DropdownMenuSeparator className="bg-white/10" />

               <DropdownMenuItem
                  asChild
                  className="cursor-pointer px-3 py-2 text-[13px] text-white focus:text-white focus:bg-white/8 gap-3 [&_svg]:!size-[18px] [&_svg]:!text-current"
               >
                  <Link href="/dashboard/account/me">
                     <CircleUser strokeWidth={1} className="shrink-0" />
                     Account
                  </Link>
               </DropdownMenuItem>

               <DropdownMenuItem
                  asChild
                  className="cursor-pointer px-3 py-2 text-[13px] text-white focus:text-white focus:bg-white/8 gap-3 [&_svg]:!size-[18px] [&_svg]:!text-current"
               >
                  <Link href="/dashboard/settings">
                     <Settings2 strokeWidth={1} className="shrink-0" />
                     Settings
                  </Link>
               </DropdownMenuItem>

               <DropdownMenuSeparator className="bg-white/10" />

               <DropdownMenuItem
                  onSelect={handleLogout}
                  className="cursor-pointer px-3 py-2 text-[13px] text-white/60 focus:text-red-400 focus:bg-red-400/8 gap-3 [&_svg]:!size-[18px] [&_svg]:!text-current"
               >
                  <LogOut strokeWidth={1} className="shrink-0" />
                  Sign out
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </header>
   );
}
