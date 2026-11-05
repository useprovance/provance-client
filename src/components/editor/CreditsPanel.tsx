import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router';
import {operationsService} from '@/services/operations.service';
export function CreditsPanel(){
 const credit=useQuery({queryKey:['service-credits'],queryFn:()=>operationsService.credits(),refetchInterval:10000,retry:false});const[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function buy(id:string){setBusy(true);setMessage('');try{const url=new URL(await operationsService.checkout(id,crypto.randomUUID()));if(url.origin!=='https://checkout.stripe.com')throw Error('Unexpected payment destination');window.location.href=url.toString();}catch(e){setMessage(e instanceof Error?e.message:'Checkout unavailable');setBusy(false);}}
 return <section className="border border-white/10 rounded-lg p-5 space-y-4 bg-[#161616]"><h2 className="font-semibold">Service credits</h2>
 {credit.error&&<p role="alert" className="text-red-300 text-sm">{credit.error.message}</p>}
 {credit.data&&<><p className="text-sm text-white/60">{credit.data.enabled?'Prepaid credits cover execution fees. Your spending limits still apply.':'The operator funds service fees during the pilot. Credit purchases are disabled.'}</p>
 <dl className="grid grid-cols-3 gap-3 text-sm">{[['Balance',credit.data.balance],['Reserved',credit.data.reserved],['Available',credit.data.available]].map(([k,v])=><div key={k}><dt className="text-white/50">{k}</dt><dd className="font-mono">${Number(v).toFixed(6)}</dd></div>)}</dl>
 {credit.data.frozen&&<p className="text-amber-200 text-sm">Your credit account is paused for billing review. Existing charges remain recorded.</p>}
 {credit.data.enabled&&<div className="flex gap-2 flex-wrap">{credit.data.packs.map(p=><button key={p.id} disabled={busy||credit.data?.frozen||!credit.data?.billingConfigured} onClick={()=>void buy(p.id)} className="px-4 py-2 border border-white/20 rounded text-sm disabled:opacity-40">Buy ${(p.cents/100).toFixed(2)} credits</button>)}{!credit.data.billingConfigured&&<p className="text-xs text-white/50">Credit checkout is not configured yet.</p>}</div>}
 {credit.data.operator&&<Link to="/app/operations" className="text-sm text-sand underline">Service operations</Link>}</>}
 {message&&<p role="alert" className="text-red-300 text-sm">{message}</p>}
 </section>;
}
