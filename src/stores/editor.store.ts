import { create } from 'zustand';
import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type Connection,
	type Edge,
	type EdgeChange,
	type Node,
	type NodeChange,
} from '@xyflow/react';
import type {
	Workflow,
	RunEvent,
	WorkflowRun,
	WorkflowLog,
	WorkflowNode,
	NodeRunResult,
	PendingPayment,
	PendingApproval,
	BlockRunOptions,
	BlockRunScope,
} from '@/services/workflow.service';
import { workflowService } from '@/services/workflow.service';
import {validFee,type BudgetSnapshot} from '@/services/budget.service';

interface EditorStore {
	// canvas
	workflowId: string;
	nodes: Node<WorkflowNode>[];
	edges: Edge[];
	viewport: Workflow['viewport'];
	onNodesChange: (changes: NodeChange[]) => void;
	onEdgesChange: (changes: EdgeChange[]) => void;
	onConnect: (connection: Connection) => void;
	setViewport: (viewport: Workflow['viewport']) => void;
	initCanvas: (workflow: Workflow) => void;

	// add agent modal
	isModalOpen: boolean;
	sourceNodeId: string | null;
	openModal: (sourceNodeId?: string | null) => void;
	closeModal: () => void;
	addAgentNode: (
		agent: { agentId: string; label: string; image_url: string | null },
		action: { key: string; label: string; endpoint?: string; x402?: boolean; execution?:{inputFormat:string} },
		nodeId?: string
	) => string;
	removeNode: (nodeId: string) => void;

	// node config sheet
	isConfigOpen: boolean;
	configNodeId: string | null;
	openConfig: (nodeId: string) => void;
	closeConfig: () => void;
	updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;

	// run & logs
	isRunning: boolean;
	activeRunId: string | null;
	runningNodeId: string | null;
	pendingPayment: PendingPayment | null;
	pendingApproval: PendingApproval | null;
	clearPendingApproval: () => void;
	maxExecutionFee: string | null;
	setMaxExecutionFee: (value: string | null) => void;
	budget: BudgetSnapshot | null;
	logsOpen: boolean;
	panelTab: 'logs' | 'runs';
	logs: WorkflowLog[];
	runs: WorkflowRun[];
	setLogsOpen: (open: boolean) => void;
	setPanelTab: (tab: 'logs' | 'runs') => void;
	clearLogs: () => void;
	clearRuns: () => void;
	blockRunNodeId: string|null;
	requestBlockRun: (id:string)=>void;
	closeBlockRun: ()=>void;
	triggerRun: (options?:BlockRunOptions) => Promise<boolean>;
	attachRun: (runId:string) => void;
	clearPendingPayment: () => void;
	stopRun: () => void;
}

let closeRunStream:(()=>void)|undefined;

