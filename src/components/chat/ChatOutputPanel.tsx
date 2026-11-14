import { X, GitBranch } from 'lucide-react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '@/services/workflow.service';
import type { Chat } from '@/services/chat.service';

interface ChatOutputPanelProps {
	chatId: string;
	onClose: () => void;
	onSelect: (workflowId: string) => void;
}

export function ChatOutputPanel({ chatId, onClose, onSelect }: ChatOutputPanelProps) {
	const queryClient = useQueryClient();

	const chat = queryClient.getQueryData<Chat[]>(['chats'])?.find(c => c.id === chatId);
	const workflowOutputs = (chat?.outputs ?? []).filter(o => o.type === 'workflow');

	const workflowQueries = useQueries({
		queries: workflowOutputs.map(o => ({
			queryKey: ['workflow', o.id],
			queryFn: () => workflowService.getById(o.id),
			staleTime: 60_000,
		})),
	});

	const workflows = workflowQueries.map(q => q.data).filter(Boolean);
	const isLoading = workflowQueries.some(q => q.isLoading);

	return (
		<div className="flex flex-col w-96 shrink-0 border-l border-white/8 bg-[#141414] h-full">
			{/* Header */}
			<div className="flex items-center justify-between px-5 h-12 shrink-0 border-b border-white/8">
				<p className="text-[13px] font-semibold text-white">Outputs</p>
				<button
					onClick={onClose}
					className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
				>
					<X size={13} strokeWidth={2} className="text-white/60" />
				</button>
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto py-1">
				{isLoading ? (
					<div className="flex items-center justify-center h-24">
						<p className="text-[12px] text-white/30">Loading...</p>
					</div>
				) : workflows.length === 0 ? (
					<div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 py-10">
						<div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
							<GitBranch size={18} strokeWidth={1.5} className="text-white" />
						</div>
						<div className="text-center">
							<p className="text-[13px] font-medium text-white">No outputs yet</p>
							<p className="text-[12px] text-white/60 mt-1">Workflows built in this chat will show up here</p>
						</div>
					</div>
				) : (
					<>
						{workflows.map(wf => (
							<button
								key={wf!.id}
								onClick={() => onSelect(wf!.id)}
								className="flex items-center w-full py-2 px-1 mx-1 rounded-md text-white/50 hover:bg-white/8 hover:text-white/85 transition-colors cursor-pointer"
								style={{ width: 'calc(100% - 8px)' }}
							>
								<span className="w-10 shrink-0 flex items-center justify-center">
									<GitBranch size={18} strokeWidth={1.5} />
								</span>
								<span className="text-[14px] font-medium truncate pr-3">{wf!.name}</span>
							</button>
						))}
					</>
				)}
			</div>
		</div>
	);
}
