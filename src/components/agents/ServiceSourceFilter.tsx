import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const sources = [
  { value: 'all', label: 'All sources' },
  { value: 'provance', label: 'Provance agents' },
  { value: 'masterkey', label: 'Masterkey services' },
];

export function ServiceSourceFilter({ value, onChange, disabled, className }: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const selected = sources.find(source => source.value === value) ?? sources[0];
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" disabled={disabled} aria-label={`Service source: ${selected.label}`} className={cn('group inline-flex h-8 w-[184px] shrink-0 items-center justify-between gap-3 rounded-sm border border-white/15 bg-[#1c1c1c] px-3 text-[12px] text-white/85 outline-none hover:border-white/30 hover:bg-white/8 focus-visible:border-orange focus-visible:ring-1 focus-visible:ring-orange data-[state=open]:border-white/30 disabled:cursor-not-allowed disabled:opacity-50', className)}>
        <span className="truncate">{selected.label}</span>
        <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-white/60 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" sideOffset={6} className="w-[var(--radix-dropdown-menu-trigger-width)] border-white/15 bg-[#1c1c1c] text-white shadow-none motion-reduce:animate-none">
      <DropdownMenuRadioGroup value={value} onValueChange={onChange} aria-label="Service source">
        {sources.map(source => <DropdownMenuRadioItem key={source.value} value={source.value} className="cursor-pointer py-2 text-[12px] text-white/75 focus:bg-white/8 focus:text-white data-[state=checked]:text-sand">
          {source.label}
        </DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}
