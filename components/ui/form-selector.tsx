"use client";

import { useState, useEffect } from "react";
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
}

export function FormSelector({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  searchable = false,
  disabled = false,
  error,
  touched = false,
  className,
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
      <label htmlFor={id} className="text-[11px] font-mono uppercase tracking-widest text-sand/40">
        {label}
        {required && <span className="text-orange ml-1">*</span>}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-[42px] w-full items-center justify-between rounded-sm border bg-[#0c0c0c] px-3 text-[13px] transition-colors outline-none",
              hasError
                ? "border-red-500/60"
                : "border-[#2a2a2a] hover:border-sand/20 focus:border-sand/30 focus:ring-2 focus:ring-sand/10",
              !value ? "text-sand/20" : "text-sand",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="truncate">{selected ? selected.label : placeholder}</span>
            <ChevronDown size={14} strokeWidth={1.5} className={cn("text-sand/40 shrink-0 transition-transform", open && "rotate-180")} />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#111] border border-[#2a2a2a] rounded-sm shadow-xl"
          align="start"
        >
          <Command className="bg-transparent">
            {searchable && (
              <div className="border-b border-[#2a2a2a] px-3">
                <CommandInput
                  placeholder="Search..."
                  className="h-9 bg-transparent text-[13px] text-sand placeholder:text-sand/30 outline-none border-0"
                />
              </div>
            )}
            <CommandList>
              <CommandEmpty className="py-4 text-center text-[12px] text-sand/30">No options found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected = selected?.value === opt.value;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => handleSelect(opt)}
                      className="flex items-center justify-between px-3 py-2.5 cursor-pointer rounded-none border-b border-[#1a1a1a] last:border-0 text-[13px] text-sand/60 hover:text-sand aria-selected:bg-white/5 aria-selected:text-sand"
                    >
                      <div className="flex flex-col">
                        <span className={cn(isSelected && "text-orange")}>{opt.label}</span>
                        {opt.description && (
                          <span className="text-[11px] text-sand/30 mt-0.5">{opt.description}</span>
                        )}
                      </div>
                      <Check
                        size={13}
                        strokeWidth={2.5}
                        className={cn("text-orange shrink-0 ml-2", isSelected ? "opacity-100" : "opacity-0")}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {hasError && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
