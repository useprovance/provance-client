/** Form hints only. The execution gateway remains responsible for provider validation. */
export interface InputSchema {
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: Record<string, InputSchema>;
  required?: string[];
  items?: InputSchema;
  enum?: unknown[];
  default?: unknown;
  example?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  [key: string]: unknown;
}

export interface ServiceInputDefinition { schema: InputSchema; inferred: boolean }
export const isInputObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const own = (v: Record<string, unknown>, k: string) => Object.hasOwn(v, k) ? v[k] : undefined;

export function inputType(schema: InputSchema): string | undefined {
  if (schema.$ref || schema.oneOf || schema.anyOf) return undefined;
  if (Array.isArray(schema.type)) {
    const types = schema.type.filter(t => t !== 'null');
    return types.length === 1 ? types[0] : undefined;
  }
  return schema.type ?? (schema.properties ? 'object' : schema.enum?.length ? typeof schema.enum[0] : undefined);
}

function fromExample(value: unknown): InputSchema {
  if (Array.isArray(value)) return { type: 'array', items: value.length ? fromExample(value[0]) : {}, example: value };
  if (isInputObject(value)) return { type: 'object', properties: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fromExample(v)])) };
  return { type: value === null ? undefined : typeof value, example: value };
}

export function serviceInputDefinition(raw: unknown, example?: Record<string, unknown>): ServiceInputDefinition {
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = null; } }
  if (isInputObject(raw)) {
    if (isInputObject(raw.properties)) return { schema: raw as InputSchema, inferred: false };
    // OpenAPI parameters and JSON request bodies are exposed as named inputs.
    const properties: Record<string, InputSchema> = {};
    const required = new Set<string>();
    if (Array.isArray(raw.parameters)) for (const p of raw.parameters) {
      if (!isInputObject(p) || typeof p.name !== 'string' || !['query', 'path'].includes(String(p.in))) continue;
      properties[p.name] = { ...(isInputObject(p.schema) ? p.schema : {}), description: String(p.description ?? ''), ...(p.example !== undefined ? { example: p.example } : {}) };
      if (p.required === true) required.add(p.name);
    }
    for (const group of ['pathParams', 'queryParams']) {
      const fields = raw[group];
      if (!isInputObject(fields)) continue;
      for (const [key, value] of Object.entries(fields)) if (isInputObject(value)) {
        properties[key] = value as InputSchema;
        if (value.required === true) required.add(key);
      }
    }
    const request = raw.requestBody ?? raw.body;
    if (isInputObject(request)) {
      const content = isInputObject(request.content) ? request.content['application/json'] : undefined;
      const body = isInputObject(content) ? content.schema : request;
      if (isInputObject(body) && isInputObject(body.properties)) {
        // Some registry bodies describe an HTTP adapter, rather than its user inputs.
        const adapterEnvelope = 'input' in body.properties && 'output' in body.properties && example && !('input' in example);
        if (!adapterEnvelope) {
          Object.assign(properties, body.properties);
          if (Array.isArray(body.required)) for (const k of body.required) if (typeof k === 'string') required.add(k);
        }
      }
    }
    if (Object.keys(properties).length) return { schema: { type: 'object', properties, required: [...required] }, inferred: false };
    // Do not guess requirements from prose; examples supply editable fields only.
    if (raw.type === 'object' && !example) return { schema: raw as InputSchema, inferred: false };
  }
  return { schema: fromExample(example ?? {}), inferred: !!example && Object.keys(example).length > 0 };
}

export function parseServiceInput(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value.trim() || '{}');
  if (!isInputObject(parsed)) throw new Error('Enter a JSON object, with named input fields.');
  return parsed;
}

/** Preserve unknown options and scalar types when editing one field in a saved payload. */
export function setInputValue(root: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const [key, ...rest] = path;
  if (key === undefined) return root;
  const previous = own(root, key);
  const child = rest.length ? setInputValue(isInputObject(previous) ? previous : {}, rest, value) : value;
  const remove = child === undefined || (rest.length > 0 && isInputObject(child) && Object.keys(child).length === 0);
  return Object.fromEntries([...Object.entries(root).filter(([k]) => k !== key), ...(remove ? [] : [[key, child]])]);
}

