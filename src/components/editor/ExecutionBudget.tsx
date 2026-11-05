import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useEditorStore } from '@/stores/editor.store';
import { budgetService,validFee } from '@/services/budget.service';
import { Dialog,DialogContent,DialogTitle } from '@/components/ui/dialog';

export function ExecutionBudget(){
  const {maxExecutionFee,setMaxExecutionFee,isRunning,activeRunId,budget}=useEditorStore();
  const current=useQuery({queryKey:['execution-budget',activeRunId],queryFn:()=>budgetService.get(activeRunId??undefined),refetchInterval:isRunning?3000:10000,retry:false});
  const snapshot=current.data??budget;
  return <div className="bg-[#1e1e1e] border border-white/20 rounded-md px-3 py-2 text-xs text-white space-y-2 max-w-md">
    <div className="flex items-center gap-3 flex-wrap"><label className="flex items-center gap-2"><input type="checkbox" checked={maxExecutionFee!==null} disabled={isRunning} onChange={e=>setMaxExecutionFee(e.target.checked?'0':null)}/>Cap this run (USD)</label>
    {maxExecutionFee!==null&&<input aria-label="Maximum execution fees for this run in USD" inputMode="decimal" disabled={isRunning} value={maxExecutionFee} onChange={e=>setMaxExecutionFee(e.target.value)} className="w-24 bg-black/20 border border-white/20 px-2 py-1 rounded"/>}
    <Link className="text-sand underline ml-auto" to="/app/settings">Daily budget</Link></div>
    {maxExecutionFee!==null&&!validFee(maxExecutionFee)&&<p role="alert" className="text-red-300">Use up to 6 decimal places.</p>}
    {snapshot&&<><p className="text-white/65">Today: ${snapshot.dailySpent} spent · ${snapshot.dailyReserved} reserved · {snapshot.dailyRemaining===null?'daily limit off':`$${snapshot.dailyRemaining} remaining`}</p><p className="text-white/45">Resets {new Date(snapshot.resetsAt).toLocaleString()}{activeRunId?` · Run: $${snapshot.runSpent} spent / $${snapshot.runReserved} reserved / ${snapshot.runRemaining===null?'no run cap':`$${snapshot.runRemaining} remaining`}`:''}</p></>}
    {current.error&&<p className="text-amber-300">{current.error.message}</p>}
  </div>;
}

export function ServiceApprovalModal(){
  const {pendingApproval,clearPendingApproval}=useEditorStore();
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function respond(approved:boolean){
    if(!pendingApproval||busy)return;setBusy(true);setError('');
    try{await budgetService.approve(pendingApproval.runId,pendingApproval.nodeId,pendingApproval.callIndex,approved,pendingApproval.approvalId);clearPendingApproval();}
    catch(err){setError(err instanceof Error?err.message:'Could not submit approval');}finally{setBusy(false);}
  }
  return <Dialog open={!!pendingApproval} onOpenChange={open=>{if(!open)void respond(false);}}><DialogContent className="bg-[#141414] border-white/15 text-white max-h-[85vh] overflow-y-auto">
    <DialogTitle>Approve external service call</DialogTitle>
    <p className="text-sm">{pendingApproval?.label} · Call {(pendingApproval?.callIndex??0)+1}</p>
    <p className="text-sm text-white/65">This input will be sent through Provance to the service provider. Maximum execution fee: ${pendingApproval?.maxFeeUsd} USD. Your daily and run budgets also apply.</p>
    {pendingApproval?.providerPolicy && <dl className="space-y-2 text-xs text-white/75">
      <div><dt className="text-white/65">Service fee</dt><dd>{pendingApproval.providerPolicy.scheme==='free'?'Free · no wallet or payment required':'Base · USDC'}</dd></div>
      <div><dt className="text-white/65">Provider endpoint</dt><dd className="break-all">{pendingApproval.providerPolicy.url}</dd></div>
      {pendingApproval.providerPolicy.payTo&&<div><dt className="text-white/65">Payment recipient</dt><dd className="break-all font-mono">{pendingApproval.providerPolicy.payTo}</dd></div>}
      <div><dt className="text-white/65">Reviewed policy</dt><dd className="break-all font-mono">{pendingApproval.providerPolicy.policyHash}</dd></div>
    </dl>}
    <pre className="text-xs bg-black/30 p-3 whitespace-pre-wrap break-all max-h-64 overflow-auto">{JSON.stringify(pendingApproval?.input,null,2)}</pre>
    {error&&<p role="alert" className="text-red-300 text-sm">{error}</p>}
    <div className="flex gap-3 justify-end"><button disabled={busy} onClick={()=>void respond(false)} className="text-sm px-4 py-2">Decline</button><button disabled={busy} onClick={()=>void respond(true)} className="text-sm px-4 py-2 bg-sand text-ink-dark rounded font-semibold">{busy?'Submitting…':'Approve call'}</button></div>
  </DialogContent></Dialog>;
}
