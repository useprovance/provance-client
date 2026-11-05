import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freeMasterkeyActionKeys, masterkeyOperationStatus, masterkeyServiceStatus, type MasterkeyAvailability} from '../src/utils/masterkey-availability.ts';
const data:MasterkeyAvailability={ready:true,paymentsEnabled:true,reason:'Ready',operations:[{serviceId:'exa',actionKey:'operation_0',executable:true,state:'certified',reason:'Reviewed',policyHash:'a'.repeat(64)}]};
test('only the explicitly reviewed operation can be added; discovery is not execution permission',()=>{
 assert.equal(masterkeyOperationStatus('masterkey:exa','operation_0',data).executable,true);
 assert.equal(masterkeyOperationStatus('masterkey:exa','operation_1',data).executable,false);
 assert.equal(masterkeyOperationStatus('masterkey:other','operation_0',data).label,'Catalog only');
 assert.equal(masterkeyOperationStatus('masterkey:exa','operation_0').executable,false);
});
test('gateway outage or a paused payment switch overrides stale executable flags',()=>{
 assert.equal(masterkeyServiceStatus('masterkey:exa',{...data,ready:false}).executable,false);
 assert.equal(masterkeyServiceStatus('masterkey:exa',{...data,paymentsEnabled:false}).label,'Paused');
 assert.equal(masterkeyOperationStatus('provance-agent','read').executable,true);
});
test('reviewed free operations remain selectable with the payment switch off',()=>{
 const free={...data,paymentsEnabled:false,operations:data.operations.map(op=>({...op,billing:'free' as const}))};
 assert.equal(masterkeyServiceStatus('masterkey:exa',free).executable,true);assert.equal(masterkeyServiceStatus('masterkey:exa',free).label,'Free');
 assert.equal(masterkeyServiceStatus('masterkey:exa',{...free,ready:false}).executable,false);
 assert.equal(masterkeyServiceStatus('masterkey:exa',{...free,operations:free.operations.map(op=>({...op,executable:false}))}).executable,false);
});
test('the free filter includes only certified executable free actions, including mixed-price services',()=>{
 const paid=data.operations[0];
 const mixed:MasterkeyAvailability={...data,paymentsEnabled:false,operations:[{...paid,billing:'paid'},{...paid,actionKey:'operation_1',billing:'free'},{...paid,actionKey:'operation_2',billing:'free',executable:false},{...paid,actionKey:'operation_3',billing:'free',state:'temporarily_unavailable'}]};
 assert.deepEqual(freeMasterkeyActionKeys('masterkey:exa',mixed),['operation_1']);
 assert.deepEqual(freeMasterkeyActionKeys('masterkey:unreviewed-free-listing',mixed),[]);
 assert.deepEqual(freeMasterkeyActionKeys('masterkey:exa',data),[]);
});
test('the free filter fails closed on missing availability and never guesses native-agent pricing',()=>{
 const free={...data,operations:data.operations.map(op=>({...op,billing:'free' as const}))};
 assert.deepEqual(freeMasterkeyActionKeys('masterkey:exa'),[]);
 assert.deepEqual(freeMasterkeyActionKeys('masterkey:exa',{...free,ready:false}),[]);
 assert.deepEqual(freeMasterkeyActionKeys('native-agent',free),[]);
});