export function inputLabel(key: string, schema: InputSchema): string {
  return schema.title || key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, s => s.toUpperCase());
}

export function serviceInputErrors(definition: ServiceInputDefinition, value: string): Record<string, string> {
  let input: Record<string, unknown>;
  try { input = parseServiceInput(value); }
  catch { return { '': 'Enter valid JSON with named input fields, or switch back to the form.' }; }
  const errors: Record<string, string> = {};
  function visit(schema: InputSchema, v: unknown, path: string[], required: boolean) {
    const label = inputLabel(path.at(-1) ?? 'input', schema);
    const key = JSON.stringify(path);
    if (v === undefined || (required && v === '')) { if (required) errors[key] = `${label} is required.`; return; }
    // Connected values are validated after runtime substitution.
    if (typeof v === 'string' && /\{\{[^}]+\}\}/.test(v)) return;
    if (v === null && (schema.type === 'null' || (Array.isArray(schema.type) && schema.type.includes('null')))) return;
    const type = inputType(schema);
    if ((type === 'object' && !isInputObject(v)) || (type === 'array' && !Array.isArray(v))
      || (type === 'string' && typeof v !== 'string') || (type === 'boolean' && typeof v !== 'boolean')
      || ((type === 'number' || type === 'integer') && (typeof v !== 'number' || !Number.isFinite(v) || (type === 'integer' && !Number.isInteger(v))))) {
      errors[key] = `${label} must be ${type === 'integer' ? 'a whole number' : `a valid ${type}`}.`; return;
    }
    if (schema.enum && !schema.enum.some(option => JSON.stringify(option) === JSON.stringify(v))) errors[key] = `Choose a listed value for ${label.toLowerCase()}.`;
    if (typeof v === 'number') {
      if (schema.minimum !== undefined && v < schema.minimum) errors[key] = `Use ${schema.minimum} or greater.`;
      if (schema.maximum !== undefined && v > schema.maximum) errors[key] = `Use ${schema.maximum} or less.`;
    }
    if (typeof v === 'string') {
      if (schema.pattern) {
        try { if (!new RegExp(schema.pattern, 'u').test(v)) errors[key] = schema.description || `${label} has the wrong format${schema.example !== undefined ? `; for example ${schema.example}` : ''}.`; }
        catch { errors[key] = `${label} format could not be checked. Reopen the service or contact the operator.`; }
      }
      if (schema.minLength !== undefined && v.length < schema.minLength) errors[key] = `Enter at least ${schema.minLength} characters.`;
      if (schema.maxLength !== undefined && v.length > schema.maxLength) errors[key] = `Use at most ${schema.maxLength} characters.`;
    }
    if (Array.isArray(v)) {
      if (schema.minItems !== undefined && v.length < schema.minItems) errors[key] = `Add at least ${schema.minItems} items.`;
      if (schema.maxItems !== undefined && v.length > schema.maxItems) errors[key] = `Use at most ${schema.maxItems} items.`;
      if (schema.items && isInputObject(schema.items)) v.forEach((item, i) => visit(schema.items!, item, [...path, String(i)], true));
    }
    if (isInputObject(v) && schema.additionalProperties === false && schema.properties) {
      for (const name of Object.keys(v)) if (!Object.hasOwn(schema.properties, name)) errors[path.length ? key : ''] = `Remove the unsupported input field: ${name}.`;
    }
    if (isInputObject(v) && schema.properties) for (const [k, field] of Object.entries(schema.properties)) {
      if (isInputObject(field)) visit(field, own(v, k), [...path, k], Array.isArray(schema.required) && schema.required.includes(k));
    }
  }
  visit(definition.schema, input, [], true);
  return errors;
}
