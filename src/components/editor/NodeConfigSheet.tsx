import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { X, Link2, Unlink } from 'lucide-react';
import {
	agentService,
	type ProvanceField,
	type ProvanceAction,
} from '@/services/agent.service';
import { useEditorStore } from '@/stores/editor.store';
import { FormInput } from '@/components/ui/form-input';
import { FormSelector, type SelectOption } from '@/components/ui/form-selector';
import {
	MessageTemplateField,
	type TemplateVariable,
} from '@/components/editor/MessageTemplateField';
import type { WorkflowNode } from '@/services/workflow.service';
import { getNodeAncestors } from '@/utils/editor.utils';
import { AgentAvatar } from '@/components/agents/AgentAvatar';
import { ServiceInputForm } from './ServiceInputForm';
import {agentParameterJson,agentInputSettings,saveAgentParameters} from '@/utils/agent-input';
import { serviceInputDefinition, serviceInputErrors } from '@/utils/service-input';
import { useMasterkeyAvailability } from '@/services/masterkey.service';
import { masterkeyOperationStatus } from '@/utils/masterkey-availability';

const LINKS_KEY = '__links';

type AncestorOption = SelectOption & { outputType: string };

const FIELD_TO_OUTPUT_TYPE: Record<string, string> = {
	text: 'string',
	number: 'number',
	select: 'string',
	boolean: 'boolean',
};

interface FieldProps {
	field: ProvanceField;
	value: string;
	onChange: (v: string) => void;
	linked: boolean;
	hasParents: boolean;
	ancestorOptions: AncestorOption[];
	linkedParentId: string;
	onToggleLink: () => void;
	onSelectParent: (key: string) => void;
	variables: TemplateVariable[];
}

function Field({
	field,
	value,
	onChange,
	linked,
	hasParents,
	ancestorOptions,
	linkedParentId,
	onToggleLink,
	onSelectParent,
	variables,
}: FieldProps) {
	// textarea uses inline @ variable insertion — no link button needed
	if (field.type === 'textarea') {
		return (
			<MessageTemplateField
				label={field.label}
				value={value}
				onChange={onChange}
				placeholder={field.placeholder}
				variables={variables}
				required={field.required}
			/>
		);
	}

	const linkIcon = hasParents ? (
		<button
			onClick={e => {
				e.stopPropagation();
				onToggleLink();
			}}
			title={
				linked ? 'Unlink — fill manually' : 'Link to parent node output'
			}
			className={`flex items-center justify-center w-10 self-stretch shrink-0 transition-colors cursor-pointer ${
				linked
					? 'bg-orange/10 text-orange hover:bg-orange/15'
					: 'bg-white/4 text-sand/40 hover:bg-white/8 hover:text-sand/70'
			}`}
		>
			{linked ? (
				<Link2 size={22} strokeWidth={1.6} />
			) : (
				<Unlink size={22} strokeWidth={1.6} />
			)}
		</button>
	) : null;

	if (linked && hasParents) {
		const matchedOptions = ancestorOptions.filter(
			o => o.outputType === FIELD_TO_OUTPUT_TYPE[field.type]
		);
		return (
			<FormSelector
				label={field.label}
				value={linkedParentId}
				onChange={onSelectParent}
				options={matchedOptions}
				placeholder="Select output field..."
				prefix={linkIcon}
			/>
		);
	}

	if (field.type === 'select' && field.options) {
		return (
			<FormSelector
				label={field.label}
				value={value}
				onChange={onChange}
				options={field.options.map(o => ({ value: o, label: o }))}
				placeholder="Select..."
				prefix={linkIcon}
			/>
		);
	}

	return (
		<FormInput
			label={field.label}
			value={value}
			onChange={onChange}
			placeholder={field.placeholder}
			type={field.type === 'number' ? 'number' : 'text'}
			prefix={linkIcon}
		/>
	);
}

