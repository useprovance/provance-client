"use client";

import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

interface FormSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  touched?: boolean;
  className?: string;
  prefix?: ReactNode;
}

export function FormSelector({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  searchable = true,
  disabled = false,
  error,
  touched = false,
  className,
  prefix,
}: FormSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SelectOption | null>(null);
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const hasError = error && touched;

  useEffect(() => {
    setSelected(options.find((o) => o.value === value) ?? null);
  }, [value, options]);

  const handleSelect = (opt: SelectOption) => {
    setSelected(opt);
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[11px] font-mono uppercase tracking-widest text-white/40">
        {label}
        {required && <span className="text-orange ml-1">*</span>}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            id={id}
            role="button"
            aria-disabled={disabled}
            className={cn(
              "flex h-[42px] w-full items-center justify-between rounded-sm border bg-[#0c0c0c] text-[13px] transition-colors outline-none overflow-hidden cursor-pointer",
              hasError
                ? "border-red-500/60"
                : "border-[#2a2a2a] hover:border-white/20 focus:border-white/30 focus:ring-2 focus:ring-white/10",
              !value ? "text-white/20" : "text-white",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {prefix}
            <span className="flex-1 flex items-center gap-2 px-3 min-w-0">
              {selected?.icon && (
                <Image src={selected.icon} alt="" width={16} height={16} className="object-contain shrink-0 opacity-80" />
              )}
              {selected
                ? <span className="truncate">{selected.label}</span>
                : <span className="text-white/20">{placeholder}</span>}
            </span>
            <ChevronDown size={14} strokeWidth={1.5} className={cn("text-white/40 shrink-0 transition-transform mr-3", open && "rotate-180")} />
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#111] border border-[#2a2a2a] rounded-sm shadow-xl"
          align="start"
        >
          <Command className="bg-transparent">
            {searchable && (
              <div className="border-b border-[#2a2a2a]">
                <CommandInput
                  placeholder="Search..."
                  className="h-9 bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none border-0"
                />
              </div>
            )}
            <CommandList>
              <CommandEmpty className="py-4 text-center text-[12px] text-white/30">No options found.</CommandEmpty>
              <CommandGroup>
                <div className="max-h-52 overflow-y-auto">
                {options.map((opt) => {
                  const isSelected = selected?.value === opt.value;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => handleSelect(opt)}
                      className="flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-none border-b border-[#1a1a1a] last:border-0 text-[13px] text-white/60 hover:text-white aria-selected:bg-white/5 aria-selected:text-white"
                    >
                      <div className="flex items-center gap-2.5">
                        {opt.icon && (
                          <Image src={opt.icon} alt="" width={18} height={18} className="object-contain shrink-0 opacity-80" />
                        )}
                        <span className={cn(isSelected && "text-orange")}>{opt.label}</span>
                      </div>
                      <Check
                        size={13}
                        strokeWidth={2.5}
                        className={cn("text-orange shrink-0 ml-2", isSelected ? "opacity-100" : "opacity-0")}
                      />
                    </CommandItem>
                  );
                })}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {hasError && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
