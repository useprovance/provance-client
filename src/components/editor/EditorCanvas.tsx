import { useEffect, useRef, useState } from 'react';
import {
	ReactFlow,
	Background,
	BackgroundVariant,
	MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PanelLeftOpen } from 'lucide-react';
import { AiChatPanel } from './AiChatPanel';
import { AgentNode } from './AgentNode';
import { TriggerNode } from './TriggerNode';
import { EditorEdge } from './EditorEdge';
import { AddAgentModal } from './AddAgentModal';
import { NodeConfigSheet } from './NodeConfigSheet';
import {RunBlockDialog} from './RunBlockDialog';
import { EditorBottomPanel } from './EditorBottomPanel';
import { EmptyCanvasNode } from './EmptyCanvasNode';
import { useEditorStore } from '@/stores/editor.store';
import { withChoiceSync } from '@/utils/editor.utils';
import type { Workflow } from '@/services/workflow.service';

const nodeTypes = {
	agent: AgentNode,
	trigger: TriggerNode,
	choice: EmptyCanvasNode,
};
const edgeTypes = { provance: EditorEdge };

export function EditorCanvas({ workflow }: { workflow: Workflow }) {
	const {
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		initCanvas,
		setViewport,
	} = useEditorStore();
	const [aiPanelOpen, setAiPanelOpen] = useState(true);
	const [minimapVisible, setMinimapVisible] = useState(false);
	const minimapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		initCanvas(workflow);
	}, [workflow.id]); // eslint-disable-line react-hooks/exhaustive-deps

	const savedVp = localStorage.getItem(`provance_viewport_${workflow.id}`);
	const initialViewport: Workflow['viewport'] = savedVp
		? JSON.parse(savedVp)
		: (workflow.viewport ?? { x: 0, y: 0, zoom: 1 });

	return (
		<div className="flex w-full h-full">
			{aiPanelOpen && (
				<AiChatPanel onCollapse={() => setAiPanelOpen(false)} />
			)}

			<div className="flex flex-col flex-1 min-w-0">
				<div className="relative flex-1 min-h-0 bg-[#141414] overflow-hidden">
					{!aiPanelOpen && (
						<button
							onClick={() => setAiPanelOpen(true)}
							className="absolute top-1/2 left-0 -translate-y-1/2 z-10 flex flex-col items-center gap-1.5 py-3 px-1.5 bg-[#1a1a1a] border border-white/10 rounded-r-lg text-white/60 hover:text-white hover:bg-[#222] transition-all cursor-pointer"
						>
							<PanelLeftOpen size={15} strokeWidth={1.5} />
							<span
								className="text-[9px] font-medium tracking-wide uppercase"
								style={{
									writingMode: 'vertical-rl',
									transform: 'rotate(180deg)',
								}}
							>
								AI Chat
							</span>
						</button>
					)}

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
							if (minimapTimer.current)
								clearTimeout(minimapTimer.current);
							setMinimapVisible(true);
						}}
						onMoveEnd={(_, vp) => {
							setViewport(vp);
							minimapTimer.current = setTimeout(
								() => setMinimapVisible(false),
								1000
							);
						}}
						style={{
							background: 'transparent',
							width: '100%',
							height: '100%',
						}}
					>
						<Background
							variant={BackgroundVariant.Dots}
							gap={16}
							size={1}
							color="oklch(38.67% 0 89.88)"
						/>
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
								marginLeft: 12,
								width: 200,
								height: 120,
							}}
							onMouseEnter={() => {
								if (minimapTimer.current)
									clearTimeout(minimapTimer.current);
								setMinimapVisible(true);
							}}
							onMouseLeave={() => {
								minimapTimer.current = setTimeout(
									() => setMinimapVisible(false),
									1000
								);
							}}
						/>
					</ReactFlow>

					<AddAgentModal />
					<NodeConfigSheet />
                    <RunBlockDialog />
				</div>
				<EditorBottomPanel />
			</div>
		</div>
	);
}
