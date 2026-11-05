import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseServiceInput, serviceInputDefinition, serviceInputErrors, setInputValue } from '../src/utils/service-input.ts';

test('editing a legacy JSON payload preserves unknown options and false/zero values', () => {
  const original = { query: 'old', numResults: 0, contents: { text: false }, futureOption: { flags: [1, 2] } };
  const changed = setInputValue(original, ['query'], 'Find "AI"\nresearch');
  assert.deepEqual(parseServiceInput(JSON.stringify(changed)), { ...original, query: 'Find "AI"\nresearch' });
  assert.equal(original.query, 'old');
  assert.deepEqual(setInputValue(original, ['contents', 'text'], undefined), { query: 'old', numResults: 0, futureOption: { flags: [1, 2] } });
});
test('OpenAPI search parameters keep required fields, defaults and typed dropdown options', () => {
  const definition = serviceInputDefinition({ parameters: [
    { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
    { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } },
    { name: 'sort', in: 'query', schema: { type: 'string', enum: ['relevance', 'date'] } },
  ] });
  assert.ok(serviceInputErrors(definition, '{}')['["q"]']);
  assert.deepEqual(serviceInputErrors(definition, '{"q":"AI"}'), {}); // Defaults stay on the provider.
  assert.ok(serviceInputErrors(definition, '{"q":"AI","limit":51}')['["limit"]']);
  assert.ok(serviceInputErrors(definition, '{"q":"AI","sort":"invalid"}')['["sort"]']);
});
test('examples provide ordinary fields without inventing required inputs or filling user data', () => {
  const definition = serviceInputDefinition(null, { urls: ['https://example.com'], text: true, limit: 5 });
  assert.equal(definition.inferred, true);
  assert.equal(definition.schema.properties?.urls.items?.type, 'string');
  assert.deepEqual(serviceInputErrors(definition, '{}'), {});
  assert.deepEqual(serviceInputErrors(definition, '{"urls":["https://exa.ai"],"text":false,"limit":0}'), {});
});
test('invalid JSON, root arrays, wrong types and nested required inputs block saving', () => {
  const definition = serviceInputDefinition({ type: 'object', properties: {
    options: { type: 'object', properties: { enabled: { type: 'boolean' } }, required: ['enabled'] },
    count: { type: 'integer' },
  } });
  assert.ok(serviceInputErrors(definition, '{invalid')['']);
  assert.ok(serviceInputErrors(definition, '[]')['']);
  assert.ok(serviceInputErrors(definition, '{"options":{}}')['["options","enabled"]']);
  assert.ok(serviceInputErrors(definition, '{"count":1.5}')['["count"]']);
  assert.deepEqual(serviceInputErrors(definition, '{"options":{"enabled":false},"count":0}'), {});
});
test('connected values survive validation until runtime and unusual field names cannot change prototypes', () => {
  const definition = serviceInputDefinition({ type: 'object', properties: { limit: { type: 'integer' } }, required: ['limit'] });
  assert.deepEqual(serviceInputErrors(definition, '{"limit":"{{node::count}}"}'), {});
  const result = setInputValue({}, ['__proto__', 'polluted'], true);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), JSON.parse('{"__proto__":{"polluted":true}}'));
  assert.equal(Object.hasOwn({}, 'polluted'), false);
});
test('reviewed symbol formats are checked before saving or running, while connected values remain deferred',()=>{
 const definition=serviceInputDefinition({type:'object',properties:{symbol:{type:'string',pattern:'^[A-Z0-9]{1,15}-[A-Z0-9]{1,15}$',description:'Use a pair such as BTC-USD.'}},required:['symbol'],additionalProperties:false});
 assert.match(serviceInputErrors(definition,'{"symbol":"STRK"}')['["symbol"]'],/BTC-USD/);
 assert.deepEqual(serviceInputErrors(definition,'{"symbol":"STRK-USD"}'),{});
 assert.deepEqual(serviceInputErrors(definition,'{"symbol":"{{source::symbol}}"}'),{});
 assert.match(serviceInputErrors(definition,'{"symbol":"STRK-USD","unexpected":1}')[''],/unexpected/);
});
