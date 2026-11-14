import { useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithToolCalls,
	type UIMessage,
} from 'ai';
import { useQueryClient } from '@tanstack/react-query';
import { useEditorStore } from '@/stores/editor.store';
import { workflowService } from '@/services/workflow.service';
import { chatService } from '@/services/chat.service';
import { agentService, type ProvanceAction } from '@/services/agent.service';
import { env } from '@/utils/env.utils';

const BASE = env.VITE_API_URL;

type ProvanceTools = {
	create_workflow: {
		input: { name: string };
		output: { id: string; name: string };
	};
	add_node: {
		input: { workflowId: string; agentId: string; actionKey: string };
		output: string;
	};
	connect_nodes: {
		input: { workflowId: string; sourceId: string; targetId: string };
		output: string;
	};
	disconnect_nodes: {
		input: { workflowId: string; sourceId: string; targetId: string };
		output: string;
	};
	configure_node: {
		input: {
			workflowId: string;
			nodeId: string;
			config: {
				parameters?: Record<string, string>;
				__links?: Record<string, string>;
			};
		};
		output: string;
	};
	remove_node: {
		input: { workflowId: string; nodeId: string };
		output: string;
	};
	run_workflow: {
		input: { workflowId: string; reason: string };
		output: string;
	};
};

type ProvanceDataParts = {
	workflow: { id: string; name: string };
};

export type ProvanceMessage = UIMessage<unknown, ProvanceDataParts, ProvanceTools>;

export function useChatAI({
	chatId,
	initialMessages,
}: {
	chatId: string;
	initialMessages?: UIMessage[];
}) {
	const queryClient = useQueryClient();
	const messagesRef = useRef<ProvanceMessage[]>([]);

	const initCanvas = useEditorStore(s => s.initCanvas);
	const addAgentNode = useEditorStore(s => s.addAgentNode);
	const onConnect = useEditorStore(s => s.onConnect);
	const onEdgesChange = useEditorStore(s => s.onEdgesChange);
	const updateNodeConfig = useEditorStore(s => s.updateNodeConfig);
	const removeNode = useEditorStore(s => s.removeNode);
	const triggerRun = useEditorStore(s => s.triggerRun);

	const { messages, sendMessage, addToolOutput, status, setMessages } =
		useChat<ProvanceMessage>({
			id: chatId,
			messages: (initialMessages ?? []) as ProvanceMessage[],
			transport: new DefaultChatTransport({
				api: `${BASE}/ai/chat`,
				credentials: 'include',
				body: { chatId },
			}),
			sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
			async onToolCall({ toolCall }) {
				if (toolCall.dynamic) return;
				if (toolCall.toolName === 'create_workflow') {
					const workflow = await workflowService.create({
						name: toolCall.input.name,
					});
					await chatService.addOutput(chatId, {
						type: 'workflow',
						id: workflow.id,
					});
					initCanvas(workflow);
					setMessages(prev => {
						const last = prev[prev.length - 1];
						if (!last) return prev;
						return [
							...prev.slice(0, -1),
							{ ...last, parts: [...last.parts, { type: 'data-workflow' as const, data: { id: workflow.id, name: workflow.name } }] },
						];
					});
					addToolOutput({
						tool: 'create_workflow',
						toolCallId: toolCall.toolCallId,
						output: { id: workflow.id, name: workflow.name },
					});
				} else if (toolCall.toolName === 'add_node') {
					const agent = await agentService.getById(toolCall.input.agentId);
					const action = agent.services[
						toolCall.input.actionKey
					] as ProvanceAction;
					const nodeId = addAgentNode(
						{
							agentId: agent.id,
							label: agent.name,
							image_url: agent.image_url,
						},
						{
							key: toolCall.input.actionKey,
							label: action.name,
							endpoint: action.endpoint,
							x402: !!action.x402,
						}
					);
					addToolOutput({
						tool: 'add_node',
						toolCallId: toolCall.toolCallId,
						output: nodeId,
					});
				} else if (toolCall.toolName === 'connect_nodes') {
					onConnect({
						source: toolCall.input.sourceId,
						target: toolCall.input.targetId,
						sourceHandle: null,
						targetHandle: null,
					});
					addToolOutput({
						tool: 'connect_nodes',
						toolCallId: toolCall.toolCallId,
						output: 'done',
					});
				} else if (toolCall.toolName === 'disconnect_nodes') {
					const edge = useEditorStore.getState().edges.find(
						e => e.source === toolCall.input.sourceId && e.target === toolCall.input.targetId
					);
					if (edge) onEdgesChange([{ type: 'remove', id: edge.id }]);
					addToolOutput({
						tool: 'disconnect_nodes',
						toolCallId: toolCall.toolCallId,
						output: edge ? 'done' : 'edge not found',
					});
				} else if (toolCall.toolName === 'configure_node') {
					updateNodeConfig(toolCall.input.nodeId, toolCall.input.config);
					addToolOutput({
						tool: 'configure_node',
						toolCallId: toolCall.toolCallId,
						output: 'done',
					});
				} else if (toolCall.toolName === 'remove_node') {
					removeNode(toolCall.input.nodeId);
					addToolOutput({
						tool: 'remove_node',
						toolCallId: toolCall.toolCallId,
						output: 'done',
					});
				} else if (toolCall.toolName === 'run_workflow') {
					await triggerRun();
					addToolOutput({
						tool: 'run_workflow',
						toolCallId: toolCall.toolCallId,
						output: 'done',
					});
				}
			},
			async onFinish({ message }) {
					const all = messagesRef.current.some(m => m.id === message.id)
						? messagesRef.current
						: [...messagesRef.current, message];
					await chatService.saveMessages(chatId, all);
					await queryClient.invalidateQueries({ queryKey: ['chats'] });
					await queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
				},
		});

	messagesRef.current = messages;

	return { messages, sendMessage, status, setMessages };
}
