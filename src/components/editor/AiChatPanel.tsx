import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Loader2, Plus, PanelLeftClose } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { useQuery, useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEditorStore } from '@/stores/editor.store';
import { agentService, type ProvanceAction } from '@/services/agent.service';
import { env } from '@/utils/env.utils';

const SUGGESTIONS = [
	'What does this workflow do?',
	'Why did the last run fail?',
	'How can I improve this workflow?',
	'What agents should I add next?',
];

const DEFAULT_WIDTH = 340;
const MIN_WIDTH = 260;
const MAX_WIDTH = 560;

const BASE = env.VITE_API_URL;

export function AiChatPanel({ onCollapse }: { onCollapse: () => void }) {
	const [width, setWidth] = useState(DEFAULT_WIDTH);
	const [input, setInput] = useState('');
	const bottomRef = useRef<HTMLDivElement>(null);
	const dragStartX = useRef<number | null>(null);
	const dragStartWidth = useRef(DEFAULT_WIDTH);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const workflowId = useEditorStore(s => s.workflowId);
	const nodes = useEditorStore(s => s.nodes);
	const edges = useEditorStore(s => s.edges);
	const logs = useEditorStore(s => s.logs);
	const addAgentNode = useEditorStore(s => s.addAgentNode);
	const onConnect = useEditorStore(s => s.onConnect);
	const updateNodeConfig = useEditorStore(s => s.updateNodeConfig);
	const removeNode = useEditorStore(s => s.removeNode);

	const { data: savedMessages } = useQuery({
		queryKey: ['chat-history', workflowId],
		queryFn: async () => {
			const res = await fetch(
				`${BASE}/ai/history?workflowId=${workflowId}`,
				{ credentials: 'include' }
			);
			if (!res.ok) return [];
			const data = (await res.json()) as {
				messages: {
					id: string;
					role: 'user' | 'assistant';
					parts: { type: 'text'; text: string }[];
					metadata: undefined;
				}[];
			};
			return data.messages ?? [];
		},
		enabled: !!workflowId,
		staleTime: Infinity,
	});

	const messagesRef = useRef<typeof messages>([]);

	const saveHistory = useMutation({
		mutationFn: async (msgs: typeof messages) => {
			await fetch(`${BASE}/ai/history`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ workflowId, messages: msgs }),
			});
		},
	});

	const { messages, sendMessage, addToolOutput, status, setMessages } =
		useChat({
			transport: new DefaultChatTransport({
				api: `${BASE}/ai/chat`,
				credentials: 'include',
				body: () => ({
					workflowId,
					canvas: {
						nodes: nodes.map(n => ({
							id: n.id,
							label: n.data.label,
							action: n.data.action,
						})),
						edges: edges.map(e => ({
							id: e.id,
							source: e.source,
							target: e.target,
						})),
					},
					logs: logs
						.slice(-20)
						.map(l => ({ level: l.level, message: l.message })),
				}),
			}),
			sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
			onToolCall({ toolCall }) {
				type TC =
					| {
							toolName: 'add_node';
							toolCallId: string;
							input: { agentId: string; actionKey: string };
					  }
					| {
							toolName: 'connect_nodes';
							toolCallId: string;
							input: { sourceId: string; targetId: string };
					  }
					| {
							toolName: 'configure_node';
							toolCallId: string;
							input: {
								nodeId: string;
								config: {
									parameters?: Record<string, unknown>;
									__links?: Record<string, string>;
									settings?: Record<string, unknown>;
								};
							};
					  }
					| {
							toolName: 'remove_node';
							toolCallId: string;
							input: { nodeId: string };
					  };

				const tc = toolCall as TC;

				if (tc.toolName === 'add_node') {
					void agentService.getById(tc.input.agentId).then(agent => {
						const action = agent.services[
							tc.input.actionKey
						] as ProvanceAction;
						const nodeId = addAgentNode(
							{
								agentId: agent.id,
								label: agent.name,
								image_url: agent.image_url,
							},
							{
								key: tc.input.actionKey,
								label: action.name,
								endpoint: action.endpoint,
								x402: !!action.x402,
                                execution:action.execution,
							}
						);
						addToolOutput({
							tool: 'add_node',
							toolCallId: tc.toolCallId,
							output: nodeId,
						});
					});
				} else if (tc.toolName === 'connect_nodes') {
					onConnect({
						source: tc.input.sourceId,
						target: tc.input.targetId,
						sourceHandle: null,
						targetHandle: null,
					});
					addToolOutput({
						tool: 'connect_nodes',
						toolCallId: tc.toolCallId,
						output: 'done',
					});
				} else if (tc.toolName === 'configure_node') {
					console.log(tc);
					updateNodeConfig(tc.input.nodeId, tc.input.config);
					addToolOutput({
						tool: 'configure_node',
						toolCallId: tc.toolCallId,
						output: 'done',
					});
				} else if (tc.toolName === 'remove_node') {
					removeNode(tc.input.nodeId);
					addToolOutput({
						tool: 'remove_node',
						toolCallId: tc.toolCallId,
						output: 'done',
					});
				}
			},
			onFinish({ message }) {
				const alreadyIn = messagesRef.current.some(
					m => m.id === message.id
				);
				saveHistory.mutate(
					alreadyIn
						? messagesRef.current
						: [...messagesRef.current, message]
				);
			},
		});

	messagesRef.current = messages;

	useEffect(() => {
		if (savedMessages && savedMessages.length > 0) setMessages(savedMessages);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [savedMessages]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const thinking = status === 'streaming' || status === 'submitted';

	const autoResize = (el: HTMLTextAreaElement) => {
		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	};

	const send = useCallback(
		(text: string) => {
			const trimmed = text.trim();
			if (!trimmed || thinking) return;
			setInput('');
			sendMessage({ text: trimmed });
			if (textareaRef.current) textareaRef.current.style.height = 'auto';
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[thinking, sendMessage]
	);

	const onDragMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			dragStartX.current = e.clientX;
			dragStartWidth.current = width;
			const onMouseMove = (ev: MouseEvent) => {
				if (dragStartX.current === null) return;
				const delta = ev.clientX - dragStartX.current;
				setWidth(
					Math.min(
						MAX_WIDTH,
						Math.max(MIN_WIDTH, dragStartWidth.current + delta)
					)
				);
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

	return (
		<div
			className="relative shrink-0 flex flex-col border-r border-white/8 bg-[#0f0f0f]"
			style={{ width }}
		>
			<div
				onMouseDown={onDragMouseDown}
				className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize z-10 hover:bg-white/10 transition-colors"
			/>

			{/* Header */}
			<div className="px-4 py-2 border-b border-white/8 shrink-0 flex items-center justify-between">
				<div className="flex items-center gap-2.5">
					<img
						src="/icons/chat-sparkle.svg"
						alt="Provance Agent"
						width={18}
						height={18}
						className="brightness-0 invert"
					/>
					<span className="text-[13px] font-semibold text-white">
						Provance Agent
					</span>
				</div>
				<button
					onClick={onCollapse}
					className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer rounded-md hover:bg-white/8"
				>
					<PanelLeftClose size={17} strokeWidth={1.5} />
				</button>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 flex flex-col gap-7">
				{messages.length === 0 ? (
					<div className="flex flex-col flex-1 justify-center gap-8">
						<div className="flex flex-col items-center gap-3">
							<img
								src="/icons/chat-sparkle.svg"
								alt="Provance Agent"
								width={32}
								height={32}
								className="brightness-0 invert opacity-80"
							/>
							<div className="flex flex-col items-center gap-1">
								<p className="text-[15px] font-semibold text-white">
									Provance Agent
								</p>
								<p className="text-[12px] text-white/50 text-center leading-relaxed max-w-[200px]">
									Ask me anything. I can see your canvas and recent
									runs.
								</p>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-0.5 px-0.5">
								Try asking
							</p>
							{SUGGESTIONS.map(s => (
								<button
									key={s}
									onClick={() => send(s)}
									className="text-left px-3 py-2.5 text-[12px] text-white/70 hover:text-white border border-white/6 hover:border-white/14 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer leading-snug"
								>
									{s}
								</button>
							))}
						</div>
					</div>
				) : (
					<>
						{messages.map(msg => {
							const text = msg.parts
								.filter(p => p.type === 'text')
								.map(p => (p as { type: 'text'; text: string }).text)
								.join('');
							if (!text && msg.role === 'assistant') return null;
							return (
								<div
									key={msg.id}
									className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
								>
									{msg.role === 'user' ? (
										<div className="max-w-[85%] px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap bg-[#2f2f2f] rounded-lg text-white">
											{text}
										</div>
									) : (
										<MarkdownMessage content={text} />
									)}
								</div>
							);
						})}
						{thinking && (
							<div className="flex flex-col items-start">
								<span className="text-[13px] text-white/60 animate-pulse">
									Thinking...
								</span>
							</div>
						)}
						<div ref={bottomRef} />
					</>
				)}
			</div>

			{/* Input */}
			<div className="shrink-0 p-2">
				<div className="flex flex-col border border-white/15 rounded-lg overflow-hidden">
					<textarea
						ref={textareaRef}
						value={input}
						onChange={e => {
							setInput(e.target.value);
							autoResize(e.target);
						}}
						onKeyDown={e => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								send(input);
							}
						}}
						placeholder="Ask anything about your workflow..."
						rows={1}
						disabled={thinking}
						className="w-full bg-transparent text-[15px] font-medium text-white placeholder:text-white/30 px-3 pt-3 pb-2 outline-none resize-none disabled:opacity-50"
					/>
					<div className="flex items-center justify-between px-1.5 pb-1.5 pt-0">
						<button className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5">
							<Plus size={20} strokeWidth={2.5} />
						</button>
						<button
							onClick={() => send(input)}
							disabled={!input.trim() || thinking}
							className="w-8 h-8 flex items-center justify-center bg-white hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-full"
						>
							{thinking ? (
								<Loader2
									size={13}
									className="animate-spin text-[#141414]"
								/>
							) : (
								<Send
									size={15}
									strokeWidth={2}
									className="text-[#141414]"
								/>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function MarkdownMessage({ content }: { content: string }) {
	return (
		<div className="w-full py-0.5">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					p: ({ children }) => (
						<p className="text-[15px] leading-relaxed text-white mb-4 last:mb-0">
							{children}
						</p>
					),
					strong: ({ children }) => (
						<strong className="font-semibold text-white">
							{children}
						</strong>
					),
					em: ({ children }) => (
						<em className="italic text-white">{children}</em>
					),
					h1: ({ children }) => (
						<p className="text-[17px] font-semibold text-white mt-5 mb-2">
							{children}
						</p>
					),
					h2: ({ children }) => (
						<p className="text-[16px] font-semibold text-white mt-5 mb-2">
							{children}
						</p>
					),
					h3: ({ children }) => (
						<p className="text-[15px] font-semibold text-white mt-4 mb-1.5">
							{children}
						</p>
					),
					ul: ({ children }) => (
						<ul className="text-[15px] text-white mb-4 last:mb-0 pl-5 space-y-2 list-disc">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="text-[15px] text-white mb-4 last:mb-0 pl-5 space-y-2 list-decimal">
							{children}
						</ol>
					),
					li: ({ children }) => (
						<li className="text-[15px] text-white leading-relaxed">
							{children}
						</li>
					),
					code: ({ children, className }) =>
						className?.includes('language-') ? (
							<code className="block text-[13px] font-mono text-white bg-white/6 border border-white/8 rounded px-2.5 py-2 my-1.5 overflow-x-auto whitespace-pre break-all">
								{children}
							</code>
						) : (
							<code className="text-[13px] font-mono text-white bg-white/8 px-1 py-0.5 rounded break-all">
								{children}
							</code>
						),
					pre: ({ children }) => (
						<div className="my-1.5 w-full overflow-hidden">
							{children}
						</div>
					),
					hr: () => <div className="border-t border-white/10 my-2" />,
					a: ({ href, children }) => (
						<a
							href={href}
							target="_blank"
							rel="noreferrer"
							className="text-orange-400 underline underline-offset-2 hover:text-orange-300"
						>
							{children}
						</a>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
