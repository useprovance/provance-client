import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { chatService } from '@/services/chat.service';
import { ChatInput } from '@/components/chat/ChatInput';

const SUGGESTIONS = [
	'Send a tweet when someone stars my GitHub repo',
	'Email me daily crypto prices at 9am',
	'Post to Slack when a new user signs up',
	'Summarize my emails every morning',
];

export default function NewChatPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const createChat = useMutation({
		mutationFn: (text: string) => chatService.create(text),
	});

	const send = async (text: string) => {
		createChat.mutate(text, {
			onSuccess: async (chat) => {
				await queryClient.invalidateQueries({ queryKey: ['chats'] });
				queryClient.setQueryData(['pending-chat-text', chat.id], text);
				navigate(`/app/chat/${chat.id}`);
			},
		});
	};

	return (
		<div className="flex flex-col h-full bg-[#0f0f0f]">
			<div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
				<div className="flex flex-col items-center gap-3">
					<img src="/icons/chat-sparkle.svg" alt="Provance" width={36} height={36} className="brightness-0 invert opacity-90" />
					<div className="flex flex-col items-center gap-1 text-center">
						<p className="text-[18px] font-semibold text-white">What do you want to build?</p>
						<p className="text-[13px] text-white/50 max-w-xs leading-relaxed">
							Describe a task and I will build and run a workflow for you.
						</p>
					</div>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
					{SUGGESTIONS.map(s => (
						<button
							key={s}
							onClick={() => send(s)}
							className="text-left px-4 py-3 text-[13px] text-white/70 hover:text-white border border-white/8 hover:border-white/16 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer leading-snug"
						>
							{s}
						</button>
					))}
				</div>
			</div>

			<div className="shrink-0 px-4 pb-6 pt-2 max-w-2xl mx-auto w-full">
				<ChatInput onSend={send} disabled={createChat.isPending} />
			</div>
		</div>
	);
}
