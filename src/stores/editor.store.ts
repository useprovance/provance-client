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
	WorkflowNode,
} from '@/services/workflow.service';
import { workflowService } from '@/services/workflow.service';
import { withChoiceSync } from '@/utils/editor.utils';

export interface RunLog {
	time: string;
	level: 'info' | 'warn' | 'error';
	message: string;
}

interface EditorStore {
	workflowId: string;
	nodes: Node[];
	edges: Edge[];
	viewport: Workflow['viewport'];
	onNodesChange: (changes: NodeChange[]) => void;
	onEdgesChange: (changes: EdgeChange[]) => void;
	onConnect: (connection: Connection) => void;
	setViewport: (viewport: Workflow['viewport']) => void;
	initCanvas: (workflow: Workflow) => void;

	isModalOpen: boolean;
	sourceNodeId: string | null;
	openModal: (sourceNodeId?: string | null) => void;
	closeModal: () => void;
	addAgentNode: (
		agent: { agentId: string; label: string; image_url: string | null },
		action: { key: string; label: string; endpoint?: string }
	) => void;

	isConfigOpen: boolean;
	configNodeId: string | null;
	openConfig: (nodeId: string) => void;
	closeConfig: () => void;
	updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;

	isRunning: boolean;
	logsOpen: boolean;
	panelTab: 'logs' | 'runs';
	logs: RunLog[];
	runs: WorkflowRun[];
	setLogsOpen: (open: boolean) => void;
	setPanelTab: (tab: 'logs' | 'runs') => void;
	clearLogs: () => void;
	triggerRun: () => Promise<void>;
	stopRun: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
	workflowId: '',
	nodes: withChoiceSync([]),
	edges: [],
	viewport: { x: 0, y: 0, zoom: 1 },
	isModalOpen: false,
	sourceNodeId: null,

	onNodesChange: changes =>
		set(state => {
			const filtered = changes.filter(
				c => !(c.type === 'position' && 'id' in c && c.id === '__choice__')
			);
			return {
				nodes: withChoiceSync(applyNodeChanges(filtered, state.nodes)),
			};
		}),

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
			nodes: withChoiceSync(
				workflow.canvas.nodes.map(n => ({
					id: n.id,
					type: n.type,
					position: n.position,
					data: n,
				}))
			),
			edges: workflow.canvas.edges.map(e => ({ ...e, type: 'provance' })),
			runs: [],
			logs: savedLogs ? (JSON.parse(savedLogs) as RunLog[]) : [],
			viewport: savedViewport
				? (JSON.parse(savedViewport) as Workflow['viewport'])
				: (workflow.viewport ?? { x: 0, y: 0, zoom: 1 }),
		});
		void workflowService.getRuns(workflow.id).then(runs => set({ runs }));
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
	triggerRun: async () => {
		const { workflowId } = get();
		if (!workflowId) return;

		set({ isRunning: true, logsOpen: true, panelTab: 'logs' });

		let runId: string;
		try {
			const res = await workflowService.run(workflowId);
			runId = res.runId;
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to start run';
			set(s => ({
				isRunning: false,
				logs: [
					...s.logs,
					{
						time: new Date().toLocaleTimeString(),
						level: 'error' as const,
						message: msg,
					},
				],
			}));
			return;
		}

		const startedAt = new Date().toISOString();

		workflowService.stream(runId, (event: RunEvent) => {
			const time = new Date().toLocaleTimeString();
			if (event.type === 'log') {
				set(s => {
					const updated = [
						...s.logs,
						{ time, level: event.level, message: event.message },
					];
					localStorage.setItem(
						`provance_logs_${workflowId}`,
						JSON.stringify(updated)
					);
					return { logs: updated };
				});
			} else if (event.type === 'complete') {
				const run: WorkflowRun = {
					id: runId,
					status: event.status,
					startedAt,
					nodeResults: event.nodeResults,
				};
				set(s => ({
					isRunning: false,
					runs: [run, ...s.runs],
					panelTab: 'runs',
				}));
			} else if (event.type === 'stream_error') {
				set(s => ({
					isRunning: false,
					logs: [
						...s.logs,
						{
							time,
							level: 'error' as const,
							message: 'Lost connection to run stream',
						},
					],
				}));
			}
		});
	},
	stopRun: () => set({ isRunning: false }),

	addAgentNode: (agent, action) => {
		const { nodes, edges, sourceNodeId } = get();
		const newId = crypto.randomUUID();

		const realNodes = nodes.filter(n => n.id !== '__choice__');
		const sourceNode = sourceNodeId
			? realNodes.find(n => n.id === sourceNodeId)
			: null;
		const position = sourceNode
			? { x: sourceNode.position.x + 280, y: sourceNode.position.y }
			: { x: 100 + realNodes.length * 60, y: 200 };

		const newNode: Node<WorkflowNode> = {
			id: newId,
			type: 'agent',
			position,
			data: {
				id: newId,
				nodeId: agent.agentId,
				type: 'agent',
				position,
				action,
				label: agent.label,
				image_url: agent.image_url,
				config: {},
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

		// Remove choice node and add real node, then re-sync
		const updatedNodes = withChoiceSync([...realNodes, newNode]);
		set({
			nodes: updatedNodes,
			edges: newEdges,
			isModalOpen: false,
			sourceNodeId: null,
		});
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
	if (state.nodes === prev.nodes && state.edges === prev.edges) return;
	// TODO: slight stutter on first drag — clearTimeout/setTimeout fires on every mousemove, investigate debounce that doesn't reset mid-drag
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		const { workflowId: storedId, nodes, edges } = useEditorStore.getState();
		const workflowId =
			storedId ||
			window.location.pathname.match(/\/workflows\/([^/]+)/)?.[1] ||
			'';
		const realNodes = nodes.filter(n => n.id !== '__choice__');
		if (!workflowId || realNodes.length === 0) return;
		void workflowService.update(workflowId, {
			canvas: {
				nodes: realNodes.map(n => ({
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
