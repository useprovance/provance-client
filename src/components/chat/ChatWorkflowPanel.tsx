import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AgentNode } from '@/components/editor/AgentNode';
import { TriggerNode } from '@/components/editor/TriggerNode';
import { EditorEdge } from '@/components/editor/EditorEdge';
import { AddAgentModal } from '@/components/editor/AddAgentModal';
import { NodeConfigSheet } from '@/components/editor/NodeConfigSheet';
import { EditorBottomPanel } from '@/components/editor/EditorBottomPanel';
import { EmptyCanvasNode } from '@/components/editor/EmptyCanvasNode';
import { useEditorStore } from '@/stores/editor.store';
import { withChoiceSync } from '@/utils/editor.utils';
import { workflowService } from '@/services/workflow.service';

const nodeTypes = { agent: AgentNode, trigger: TriggerNode, choice: EmptyCanvasNode };
const edgeTypes = { provance: EditorEdge };

interface ChatWorkflowPanelProps {
	workflowId: string;
	onBack: () => void;
	onClose: () => void;
}

const MIN_WIDTH = 400;

export function ChatWorkflowPanel({ workflowId, onBack, onClose }: ChatWorkflowPanelProps) {
	const { nodes, edges, onNodesChange, onEdgesChange, onConnect, initCanvas, setViewport } = useEditorStore();
	const [minimapVisible, setMinimapVisible] = useState(false);
	const minimapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [width, setWidth] = useState(() => window.innerWidth * 0.3);
	const dragStartX = useRef<number | null>(null);
	const dragStartWidth = useRef(window.innerWidth * 0.3);

	const onDragMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			dragStartX.current = e.clientX;
			dragStartWidth.current = width;
			const onMouseMove = (ev: MouseEvent) => {
				if (dragStartX.current === null) return;
				const maxWidth = window.innerWidth - 480;
				const delta = dragStartX.current - ev.clientX;
				setWidth(Math.min(maxWidth, Math.max(MIN_WIDTH, dragStartWidth.current + delta)));
			};
			const onMouseUp = () => {
				dragStartX.current = null;
				window.removeEventListener('mousemove', onMouseMove);
				window.removeEventListener('mouseup', onMouseUp);
			};
			window.addEventListener('mousemove', onMouseMove);
			window.addEventListener('mouseup', onMouseUp);
		},
		[width]
	);

	const { data: workflow } = useQuery({
		queryKey: ['workflow', workflowId],
		queryFn: () => workflowService.getById(workflowId),
		staleTime: 30_000,
	});

	useEffect(() => {
		if (workflow) initCanvas(workflow);
	}, [workflow?.id]); // eslint-disable-line react-hooks/exhaustive-deps

	const initialViewport = workflow
		? (JSON.parse(localStorage.getItem(`provance_viewport_${workflow.id}`) ?? 'null') ?? workflow.viewport ?? { x: 0, y: 0, zoom: 1 })
		: { x: 0, y: 0, zoom: 1 };

	return (
		<div className="relative flex flex-col border-l border-white/8 bg-[#141414] h-full" style={{ width }}>
			<div
				onMouseDown={onDragMouseDown}
				className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-10 hover:bg-blue-500/60 transition-colors"
			/>
			{/* Header */}
			<div className="flex items-center gap-2 px-4 h-12 shrink-0 border-b border-white/8">
				<button
					onClick={onBack}
					className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
				>
					<ArrowLeft size={13} strokeWidth={2} className="text-white/60" />
				</button>
				<p className="text-[13px] font-medium text-white flex-1 truncate">{workflow?.name ?? 'Workflow'}</p>
				<button
					onClick={onClose}
					className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
				>
					<X size={13} strokeWidth={2} className="text-white/60" />
				</button>
			</div>

			{/* Canvas + logs */}
			<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
				<div className="relative flex-1 min-h-0 bg-[#141414] overflow-hidden">
					{workflow ? (
						<ReactFlow
							nodes={withChoiceSync(nodes)}
							edges={edges}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							onConnect={onConnect}
							nodeTypes={nodeTypes}
							edgeTypes={edgeTypes}
							defaultEdgeOptions={{ type: 'provance' }}
							defaultViewport={initialViewport}
							proOptions={{ hideAttribution: true }}
							snapToGrid
							snapGrid={[20, 20]}
							minZoom={0.1}
							maxZoom={4}
							onMoveStart={() => {
								if (minimapTimer.current) clearTimeout(minimapTimer.current);
								setMinimapVisible(true);
							}}
							onMoveEnd={(_, vp) => {
								setViewport(vp);
								minimapTimer.current = setTimeout(() => setMinimapVisible(false), 1000);
							}}
							style={{ background: 'transparent', width: '100%', height: '100%' }}
						>
							<Background variant={BackgroundVariant.Dots} gap={16} size={1} color="oklch(38.67% 0 89.88)" />
							<MiniMap
								position="bottom-right"
								pannable
								zoomable
								nodeColor="hsl(0,0%,45%)"
								nodeStrokeColor="transparent"
								nodeBorderRadius={4}
								maskColor="rgba(255,255,255,0.05)"
								style={{
									background: 'hsl(0,0%,13%)',
									border: '1px solid oklch(100% 0 89.88 / 0.12)',
									borderRadius: 4,
									overflow: 'hidden',
									opacity: minimapVisible ? 1 : 0,
									pointerEvents: minimapVisible ? 'auto' : 'none',
									transition: 'opacity 0.3s ease',
									marginBottom: 12,
									marginRight: 12,
									width: 160,
									height: 100,
								}}
							/>
						</ReactFlow>
					) : (
						<div className="flex items-center justify-center h-full">
							<p className="text-[12px] text-white/30">Loading...</p>
						</div>
					)}
					<AddAgentModal />
					<NodeConfigSheet />
				</div>
				<EditorBottomPanel />
			</div>
		</div>
	);
}
