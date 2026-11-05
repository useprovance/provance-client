import {test} from 'node:test';
import assert from 'node:assert/strict';
import {agentParameterJson,agentInputSettings,saveAgentParameters} from '../src/utils/agent-input.ts';
test('native inputs retain scalar types, arrays, nested values and reserved-looking provider fields',()=>{
 const parameters={query:'dev',limit:2,enabled:false,tags:['a'],nested:{value:0},inputJson:'provider value',maxFeeUsd:'provider value'};
 const config={__inputVersion:2,parameters,settings:{maxFeeUsd:'0.01'}};
 assert.deepEqual(JSON.parse(agentParameterJson(config,true)),parameters);
 assert.deepEqual(saveAgentParameters(config,agentParameterJson(config,true),true),config);
});
test('legacy saved JSON upgrades only on save and keeps the actual existing fee ceiling',()=>{
 const config={parameters:{inputJson:'{"symbol":"STRK-USD","count":0}',maxFeeUsd:'0.005'},settings:{maxFeeUsd:'0.5',other:true},__links:{symbol:'source::symbol'}};
 const original=JSON.stringify(config);
 assert.deepEqual(JSON.parse(agentParameterJson(config,true)),{symbol:'STRK-USD',count:0});
 assert.equal(agentInputSettings(config,true).maxFeeUsd,'0.005');
 const saved=saveAgentParameters(config,agentParameterJson(config,true),true);
 assert.deepEqual(saved.parameters,{symbol:'STRK-USD',count:0});assert.deepEqual(saved.settings,{maxFeeUsd:'0.005',other:true});assert.equal(saved.__inputVersion,2);assert.deepEqual(saved.__links,config.__links);
 assert.equal(JSON.stringify(config),original);
 assert.equal((saveAgentParameters(config,agentParameterJson(config,true),true,{maxFeeUsd:'0.002'}).settings as Record<string,unknown>).maxFeeUsd,'0.002');
});
test('malformed legacy JSON stays editable and cannot be silently replaced on save',()=>{
 const config={parameters:{inputJson:'{invalid'}};
 assert.equal(agentParameterJson(config,true),'{invalid');assert.throws(()=>saveAgentParameters(config,agentParameterJson(config,true),true));
 const native={parameters:{inputJson:'ordinary input'}};
 assert.deepEqual(JSON.parse(agentParameterJson(native,false)),native.parameters);
});