export const useEditorStore = create<EditorStore>((set, get) => ({
	workflowId: '',
	nodes: [],
	edges: [],
	viewport: { x: 0, y: 0, zoom: 1 },
	isModalOpen: false,
	sourceNodeId: null,

	onNodesChange: changes =>
		set(state => ({
			nodes: applyNodeChanges(changes, state.nodes) as Node<WorkflowNode>[],
		})),

	onEdgesChange: changes =>
		set(state => ({ edges: applyEdgeChanges(changes, state.edges) })),

	onConnect: connection =>
		set(state => ({
			edges: addEdge({ ...connection, type: 'provance' }, state.edges),
		})),

	initCanvas: workflow => {
		const savedLogs = localStorage.getItem(`provance_logs_${workflow.id}`);
		const savedViewport = localStorage.getItem(
			`provance_viewport_${workflow.id}`
		);
		set({
			workflowId: workflow.id,
			blockRunNodeId:null,
			maxExecutionFee: workflow.canvas.maxExecutionFee ?? null,
			budget: null,
			pendingApproval: null,
			nodes: workflow.canvas.nodes.map(n => ({
				id: n.id,
				type: n.type,
				position: n.position,
				data: n,
			})),
			edges: workflow.canvas.edges.map(e => ({ ...e, type: 'provance' })),
			runs: [],
			logs: savedLogs ? (JSON.parse(savedLogs) as WorkflowLog[]) : [],
			viewport: savedViewport
				? (JSON.parse(savedViewport) as Workflow['viewport'])
				: (workflow.viewport ?? { x: 0, y: 0, zoom: 1 }),
		});
        closeRunStream?.();set({isRunning:false,activeRunId:null});
        void workflowService.getRuns(workflow.id).then(runs=>{if(get().workflowId!==workflow.id)return;set({runs});const active=runs.find(r=>r.status==='running');if(active)get().attachRun(active.id);});
	},

	setViewport: viewport => set({ viewport }),

	isConfigOpen: false,
	configNodeId: null,

	openConfig: nodeId => set({ isConfigOpen: true, configNodeId: nodeId }),
	closeConfig: () => set({ isConfigOpen: false, configNodeId: null }),
	updateNodeConfig: (nodeId, config) =>
		set(state => ({
			nodes: state.nodes.map(n =>
				n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
			),
		})),

	openModal: (sourceNodeId = null) => set({ isModalOpen: true, sourceNodeId }),

	closeModal: () => set({ isModalOpen: false, sourceNodeId: null }),

	isRunning: false,
	activeRunId: null,
	runningNodeId: null,
	pendingPayment: null,
	pendingApproval: null,
	clearPendingApproval: () => set({pendingApproval:null}),
	maxExecutionFee: null,
	setMaxExecutionFee: value => set({maxExecutionFee:value}),
	budget: null,
	logsOpen: false,
	panelTab: 'logs',
	logs: [],
	runs: [],
	setLogsOpen: open => set({ logsOpen: open }),
	setPanelTab: tab => set({ panelTab: tab }),
	clearLogs: () => {
		const { workflowId } = get();
		localStorage.removeItem(`provance_logs_${workflowId}`);
		set({ logs: [] });
	},
	clearRuns: () => set({ runs: [] }),
	clearPendingPayment: () => set({ pendingPayment: null }),

	blockRunNodeId:null,
	requestBlockRun:id=>{if(!get().isRunning&&get().nodes.some(n=>n.id===id&&n.type==='agent'))set({blockRunNodeId:id,isConfigOpen:false,configNodeId:null});},
	closeBlockRun:()=>set({blockRunNodeId:null}),
	triggerRun: async (options) => {
		const { workflowId, nodes, edges, maxExecutionFee, isRunning } = get();
		if (!workflowId || isRunning) return false;
		if(maxExecutionFee!==null&&!validFee(maxExecutionFee)){
			set(s=>({logsOpen:true,panelTab:'logs',logs:[...s.logs,{time:new Date().toLocaleTimeString(),level:'error',message:'Enter a valid run fee cap with at most 6 decimal places.'}]}));return false;
		}

		set({ isRunning: true, logsOpen: true, panelTab: 'runs' });

		let runId: string;
		let scope:BlockRunScope|undefined;
		try {
			await workflowService.update(workflowId,{canvas:{nodes:nodes.map(n=>({...n.data,position:n.position})),edges:edges.map(e=>({id:e.id,source:e.source,target:e.target})),maxExecutionFee}});
			const res = options ? await workflowService.runBlock(workflowId,options,maxExecutionFee) : await workflowService.run(workflowId,maxExecutionFee);
			if('scope' in res)scope=res.scope as BlockRunScope;
			runId = res.runId;
			set({ activeRunId: runId, budget: res.budget });
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to start run';
			set(s => ({
				isRunning: false, panelTab:'logs',
				activeRunId: null,
				logs: [...s.logs, { time: new Date().toLocaleTimeString(), level: 'error' as const, message: msg }],
			}));
			return false;
		}

		const startedAt = new Date().toISOString();

		// Push the in-progress run immediately so the runs table shows it live
		set(s => ({
			runs: [{ id: runId, status: 'running', startedAt, nodeResults: [], scope }, ...s.runs],
		}));

		get().attachRun(runId);
		return true;
	},
	attachRun: runId => {
		const {workflowId,nodes}=get();
		closeRunStream?.();
		set({isRunning:true,activeRunId:runId,logsOpen:true});
		// Track per-node start time + input so we can build NodeRunResult on success/error
		const nodeStartData = new Map<string, { startedAt: string; input: Record<string, unknown> }>();

		closeRunStream=workflowService.stream(runId, (event: RunEvent) => {
			if(get().activeRunId!==runId)return;
			const time = new Date().toLocaleTimeString();

			if(event.type==='budget'){
				set({budget:event.budget});
			}else if(event.type==='approval_required'){
				set({pendingApproval:{runId,...event}});
			}else if (event.type === 'log') {
				set(s => {
					const updated = [...s.logs, { time, level: event.level, message: event.message }];
					localStorage.setItem(`provance_logs_${workflowId}`, JSON.stringify(updated));
					return { logs: updated };
				});
			} else if (event.type === 'node_start') {
				nodeStartData.set(event.nodeId, { startedAt: new Date().toISOString(), input: event.input });
				set({ runningNodeId: event.nodeId });
			} else if (event.type === 'node_success' || event.type === 'node_error') {
				const start = nodeStartData.get(event.nodeId);
				const nodeLabel = nodes.find(n => n.id === event.nodeId)?.data.label ?? event.nodeId;
				const result: NodeRunResult = {
					nodeId: event.nodeId,
					label: nodeLabel,
					status: event.type === 'node_success' ? 'success' : 'error',
					input: start?.input ?? {},
					output: event.type === 'node_success' ? event.output : {},
					error: event.type === 'node_error' ? event.error : undefined,
					startedAt: start?.startedAt ?? new Date().toISOString(),
					durationMs: start ? Date.now() - new Date(start.startedAt).getTime() : 0,
				};
				set(s => ({
					runningNodeId: null,
					pendingApproval:null,
					runs: s.runs.map(r => r.id === runId
						? { ...r, nodeResults: [...r.nodeResults, result] }
						: r
					),
				}));
			} else if (event.type === 'payment_required') {
				set({
					pendingPayment: {
						runId,
						nodeId: event.nodeId,
						itemCount: event.itemCount,
						pricePerCall: event.pricePerCall,
						totalAmount: event.totalAmount,
						token: event.token,
						tokenAddress: event.tokenAddress as `0x${string}`,
						walletAddress: event.walletAddress as `0x${string}`,
						chainId: event.chainId,
					},
				});
			} else if (event.type === 'complete') {
				set(s => ({
					isRunning: false,
					activeRunId: null,
					runningNodeId: null,
					pendingPayment: null,
					pendingApproval: null,
					runs: s.runs.map(r => r.id === runId
						? { ...r, status: event.status, nodeResults: event.nodeResults }
						: r
					),
				}));
			} else if (event.type === 'stream_error') {
				set(s => ({
					isRunning: false,
					activeRunId: null,
					runningNodeId: null,
					pendingPayment: null, pendingApproval:null,
					logs: [...s.logs, { time, level: 'error' as const, message: 'Lost connection to run stream' }],
				}));
			}
		});
	},
	stopRun: () => {
		const { activeRunId } = get();
		if (activeRunId) void workflowService.stopRun(activeRunId);
		set({runningNodeId:null,pendingPayment:null,pendingApproval:null});
	},

	addAgentNode: (agent, action, nodeId) => {
		const { nodes, edges, sourceNodeId } = get();
		const newId = nodeId ?? crypto.randomUUID();

		const sourceNode = sourceNodeId
			? nodes.find(n => n.id === sourceNodeId)
			: null;
		const position = sourceNode
			? { x: sourceNode.position.x + 280, y: sourceNode.position.y }
			: { x: 100 + (nodes.length % 3) * 300, y: 150 + Math.floor(nodes.length / 3) * 220 };

		const newNode: Node<WorkflowNode> = {
			id: newId,
			type: 'agent',
			position,
			data: {
				id: newId,
				nodeId: agent.agentId,
				type: 'agent',
				position,
				action:{key:action.key,label:action.label,endpoint:action.endpoint,x402:action.x402},
				label: agent.label,
				image_url: agent.image_url,
				config: action.execution?.inputFormat==='fields'?{__inputVersion:2,parameters:{}}:{},
			},
		};

		const newEdges = sourceNodeId
			? [
					...edges,
					{
						id: `e-${sourceNodeId}-${newId}`,
						source: sourceNodeId,
						target: newId,
						type: 'provance',
					},
				]
			: edges;

		set({
			nodes: [...nodes, newNode],
			edges: newEdges,
			isModalOpen: false,
			sourceNodeId: null,
		});
		return newId;
	},

	removeNode: (nodeId) => {
		set(state => ({
			nodes: state.nodes.filter(n => n.id !== nodeId),
			edges: state.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
		}));
	},
}));

let saveTimer: ReturnType<typeof setTimeout> | null = null;

useEditorStore.subscribe((state, prev) => {
	if (state.viewport !== prev.viewport && state.workflowId) {
		localStorage.setItem(
			`provance_viewport_${state.workflowId}`,
			JSON.stringify(state.viewport)
		);
	}
	if (state.nodes === prev.nodes && state.edges === prev.edges && state.maxExecutionFee === prev.maxExecutionFee) return;
	// TODO: slight stutter on first drag — clearTimeout/setTimeout fires on every mousemove, investigate debounce that doesn't reset mid-drag
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		const { workflowId: storedId, nodes, edges, maxExecutionFee } = useEditorStore.getState();
		const workflowId =
			storedId ||
			window.location.pathname.match(/\/workflows\/([^/]+)/)?.[1] ||
			'';
		if (!workflowId || nodes.length === 0) return;
		void workflowService.update(workflowId, {
			canvas: {
				maxExecutionFee,
				nodes: nodes.map(n => ({
					...n.data,
					position: n.position,
				})) as WorkflowNode[],
				edges: edges.map(e => ({
					id: e.id,
					source: e.source,
					target: e.target,
				})),
			},
		});
	}, 2000);
});
