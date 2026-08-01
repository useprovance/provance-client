"use client";

import { Building2, Check, Plus } from "lucide-react";
import { useState } from "react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DashboardHeaderDropdownTriggerButton,
  DashboardHeaderDropdownWithPopover,
} from "@/components/common/dashboard/DashboardHeaderDropdown";

export interface Org {
  id: string;
  name: string;
  type: "personal" | "team";
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
  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  const commandContent = (
    <Command shouldFilter={false}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        showResetIcon
        handleReset={() => setSearch("")}
        placeholder="Find organisation..."
        className="text-base sm:text-sm"
      />
      <CommandList className="max-h-none md:max-h-[300px] overflow-y-auto overflow-x-hidden">
        <CommandGroup>
          {filtered.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-3">
              No organisations found
            </p>
          )}
          {filtered.map((org) => (
            <CommandItem
              key={org.id}
              value={org.id}
              className="cursor-pointer w-full"
              onSelect={() => {
                onSelect(org);
                setOpen(false);
                setSearch("");
              }}
            >
              <div className="w-full flex items-center justify-between gap-3">
                <p className="text-[13px] truncate">{org.name}</p>
                {org.id === selectedId && (
                  <Check size={14} strokeWidth={2} className="text-white shrink-0" />
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <div className="h-px bg-border -mx-1 shrink-0" />
        <CommandGroup>
          <CommandItem
            className="cursor-pointer w-full"
            onSelect={() => setOpen(false)}
          >
            <div className="flex items-center gap-2">
              <Plus size={14} strokeWidth={1.5} />
              <span>New organisation</span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );

  return (
    <DashboardHeaderDropdownWithPopover
      linkHref="/dashboard"
      linkContent={
        <div className="flex items-center gap-2">
          <Building2 size={15} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
          <span
            title={selected?.name}
            className="text-sand font-medium max-w-32 lg:max-w-48 truncate text-sm"
          >
            {selected?.name}
          </span>
        </div>
      }
      linkClassName="flex items-center gap-2 shrink-0"
      commandContent={commandContent}
      open={open}
      onOpenChange={setOpen}
      triggerButton={
        <DashboardHeaderDropdownTriggerButton
          className="shrink-0"
          aria-label="Switch organisation"
        />
      }
    />
  );
}
