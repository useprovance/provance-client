import {CreditsPanel} from '@/components/editor/CreditsPanel';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { budgetService, validFee } from '@/services/budget.service';

export default function ExecutionSettingsPage(){
  const cache=useQueryClient();
  const budget=useQuery({queryKey:['execution-budget'],queryFn:()=>budgetService.get(),refetchInterval:5000,retry:false});
  const masterkey=useQuery({queryKey:['masterkey-status'],queryFn:()=>budgetService.masterkey(),retry:false});
  const [enabled,setEnabled]=useState(true),[limit,setLimit]=useState('0'),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{if(budget.data){setEnabled(budget.data.dailyEnabled);setLimit(budget.data.dailyLimit);}},[budget.data?.dailyEnabled,budget.data?.dailyLimit]);
  async function save(){
    if(!validFee(limit)){setMessage('Enter a non-negative USD amount with up to 6 decimal places.');return;}
    setSaving(true);setMessage('');
    try{await budgetService.save(enabled,limit);await cache.invalidateQueries({queryKey:['execution-budget']});setMessage('Budget saved.');}
    catch(error){setMessage(error instanceof Error?error.message:'Could not save budget');}finally{setSaving(false);}
  }
  return <div className="p-8 overflow-y-auto h-full text-white"><div className="max-w-2xl space-y-8">
    <div><h1 className="text-2xl font-semibold">Execution settings</h1><p className="text-sm text-white/60 mt-2">Control agent execution fees across all your workflows. Trade amounts, gas and separately billed API usage are outside these limits.</p></div>
    <section className="border border-white/10 rounded-lg p-5 space-y-4 bg-[#161616]">
      <h2 className="font-semibold">Daily account budget</h2>
      {budget.error&&<p role="alert" className="text-sm text-red-300">{budget.error.message}</p>}
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Enable daily limit</label>
      <label className="block text-sm">Maximum daily fees (USD)<input className="block mt-2 w-full bg-black/20 border border-white/20 rounded px-3 py-2" inputMode="decimal" value={limit} onChange={e=>setLimit(e.target.value)} disabled={!enabled}/></label>
      <p className="text-xs text-white/60">Zero blocks paid calls. If the daily limit is disabled, each run must have its own explicit cap. Changing a limit does not cancel calls already dispatched.</p>
      {budget.data&&<><dl className="grid grid-cols-3 gap-4 text-sm">{[['Spent',budget.data.dailySpent],['Reserved',budget.data.dailyReserved],['Remaining',budget.data.dailyRemaining]].map(([label,value])=><div key={label}><dt className="text-white/50">{label}</dt><dd className="mt-1 font-mono">{value===null?'Daily limit off':`$${Number(value).toFixed(6)}`}</dd></div>)}</dl><p className="text-xs text-white/50">Resets {new Date(budget.data.resetsAt).toLocaleString()} (midnight UTC). Pending calls remain reserved until reconciled.</p></>}
      <button onClick={()=>void save()} disabled={saving||budget.isPending||!!budget.error} className="px-4 py-2 rounded bg-sand text-ink-dark text-sm font-semibold disabled:opacity-40">{saving?'Saving…':'Save budget'}</button>
      {message&&<p role="status" className="text-sm text-white/75">{message}</p>}
    </section>
    <section className="border border-white/10 rounded-lg p-5 space-y-4 bg-[#161616]">
      <h2 className="font-semibold">Masterkey services</h2>
      <p className="text-sm text-white/60">Service access is managed by Provance. Your existing login is all you need; no Coinbase or separate Masterkey account is required.</p>
      {masterkey.error&&<p role="alert" className="text-sm text-red-300">{masterkey.error.message}</p>}
      {masterkey.data&&<><p className="text-sm">{masterkey.data.serviceCount.toLocaleString()} catalog services · {masterkey.data.enabledOperations} executable operations</p><p className="text-xs text-white/60">Gateway: {masterkey.data.ready?'Connected to Provance':'Unavailable'} · Payments: {masterkey.data.paymentsEnabled?'Enabled for certified operations':'Disabled'}</p><p className="text-xs text-amber-200/80">{masterkey.data.reason}</p></>}
      <p className="text-xs text-white/50">The catalog is available in Add agent. Listing a service does not enable it: paid calls require a certified payment adapter and your input approval.</p>
      <button onClick={()=>void cache.invalidateQueries({queryKey:['masterkey-status']})} className="px-4 py-2 rounded border border-white/20 text-sm">Refresh service status</button>
    </section>
    <CreditsPanel/>
    <Link to="/app" className="text-sm text-white/70 underline">Back to workflows</Link>
  </div></div>;
}
