import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Play,ChevronDown} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {useEditorStore} from '@/stores/editor.store';
import {agentService,type ProvanceAction} from '@/services/agent.service';
import type {WorkflowNode,WorkflowRun} from '@/services/workflow.service';
import {useMasterkeyAvailability} from '@/services/masterkey.service';
import {masterkeyOperationStatus} from '@/utils/masterkey-availability';
import {parseServiceInput,serviceInputDefinition,serviceInputErrors,type InputSchema} from '@/utils/service-input';
import {agentParameterJson} from '@/utils/agent-input';
import {ServiceInputForm} from './ServiceInputForm';
import {ExecutionBudget} from './ExecutionBudget';

const control='w-full min-w-0 rounded border border-white/20 bg-[#202020] px-3 py-2.5 text-sm text-white focus-visible:outline focus-visible:outline-orange disabled:opacity-50';

export function RunBlockDialog(){
 const id=useEditorStore(s=>s.blockRunNodeId),nodes=useEditorStore(s=>s.nodes);
 const node=nodes.find(n=>n.id===id)?.data;
 return node?<BlockRunForm key={id} node={node}/>:null;
}
function BlockRunForm({node}:{node:WorkflowNode}){
 const {closeBlockRun,openConfig,edges,runs,triggerRun,isRunning}=useEditorStore();
 const masterkey=node.nodeId.startsWith('masterkey:');
 const agent=useQuery({queryKey:['agent',node.nodeId],queryFn:()=>agentService.getById(node.nodeId)});
 const action=agent.data?.services[node.action.key] as ProvanceAction|undefined;
 const availability=useMasterkeyAvailability(masterkey);
 const status=masterkey?masterkeyOperationStatus(node.nodeId,node.action.key,availability.data):undefined;
 const ancestors=new Set<string>();
 const visit=(id:string)=>{for(const edge of edges.filter(e=>e.target===id)){if(edge.source===node.id||ancestors.has(edge.source))continue;ancestors.add(edge.source);visit(edge.source);}};visit(node.id);
 const sources=runs.filter(run=>run.status!=='running'&&run.nodeResults.some(r=>ancestors.has(r.nodeId)&&r.status==='success'));
 const [mode,setMode]=useState<'manual'|'saved'>('manual');
 const [value,setValue]=useState(()=>agentParameterJson(node.config,masterkey));
 const [source,setSource]=useState(sources[0]?.id??''),[item,setItem]=useState('1');
 const [errors,setErrors]=useState<Record<string,string>>({}),[error,setError]=useState('');
 const [submitting,setSubmitting]=useState(false);
 const nativeFields=action?.config.find(c=>c.key==='parameters')?.fields??[];
 const schema=action?.inputSchema??{type:'object',properties:Object.fromEntries(nativeFields.map(f=>[f.key,{type:f.type==='number'?'number':f.type==='boolean'?'boolean':'string',title:f.label,...(f.options?{enum:f.options}:{}),...(f.default!==undefined?{default:f.default}:{})}])),required:nativeFields.filter(f=>f.required).map(f=>f.key)} satisfies InputSchema;
 const unavailable=masterkey&&!status?.executable;
 async function submit(){
  if(submitting||isRunning)return;setError('');setErrors({});
  let input:Record<string,unknown>|undefined;
  if(mode==='manual'){
   const invalid=serviceInputErrors(serviceInputDefinition(schema,action?.inputExample),value);setErrors(invalid);if(Object.keys(invalid).length)return;
   input=parseServiceInput(value);
  }else if(!source||!sources.some(r=>r.id===source)||!/^\d+$/.test(item)||Number(item)<1||Number(item)>100){setError('Choose a saved run and an output item from 1 to 100.');return;}
  setSubmitting(true);
  try{
   const started=await triggerRun(mode==='manual'?{nodeId:node.id,inputMode:'manual',input}:{nodeId:node.id,inputMode:'saved',sourceRunId:source,sourceItemIndex:Number(item)-1});
   if(started)closeBlockRun();else setError(useEditorStore.getState().logs.at(-1)?.message??'Could not start this block. Try again.');
  }catch(err){setError(err instanceof Error?err.message:'Could not start this block.');}finally{setSubmitting(false);}
 }
 const sourceLabel=(run:WorkflowRun)=>`${new Date(run.startedAt).toLocaleString()} · ${run.scope?run.scope.label:'Workflow'} · ${run.status}`;
 return <Dialog open onOpenChange={open=>{if(!open&&!submitting)closeBlockRun();}}><DialogContent className="bg-[#141414] border-white/15 text-white max-h-[85dvh] overflow-y-auto sm:max-w-xl">
  <DialogTitle className="pr-6 break-words">Run block: {node.label}</DialogTitle>
  <DialogDescription className="text-white/70">Runs this block once. Other blocks stay idle. Input overrides apply to this run only.</DialogDescription>
  <fieldset disabled={submitting||isRunning} className="space-y-4 min-w-0">
   <legend className="mb-2 text-sm font-medium">Input source</legend>
   <div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="block-input" checked={mode==='manual'} onChange={()=>{setMode('manual');setError('');}} className="accent-orange"/>Enter inputs</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="block-input" disabled={!sources.length} checked={mode==='saved'} onChange={()=>{setMode('saved');setError('');}} className="accent-orange"/>Use saved upstream output</label></div>
   {mode==='manual'?<>
    <p className="text-xs leading-relaxed text-white/65">Enter actual values in place of connected references. Your block’s saved fee ceiling still applies.</p>
    {agent.isPending?<p role="status" className="text-sm text-white/70">Loading input fields…</p>:agent.isError?<p role="alert" className="text-sm text-red-300">Input fields could not load. <button onClick={()=>void agent.refetch()} className="underline">Retry</button></p>:<ServiceInputForm schema={schema} example={action?.inputExample} value={value} onChange={v=>{setValue(v);setErrors({});}} variables={[]} errors={errors}/>}
    {!sources.length&&ancestors.size>0&&<p className="text-xs text-white/65">No saved upstream results yet. Run an upstream block first, or enter its values here.</p>}
   </>:<>
    <label className="block text-sm space-y-2"><span>Saved run</span><div className="relative"><select className={`${control} appearance-none pr-10`} value={source} onChange={e=>{setSource(e.target.value);setItem('1');}}><option value="" disabled>Choose a saved run</option>{sources.map(run=><option key={run.id} value={run.id}>{sourceLabel(run)}</option>)}</select><ChevronDown size={16} className="absolute right-3 top-3 pointer-events-none text-white/65"/></div></label>
    <label className="block text-sm space-y-2"><span>Output item</span><input type="number" min={1} max={100} step={1} value={item} onChange={e=>setItem(e.target.value)} className={control}/></label>
    <p className="text-xs leading-relaxed text-white/65">Uses this block’s saved input mappings and one upstream item. Item 1 is the first result. Missing values stop the run before execution.</p>
   </>}
  </fieldset>
  {!agent.isPending&&!agent.isError&&!action&&<p role="alert" className="text-sm text-red-300">This action is no longer available. Choose another action in the block configuration.</p>}
  <ExecutionBudget/>
  {masterkey&&<p role="status" className={`text-sm ${unavailable?'text-amber-200':'text-white/70'}`}>{availability.isPending?'Checking service availability…':status?.reason}{availability.isError&&<button onClick={()=>void availability.refetch()} className="ml-2 underline">Retry</button>}</p>}
  {error&&<p role="alert" className="text-sm text-red-300 break-words">{error}</p>}
  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/15 pt-4">
   <button disabled={submitting} onClick={()=>{closeBlockRun();openConfig(node.id);}} className="mr-auto text-sm text-sand underline focus-visible:outline focus-visible:outline-orange">Edit configuration</button>
   <button disabled={submitting} onClick={closeBlockRun} className="px-3 py-2 text-sm text-white/75 hover:text-white">Cancel</button>
   <button onClick={()=>void submit()} disabled={submitting||isRunning||agent.isPending||agent.isError||!action||unavailable} className="flex items-center gap-2 rounded bg-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-orange"><Play size={14}/>{submitting?'Starting…':'Run block'}</button>
  </div>
 </DialogContent></Dialog>;
}
