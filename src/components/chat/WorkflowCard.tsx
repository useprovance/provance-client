import { GitBranch } from 'lucide-react';

interface WorkflowCardProps {
	id: string;
	name: string;
	onOpen: (workflowId: string) => void;
}

export function WorkflowCard({ id, name, onOpen }: WorkflowCardProps) {
	return (
		<button
			onClick={() => onOpen(id)}
			className="flex items-center gap-3 mt-2 px-4 py-3 bg-white/5 border border-white/8 rounded-xl hover:bg-white/8 transition-colors cursor-pointer w-full max-w-xs text-left"
		>
			<div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
				<GitBranch size={15} strokeWidth={1.5} className="text-white/60" />
			</div>
			<div className="min-w-0">
				<p className="text-[13px] font-medium text-white truncate">{name}</p>
				<p className="text-[11px] text-white/40">Workflow</p>
			</div>
		</button>
	);
}
