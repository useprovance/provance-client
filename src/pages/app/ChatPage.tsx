import { useCallback, useEffect, useState } from 'react';
import {
	MessageCircle,
	ChevronDown,
	Pencil,
	Trash2,
	X,
	List,
} from 'lucide-react';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatAI, type ProvanceMessage } from '@/hooks/useChatAI';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router';
import { chatService, type Chat } from '@/services/chat.service';
import { MarkdownMessage } from '@/components/chat/MarkdownMessage';
import { WorkflowCard } from '@/components/chat/WorkflowCard';
import { ChatOutputPanel } from '@/components/chat/ChatOutputPanel';
import { ChatWorkflowPanel } from '@/components/chat/ChatWorkflowPanel';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FormInput } from '@/components/ui/form-input';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ChatPage() {
	const { id: chatId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [renameOpen, setRenameOpen] = useState(false);
	const [renameValue, setRenameValue] = useState('');
	const [workflowsOpen, setWorkflowsOpen] = useState(false);
	const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

	const chat = queryClient
		.getQueryData<Chat[]>(['chats'])
		?.find(c => c.id === chatId);
	const title = chat?.title ?? 'Chat';

	const pendingText = queryClient.getQueryData<string>(['pending-chat-text', chatId]);

	const { data: savedMessages } = useQuery({
		queryKey: ['chat-messages', chatId],
		queryFn: () => chatService.getMessages(chatId!),
		enabled: !!chatId,
	});

	const renameChat = useMutation({
		mutationFn: (newTitle: string) => chatService.rename(chatId!, newTitle),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chats'] }),
	});

	const deleteChat = useMutation({
		mutationFn: () => chatService.remove(chatId!),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['chats'] });
			navigate('/app/chat');
		},
	});

	const { messages, sendMessage, status } = useChatAI({
		chatId: chatId!,
		initialMessages: savedMessages,
	});

	useEffect(() => {
		if (pendingText) {
			queryClient.removeQueries({ queryKey: ['pending-chat-text', chatId] });
			sendMessage({ text: pendingText });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pendingText]);

	const thinking = status === 'streaming' || status === 'submitted';

	const send = useCallback(
		(text: string) => sendMessage({ text }),
		[sendMessage]
	);

	return (
		<>
			<div className="flex h-full bg-[#0f0f0f]">
			<div className="flex flex-col flex-1 min-w-[480px]">
				{/* Header */}
				<div className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-white/8 z-10">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-white hover:bg-white/8 transition-colors cursor-pointer group/trigger">
								<MessageCircle size={20} strokeWidth={1.5} className="text-white shrink-0" />
								<span className="text-[14px] font-medium text-white max-w-[200px] truncate">{title}</span>
								<ChevronDown size={14} strokeWidth={2} className="text-white/70 shrink-0 group-hover/trigger:text-white transition-colors" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent side="bottom" align="start" className="w-52 bg-[#1a1a1a] border border-white/10 p-1 shadow-2xl">
							<DropdownMenuItem
								onSelect={() => { setRenameValue(title); setRenameOpen(true); }}
								className="cursor-pointer px-3 py-2 text-[13px] text-white focus:text-white focus:bg-white/8 gap-3 [&_svg]:!size-[15px]"
							>
								<Pencil strokeWidth={1.5} />
								Rename
							</DropdownMenuItem>
							<DropdownMenuSeparator className="bg-white/10" />
							<DropdownMenuItem
								onSelect={() => deleteChat.mutate()}
								className="cursor-pointer px-3 py-2 text-[13px] text-red-400 focus:text-red-400 focus:bg-red-400/8 gap-3 [&_svg]:!size-[15px]"
							>
								<Trash2 strokeWidth={1.5} />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<button
						onClick={() => setWorkflowsOpen(v => !v)}
						className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${workflowsOpen ? 'bg-white/8 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}
					>
						<List size={20} strokeWidth={1.5} />
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="flex-1 overflow-y-auto">
						{messages.length === 0 ? (
							<div className="flex items-center justify-center h-full">
								<p className="text-[13px] text-white/30">Start the conversation</p>
							</div>
						) : (
							<MessageList
								messages={messages}
								thinking={thinking}
								onOpenWorkflow={(id) => { setSelectedWorkflowId(id); setWorkflowsOpen(true); }}
							/>
						)}
					</div>

					{/* Input */}
					<div className="shrink-0 px-4 pb-6 pt-2 max-w-2xl mx-auto w-full">
						<ChatInput onSend={send} disabled={thinking} />
					</div>
				</div>
			</div>

			{/* Side panels — full height */}
			{workflowsOpen && !selectedWorkflowId && (
				<ChatOutputPanel
					chatId={chatId!}
					onClose={() => setWorkflowsOpen(false)}
					onSelect={(id) => setSelectedWorkflowId(id)}
				/>
			)}
			{workflowsOpen && selectedWorkflowId && (
				<ChatWorkflowPanel
					workflowId={selectedWorkflowId}
					onBack={() => setSelectedWorkflowId(null)}
					onClose={() => { setWorkflowsOpen(false); setSelectedWorkflowId(null); }}
				/>
			)}
		</div>

			{/* Rename modal */}
			<Dialog open={renameOpen} onOpenChange={setRenameOpen}>
				<DialogContent
					aria-describedby={undefined}
					className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[420px] [&>button]:hidden"
				>
					<DialogTitle className="sr-only">Rename chat</DialogTitle>
					<div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
						<p className="text-[15px] font-semibold text-white font-manrope">Rename chat</p>
						<button
							onClick={() => setRenameOpen(false)}
							className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer"
						>
							<X size={14} strokeWidth={2} className="text-white/70" />
						</button>
					</div>
					<div className="px-6 py-6">
						<FormInput label="Chat name" value={renameValue} onChange={setRenameValue} placeholder="Enter a new name" />
					</div>
					<div className="px-6 py-4 border-t border-white/8 flex items-center justify-between">
						<button
							onClick={() => setRenameOpen(false)}
							className="text-[13px] text-white/40 hover:text-white transition-colors cursor-pointer"
						>
							Cancel
						</button>
						<button
							onClick={() => {
								const trimmed = renameValue.trim();
								if (trimmed && trimmed !== title) renameChat.mutate(trimmed);
								setRenameOpen(false);
							}}
							disabled={!renameValue.trim()}
							className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-6 py-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
							style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
						>
							Save
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

function MessageList({
	messages,
	thinking,
	onOpenWorkflow,
}: {
	messages: ProvanceMessage[];
	thinking: boolean;
	onOpenWorkflow: (id: string) => void;
}) {
	return (
		<div className="flex flex-col gap-6 px-4 py-8 max-w-2xl mx-auto w-full">
			{messages.map(msg => {
				if (msg.role === 'user') {
					const text = msg.parts.filter(p => p.type === 'text').map(p => p.text).join('');
					if (!text) return null;
					return (
						<div key={msg.id} className="flex justify-end">
							<div className="max-w-[80%] px-4 py-2.5 text-[15px] leading-relaxed bg-[#232323] rounded-[18px] rounded-br-[4px] text-white">
								{text}
							</div>
						</div>
					);
				}
				const hasContent = msg.parts.some(p => p.type === 'text' || p.type === 'data-workflow');
				if (!hasContent) return null;
				return (
					<div key={msg.id} className="flex justify-start">
						<div className="max-w-[90%]">
							{msg.parts.map((p, i) => {
								if (p.type === 'text' && p.text) return <MarkdownMessage key={i} content={p.text} />;
								if (p.type === 'data-workflow') return <WorkflowCard key={i} id={p.data.id} name={p.data.name} onOpen={onOpenWorkflow} />;
								return null;
							})}
						</div>
					</div>
				);
			})}
			{thinking && (
				<div className="flex justify-start">
					<span className="text-[13px] text-white/40 animate-pulse">Thinking...</span>
				</div>
			)}
		</div>
	);
}
