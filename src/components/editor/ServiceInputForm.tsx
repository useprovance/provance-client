import { useId, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { MessageTemplateField, type TemplateVariable } from './MessageTemplateField';
import { inputLabel, inputType, isInputObject, parseServiceInput, serviceInputDefinition, setInputValue, type InputSchema } from '@/utils/service-input';

const control = 'w-full min-w-0 border border-[#383838] bg-[#0c0c0c] px-3 py-2.5 text-[13px] text-white placeholder:text-white/55 focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange';
const emptyItem = (schema: InputSchema): unknown => inputType(schema) === 'object' ? {} : inputType(schema) === 'array' ? [] : inputType(schema) === 'boolean' ? false : '';

interface SchemaFieldProps {
  name: string;
  schema: InputSchema;
  value: unknown;
  example?: unknown;
  required?: boolean;
  path: string[];
  errors: Record<string, string>;
  variables: TemplateVariable[];
  onChange: (v: unknown) => void;
  onAdvanced: () => void;
}

function SchemaField({ name, schema, value, example, required, path, errors, variables, onChange, onAdvanced }: SchemaFieldProps) {
  const id = useId();
  const [shown, setShown] = useState(20);
  const type = inputType(schema);
  const label = inputLabel(name, schema);
  const error = errors[JSON.stringify(path)];
  const hint = schema.example ?? example ?? schema.default;
  const placeholder = hint !== undefined && hint !== null && typeof hint !== 'object' ? String(hint) : '';
  const description = typeof schema.description === 'string' ? schema.description : '';
  const caption = <>{label}{required && <span className="ml-1 text-orange">*</span>}</>;
  const help = <>{description && <p id={`${id}-help`} className="text-xs leading-relaxed text-white/65 break-words">{description}</p>}{error && <p id={`${id}-error`} role="alert" className="text-xs text-red-300">{error}</p>}</>;

  if (type === 'object' && isInputObject(schema.properties)) {
    const object = isInputObject(value) ? value : {};
    const samples = isInputObject(example) ? example : {};
    return <fieldset className="min-w-0 space-y-3 border border-white/15 p-3">
      <legend className="px-1 text-[13px] font-medium text-white">{caption}</legend>
      {help}
      {Object.entries(schema.properties).map(([key, field]) => isInputObject(field) && <SchemaField key={key} name={key} schema={field} value={Object.hasOwn(object, key) ? object[key] : undefined} example={samples[key]} required={Array.isArray(schema.required) && schema.required.includes(key)} path={[...path, key]} errors={errors} variables={variables} onAdvanced={onAdvanced} onChange={v => { const next = setInputValue(object, [key], v); onChange(Object.keys(next).length ? next : undefined); }} />)}
    </fieldset>;
  }
  if (type === 'array' && schema.items && inputType(schema.items)) {
    const array = Array.isArray(value) ? value : [];
    const items = schema.items;
    return <fieldset className="min-w-0 space-y-3">
      <legend className="text-[13px] font-medium text-white">{caption}</legend>
      {help}
      {array.slice(0, shown).map((item, index) => <div key={index} className="flex items-start gap-2">
        <div className="min-w-0 flex-1"><SchemaField name={`${label} ${index + 1}`} schema={items} value={item} required path={[...path, String(index)]} errors={errors} variables={variables} onAdvanced={onAdvanced} onChange={v => onChange(array.map((old, i) => i === index ? v : old))} /></div>
        <button type="button" aria-label={`Remove ${label.toLowerCase()} item ${index + 1}`} onClick={() => onChange(array.filter((_, i) => i !== index))} className="mt-7 p-2 text-white/65 hover:text-white focus-visible:outline focus-visible:outline-orange"><X size={16} /></button>
      </div>)}
      {array.length > shown && <button type="button" onClick={() => setShown(v => v + 20)} className="text-xs text-sand underline">Show more items</button>}
      <button type="button" disabled={schema.maxItems !== undefined && array.length >= schema.maxItems} onClick={() => onChange([...array, emptyItem(items)])} className="flex items-center gap-1.5 text-xs text-sand hover:text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-orange"><Plus size={14} />Add item</button>
    </fieldset>;
  }
  if (!schema.enum && !['string', 'number', 'integer', 'boolean'].includes(type ?? '')) return <div className="space-y-1.5">
    <p className="text-[13px] font-medium text-white">{caption}</p>
    {help}
    <button type="button" onClick={onAdvanced} className="text-xs text-sand underline">Configure in Advanced JSON</button>
  </div>;

  const template = typeof value === 'string' && value.includes('{{');
  const numeric = type === 'number' || type === 'integer';
  return <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[13px] font-medium text-white">{caption}</label>
    {(schema.enum || type === 'boolean') && !template
      ? <select id={id} value={value === undefined ? '' : JSON.stringify(value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : description ? `${id}-help` : undefined} onChange={e => onChange(e.target.value === '' ? undefined : JSON.parse(e.target.value))} className={control}>
        <option value="">{schema.default === undefined ? 'Select a value…' : `Use default (${String(schema.default)})`}</option>
        {(schema.enum ?? [true, false]).map(option => <option key={JSON.stringify(option)} value={JSON.stringify(option)}>{typeof option === 'boolean' ? option ? 'Yes' : 'No' : String(option)}</option>)}
      </select>
      : <input id={id} type={numeric && !template ? 'number' : 'text'} step={type === 'integer' ? 1 : 'any'} min={schema.minimum} max={schema.maximum} value={value === undefined ? '' : String(value)} placeholder={placeholder} aria-required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : description ? `${id}-help` : undefined} onChange={e => {
        const text = e.target.value;
        onChange(text === '' ? undefined : numeric && !template && Number.isFinite(Number(text)) ? Number(text) : text);
      }} className={control} />}
    {help}
    {variables.length > 0 && <select aria-label={`Insert connected output into ${label}`} value="" onChange={e => { if (e.target.value) onChange(`${typeof value === 'string' ? value : ''}{{${e.target.value}}}`); }} className="max-w-full bg-[#141414] text-xs text-sand py-1 focus-visible:outline focus-visible:outline-orange">
      <option value="">Insert connected output…</option>
      {variables.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
    </select>}
  </div>;
}

interface Props {
  schema: unknown;
  example?: Record<string, unknown>;
  value: string;
  onChange: (value: string) => void;
  variables: TemplateVariable[];
  errors: Record<string, string>;
}

export function ServiceInputForm({ schema, example, value, onChange, variables, errors }: Props) {
  const definition = useMemo(() => serviceInputDefinition(schema, example), [schema, example]);
  const [advanced, setAdvanced] = useState(() => { try { parseServiceInput(value); return false; } catch { return true; } });
  const [optionalOpen, setOptionalOpen] = useState(false);
  let input: Record<string, unknown> = {};
  let invalid = false;
  try { input = parseServiceInput(value); } catch { invalid = true; }
  const properties = definition.schema.properties ?? {};
  const fields = Object.entries(properties).filter(([, s]) => isInputObject(s));
  const required = Array.isArray(definition.schema.required) ? definition.schema.required : [];
  const primary = fields.filter(([key]) => required.includes(key));
  const optional = fields.filter(([key]) => !required.includes(key));
  const hasFields = fields.length > 0;
  const showJson = advanced || invalid || !hasFields;
  const hasOptionalError = Object.keys(errors).some(key => {
    try { return optional.some(([field]) => field === JSON.parse(key)[0]); } catch { return false; }
  });
  const renderField = ([key, field]: [string, InputSchema]) => <SchemaField key={key} name={key} schema={field} value={Object.hasOwn(input, key) ? input[key] : undefined} example={example?.[key]} required={required.includes(key)} path={[key]} errors={errors} variables={variables} onAdvanced={() => setAdvanced(true)} onChange={v => onChange(JSON.stringify(setInputValue(input, [key], v), null, 2))} />;

  if(!hasFields&&definition.schema.additionalProperties===false&&!invalid&&!Object.keys(input).length)return <p className="text-sm text-white/70">This action needs no inputs.</p>;
  return <section className="space-y-4" aria-label="Service inputs">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-medium text-white">Service inputs</h3>
      {hasFields && <button type="button" aria-pressed={showJson} disabled={invalid && showJson} onClick={() => setAdvanced(!showJson)} className="text-xs text-sand underline disabled:opacity-50 focus-visible:outline focus-visible:outline-orange">{showJson ? 'Use form' : 'Advanced JSON'}</button>}
    </div>
    {errors[''] && <p role="alert" className="text-xs text-red-300">{errors['']}</p>}
    {showJson ? <>
      <MessageTemplateField label="Advanced input (JSON)" value={value} onChange={onChange} placeholder={JSON.stringify(example ?? {}, null, 2)} variables={variables} />
      <p className="text-xs leading-relaxed text-white/65">Enter an object with named fields. Switching views preserves your input.</p>
      {Object.entries(errors).filter(([key]) => key !== '').map(([key, error]) => <p key={key} role="alert" className="text-xs text-red-300">{error}</p>)}
    </> : <>
      {definition.inferred && <p className="text-xs leading-relaxed text-white/65">These fields come from the service’s example. Use Advanced JSON for other options.</p>}
      {(primary.length ? primary : optional).map(renderField)}
      {primary.length > 0 && optional.length > 0 && <div className="space-y-4 border-t border-white/15 pt-3">
        <button type="button" aria-expanded={optionalOpen || hasOptionalError} onClick={() => setOptionalOpen(v => !v)} className="text-xs text-sand hover:text-white focus-visible:outline focus-visible:outline-orange">{optionalOpen || hasOptionalError ? 'Hide' : 'Show'} optional fields ({optional.length})</button>
        {(optionalOpen || hasOptionalError) && optional.map(renderField)}
      </div>}
      {Object.keys(input).some(key => !Object.hasOwn(properties, key)) && <p className="text-xs leading-relaxed text-white/65">Additional saved options are preserved. View them in Advanced JSON.</p>}
    </>}
  </section>;
}
