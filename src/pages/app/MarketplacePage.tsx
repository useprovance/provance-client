import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { ServiceSourceFilter } from '@/components/agents/ServiceSourceFilter';
import { Search, Store, Loader2, ArrowRight } from 'lucide-react';
import { agentService, type Agent } from '@/services/agent.service';
import { extractActions } from '@/utils/agent.utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMasterkeyAvailability } from '@/services/masterkey.service';
import { masterkeyOperationStatus, masterkeyServiceStatus } from '@/utils/masterkey-availability';

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [visible, setVisible] = useState(36);
  const [selected, setSelected] = useState<Agent | null>(null);
  const availability = useMasterkeyAvailability();
  const catalog = useQuery({ queryKey: ['agents', 'explore'], queryFn: () => agentService.exploreAll(), retry: false });
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (catalog.data ?? []).filter(agent => {
      const masterkey = agent.id.startsWith('masterkey:');
      return (source === 'all' || (source === 'masterkey') === masterkey)
        && (!query || [agent.name, agent.description, ...agent.tags].join(' ').toLowerCase().includes(query));
    });
  }, [catalog.data, search, source]);
  const actions = selected ? extractActions(selected.services) : [];

  return <div className="h-full overflow-y-auto p-6 md:p-8 text-white">
    <div className="flex items-center gap-3"><div className="size-10 rounded-full bg-orange/15 flex items-center justify-center"><Store size={19} className="text-orange" /></div><h1 className="text-2xl font-semibold font-manrope">Marketplace</h1></div>
    <p className="mt-3 text-sm text-white/55 max-w-2xl">Discover agents and services for your workflows. Open a workflow and choose Add agent to configure a service.</p>
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-3 flex-1 min-w-48 max-w-lg rounded-full border border-white/15 bg-white/5 px-4 py-2.5"><Search size={17} className="text-white/40" /><span className="sr-only">Search marketplace</span><input value={search} onChange={e => { setSearch(e.target.value); setVisible(36); }} placeholder="Search services, agents or categories…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" /></label>
      <ServiceSourceFilter value={source} onChange={value => { setSource(value); setVisible(36); }} disabled={catalog.isPending} className="h-[42px] text-[13px]" />
      <Link to="/app/settings" className="text-sm text-sand underline">Service settings</Link>
    </div>
    <p className="mt-4 text-xs text-white/45">Masterkey listings are catalog entries. Execution requires an enabled, reviewed payment adapter and your spending approval.</p>
    {catalog.isPending && <p role="status" className="flex gap-2 items-center py-12 text-white/50 text-sm"><Loader2 size={17} className="animate-spin" />Loading services…</p>}
    {catalog.error && <div role="alert" className="mt-6 rounded-lg border border-white/15 bg-white/5 p-5"><p className="text-sm">Could not load the marketplace.</p><p className="text-xs text-white/55 mt-2">{catalog.error.message}</p><button onClick={() => void catalog.refetch()} disabled={catalog.isFetching} className="mt-4 text-sm text-sand underline disabled:opacity-40">Try again</button></div>}
    {catalog.data && <>
      <p role="status" className="mt-6 text-xs text-white/45">{filtered.length.toLocaleString()} results</p>
      {filtered.length === 0 ? <div className="my-6 border border-dashed border-white/15 rounded-lg p-12 text-center"><p className="text-sm text-white/60">No services match your search.</p><button className="mt-3 text-sand text-sm underline" onClick={() => { setSearch(''); setSource('all'); }}>Clear filters</button></div> : <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.slice(0, visible).map(agent => <article key={agent.id} className="flex flex-col border border-white/10 bg-[#1a1a1a] rounded-lg p-5">
          <div className="flex items-center gap-3"><AgentAvatar name={agent.name} src={agent.image_url} /><h2 className="text-sm font-semibold">{agent.name}</h2></div>
          <p className="mt-3 text-xs leading-relaxed text-white/55 line-clamp-3">{agent.description}</p>
          <p className="mt-4 text-[11px] text-white/65">{agent.id.startsWith('masterkey:') ? `Masterkey · ${masterkeyServiceStatus(agent.id, availability.data).label}` : 'Provance agent'}</p>
          <button onClick={() => setSelected(agent)} className="mt-4 flex items-center justify-between gap-2 text-xs text-sand text-left pt-3 border-t border-white/10">View actions<ArrowRight size={14} /></button>
        </article>)}
      </div>}
      {filtered.length > visible && <button onClick={() => setVisible(value => value + 36)} className="block mx-auto my-6 rounded border border-white/20 px-5 py-2 text-sm">Show more services</button>}
    </>}
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="bg-[#161616] text-white border-white/15 max-h-[85vh] overflow-y-auto">
      <DialogTitle>{selected?.name}</DialogTitle><DialogDescription className="text-white/55">{selected?.description}</DialogDescription>
      <div className="space-y-3">{actions.length ? actions.map(action => <div key={action.key} className="p-3 rounded border border-white/10"><h3 className="text-sm font-medium">{action.name}</h3>{selected?.id.startsWith('masterkey:') && <p className="mt-2 text-xs text-amber-200/90">{masterkeyOperationStatus(selected.id, action.key, availability.data).label} · {masterkeyOperationStatus(selected.id, action.key, availability.data).reason}</p>}<p className="mt-2 text-xs text-white/55 whitespace-pre-wrap break-words">{action.description?.slice(0, 800)}</p></div>) : <p className="text-sm text-white/50">No workflow actions are listed for this agent.</p>}</div>
      <p className="text-xs text-white/50">Add this service through a workflow’s Add agent menu. Availability and spending limits are checked before execution.</p>
      <Link to="/app" className="inline-flex justify-center bg-sand text-ink-dark rounded px-4 py-2 text-sm font-semibold">Open workflows</Link>
    </DialogContent></Dialog>
  </div>;
}