export function NodeConfigSheet() {
	const {
		isConfigOpen,
		configNodeId,
		closeConfig,
		nodes,
		edges,
		updateNodeConfig,
		requestBlockRun,
		isRunning,
	} = useEditorStore();

	const [activeTab, setActiveTab] = useState('');
	const [config, setConfig] = useState<Record<string, Record<string, unknown>>>(
		{}
	);
	const [linked, setLinked] = useState<Record<string, string>>({});
	const [parameterJson,setParameterJson]=useState('{}');
	const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

	const node = configNodeId ? nodes.find(n => n.id === configNodeId) : null;
	const nodeData = node?.data as WorkflowNode | undefined;
	const availability = useMasterkeyAvailability(isConfigOpen && !!nodeData?.nodeId.startsWith('masterkey:'));

	const hasParentEdges = edges.some(e => e.target === configNodeId);

	const { data: agent = null } = useQuery({
		queryKey: ['agent', nodeData?.nodeId],
		queryFn: () => agentService.getById(nodeData!.nodeId),
		enabled: isConfigOpen && !!nodeData?.nodeId,
	});

	const action = agent
		? (agent.services[nodeData!.action.key] as ProvanceAction)
		: null;
	// reset config + tab whenever the sheet opens on a different node
	useEffect(() => {
		if (!isConfigOpen || !nodeData) return;
		const savedConfig =
			(nodeData.config as Record<string, Record<string, unknown>>) ?? {};
		const managed=nodeData.nodeId.startsWith('masterkey:');
		setConfig({...savedConfig,settings:agentInputSettings(nodeData.config,managed)});
		setParameterJson(agentParameterJson(nodeData.config,managed));
		setLinked(hasParentEdges ? (savedConfig[LINKS_KEY] ?? {}) as Record<string,string> : {});
		setInputErrors({});
	}, [isConfigOpen, configNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

	// set active tab once agent loads
	useEffect(() => {
		if (!action) return;
		setActiveTab(action.config[0]?.key ?? '');
	}, [agent, nodeData?.nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

	const ancestors = useMemo(() => {
		if (!configNodeId) return [];
		return getNodeAncestors(configNodeId, nodes, edges);
	}, [configNodeId, nodes, edges]);

	const ancestorQueries = useQueries({
		queries: ancestors.map(a => ({
			queryKey: ['agent', a.nodeId],
			queryFn: () => agentService.getById(a.nodeId),
			enabled: isConfigOpen && !!a.nodeId,
		})),
	});

	const ancestorOptions = useMemo<AncestorOption[]>(
		() =>
			ancestorQueries.flatMap((q, i) => {
				if (!q.data) return [];
				const result = (
					q.data.services[ancestors[i].action.key] as
						| ProvanceAction
						| undefined
				)?.result;
				if (!result) return [];
				return Object.entries(result).map(([key, field]) => ({
					value: `${ancestors[i].id}::${key}`,
					label: `${ancestors[i].label}: ${field.label}`,
					icon: ancestors[i].image_url ?? undefined,
					outputType: field.type,
				}));
			}),
		[ancestors, ancestorQueries]
	);

	const templateVariables = useMemo<TemplateVariable[]>(
		() =>
			ancestorOptions.map(o => ({
				id: o.value,
				key: o.value.includes('::') ? o.value.split('::')[1] : o.value,
				label: o.label,
				icon: o.icon,
			})),
		[ancestorOptions]
	);

	const toggleLink = useCallback(
		(fieldKey: string) => {
			setLinked(prev => {
				if (prev[fieldKey] !== undefined) {
					const next = { ...prev };
					delete next[fieldKey];
					return next;
				}
				return { ...prev, [fieldKey]: ancestorOptions[0]?.value ?? '' };
			});
		},
		[ancestorOptions]
	);

	const handleSave = useCallback((runAfterSave=false) => {
		if (!configNodeId) return;
		if (action?.inputSchema) {
			const errors = serviceInputErrors(serviceInputDefinition(action.inputSchema, action.inputExample), parameterJson);
			setInputErrors(errors);
			if (Object.keys(errors).length) return;
		}
		const next={...nodeData?.config,...config,[LINKS_KEY]:linked};
		updateNodeConfig(configNodeId,action?.inputSchema?saveAgentParameters(next,parameterJson,!!action.execution||!!nodeData?.nodeId.startsWith('masterkey:'),config.settings):next);
		closeConfig();
		if(runAfterSave)requestBlockRun(configNodeId);
	}, [requestBlockRun, parameterJson, configNodeId, config, linked, updateNodeConfig, closeConfig, nodeData?.nodeId, nodeData?.config, action]);

	const activeTabData = action?.config.find(c => c.key === activeTab);

	if (!isConfigOpen || !nodeData) return null;

	return (
		<div className="absolute top-0 right-0 h-full w-[380px] bg-[#141414] border-l border-[#2a2a2a] flex flex-col z-20">
			{/* Header */}
			<div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a2a2a]">
				<div className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden">
					<AgentAvatar name={nodeData.label} src={agent?.image_url ?? nodeData.image_url} />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-[15px] font-semibold text-white truncate">
						{nodeData.label}
					</p>
					<p className="text-[11px] text-white/40 truncate">
						{nodeData.action.label}
					</p>
				</div>
				<button
					onClick={closeConfig}
					className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
				>
					<X size={13} strokeWidth={2} className="text-white/60" />
				</button>
			</div>

			{/* Tabs */}
			{!agent ? (
				<div className="flex gap-3 px-5 py-3 border-b border-[#2a2a2a]">
					{[72, 56].map(w => (
						<div
							key={w}
							className="h-3.5 rounded animate-pulse bg-white/8"
							style={{ width: w }}
						/>
					))}
				</div>
			) : (
				action &&
				action.config.length > 0 && (
					<div className="flex border-b border-[#2a2a2a]">
						{action.config.map(c => (
							<button
								key={c.key}
								onClick={() => setActiveTab(c.key)}
								className={`px-5 py-3 text-[13px] font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
									activeTab === c.key
										? 'text-white border-orange bg-white/4'
										: 'text-white/35 border-transparent hover:text-white/60'
								}`}
							>
								{c.label}
							</button>
						))}
					</div>
				)
			)}

			{/* Fields */}
			<div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
				{nodeData.nodeId.startsWith('masterkey:') && !masterkeyOperationStatus(nodeData.nodeId, nodeData.action.key, availability.data).executable && <p role="status" className="text-xs leading-relaxed text-amber-200/90">{masterkeyOperationStatus(nodeData.nodeId, nodeData.action.key, availability.data).label} · {masterkeyOperationStatus(nodeData.nodeId, nodeData.action.key, availability.data).reason} You can edit the saved input; the workflow will be blocked until this operation is available.</p>}
				{action?.payment !== undefined && (
					<div className="flex items-center justify-between px-4 py-3 bg-white/4 ring-1 ring-white/8 ring-offset-2 ring-offset-[#141414]">
						<div className="flex items-center gap-2.5">
							<span className="text-[12px] text-white/40">Price</span>
							<span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/40 bg-white/6 px-2 py-0.5">
								x402
							</span>
						</div>
						<span className="text-[13px] font-medium text-white/70">
							${action.payment.amount} {action.payment.token}
						</span>
					</div>
				)}
				{!agent ? (
					<>
						{[1, 2, 3].map(i => (
							<div key={i} className="flex flex-col gap-1.5">
								<div className="h-3 w-20 rounded bg-white/8 animate-pulse" />
								<div className="h-[42px] w-full rounded-sm bg-white/5 animate-pulse" />
							</div>
						))}
					</>
				) : activeTab==='parameters'&&action?.inputSchema ? (
                       <ServiceInputForm key={`${configNodeId}:${nodeData.action.key}`} schema={action.inputSchema} example={action.inputExample} value={parameterJson} onChange={v=>{setParameterJson(v);if(Object.keys(inputErrors).length)setInputErrors(serviceInputErrors(serviceInputDefinition(action.inputSchema,action.inputExample),v));}} variables={templateVariables} errors={inputErrors}/>
				) : !activeTabData || activeTabData.fields.length === 0 ? (
					<div className="flex items-center justify-center h-full">
						<p className="text-[12px] text-white/30">
							No fields to configure
						</p>
					</div>
				) : (
					<>
						{activeTabData.fields.map(f => (
							<Field
								key={f.key}
								field={f}
								value={String(config[activeTab]?.[f.key] ?? '')}
								onChange={v =>
									setConfig(prev => ({
										...prev,
										[activeTab]: { ...prev[activeTab], [f.key]: v },
									}))
								}
								linked={linked[f.key] !== undefined}
								hasParents={
									hasParentEdges && activeTab === 'parameters'
								}
								ancestorOptions={ancestorOptions}
								linkedParentId={linked[f.key] ?? ''}
								onToggleLink={() => toggleLink(f.key)}
								onSelectParent={key =>
									setLinked(prev => ({ ...prev, [f.key]: key }))
								}
								variables={templateVariables}
							/>
						))}
					</>
				)}
			</div>

			{/* Footer */}
			<div className="px-5 py-4 border-t border-[#2a2a2a] flex justify-end gap-2">
				<button
					onClick={closeConfig}
					className="px-4 py-1.5 text-[13px] text-white/50 hover:text-white transition-colors cursor-pointer"
				>
					Cancel
				</button>
				{nodeData.type==='agent'&&<button disabled={isRunning} onClick={()=>handleSave(true)} className="whitespace-nowrap px-3 py-1.5 text-[13px] text-sand border border-white/20 hover:bg-white/10 disabled:opacity-50 focus-visible:outline focus-visible:outline-orange">Save & run block</button>}
				<button
					onClick={()=>handleSave()}
					className="px-4 py-1.5 text-[13px] font-medium bg-orange text-white hover:bg-orange/90 transition-colors cursor-pointer"
					style={{
						clipPath:
							'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
					}}
				>
					Save
				</button>
			</div>
		</div>
	);
}
