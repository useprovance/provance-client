import { useState } from 'react';
import { cn } from '@/lib/utils';

function imageSource(src?: string | null) {
  if (!src) return null;
  try {
    const url = new URL(src);
    // Provance's built-in agent icons ship with this client too.
    if (url.hostname === 'useprovance.xyz' && url.pathname.startsWith('/icons/agents/')) return url.pathname;
  } catch { /* Relative static asset paths are expected. */ }
  return src;
}

export function AgentAvatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const source = imageSource(src);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return <div aria-hidden="true" className={cn('size-10 shrink-0 flex items-center justify-center rounded-md bg-white/8 overflow-hidden text-sand font-semibold', className)}>
    {source && source !== failedSource
      ? <img src={source} alt="" width={40} height={40} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedSource(source)} className="w-full h-full object-contain p-1" />
      : <span>{(Array.from(name.trim())[0] ?? '?').toUpperCase()}</span>}
  </div>;
}
