import { useState } from "react";
import { Building2, Check, Plus } from "lucide-react";
import {
   Command,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@/components/ui/command";
import { HeaderDropdownTrigger, HeaderDropdownWithPopover } from "@/components/app/HeaderDropdown";

export interface Org {
   id: string;
   name: string;
}

interface OrgSelectorProps {
   orgs: Org[];
   selectedId: string;
   onSelect: (org: Org) => void;
}

export function OrgSelector({ orgs, selectedId, onSelect }: OrgSelectorProps) {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState("");

   const selected = orgs.find((o) => o.id === selectedId) ?? orgs[0];
   const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

   return (
      <HeaderDropdownWithPopover
         linkTo="/app"
         linkContent={
            <div className="flex items-center gap-2">
               <Building2 size={15} strokeWidth={1.5} className="text-white/70 shrink-0" />
               <span className="text-white font-medium max-w-32 lg:max-w-48 truncate text-sm">
                  {selected?.name ?? "My Workspace"}
               </span>
            </div>
         }
         linkClassName="flex items-center gap-2 shrink-0"
         open={open}
         onOpenChange={setOpen}
         triggerButton={
            <HeaderDropdownTrigger aria-label="Switch workspace" />
         }
         commandContent={
            <Command shouldFilter={false}>
               <CommandInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Find workspace..."
                  className="text-sm text-white"
               />
               <CommandList className="max-h-[300px]">
                  <CommandGroup>
                     {filtered.length === 0 && (
                        <p className="text-xs text-center text-white/40 py-3">No workspaces found</p>
                     )}
                     {filtered.map((org) => (
                        <CommandItem
                           key={org.id}
                           value={org.id}
                           className="cursor-pointer text-white/80 hover:text-white"
                           onSelect={() => { onSelect(org); setOpen(false); setSearch(""); }}
                        >
                           <div className="w-full flex items-center justify-between gap-3">
                              <p className="text-[13px] truncate">{org.name}</p>
                              {org.id === selectedId && <Check size={14} strokeWidth={2} className="text-white shrink-0" />}
                           </div>
                        </CommandItem>
                     ))}
                  </CommandGroup>
                  <div className="h-px bg-white/10 -mx-1 shrink-0" />
                  <CommandGroup>
                     <CommandItem className="cursor-pointer text-white/60 hover:text-white" onSelect={() => setOpen(false)}>
                        <div className="flex items-center gap-2">
                           <Plus size={14} strokeWidth={1.5} />
                           <span>New workspace</span>
                        </div>
                     </CommandItem>
                  </CommandGroup>
               </CommandList>
            </Command>
         }
      />
   );
}
