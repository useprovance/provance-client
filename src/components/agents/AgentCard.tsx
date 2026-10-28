import { useState } from 'react';
import { MoreHorizontal, Trash2, ArrowUpRight, Wallet } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AgentModal } from './AgentModal';
import type { Agent } from '@/services/agent.service';

const CHAIN_NAMES: Record<number, string> = {
	1: 'Ethereum',
	8453: 'Base',
	42220: 'Celo',
	137: 'Polygon',
	10: 'Optimism',
	42161: 'Arbitrum',
	56: 'BSC',
	100: 'Gnosis',
	2345: 'GOAT',
};

interface AgentCardProps {
	agent: Agent;
	onDelete: (id: string) => void;
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<>
			<div
				onClick={() => setModalOpen(true)}
				className="relative flex flex-col bg-[#141414] hover:bg-[#181818] border border-[#222] hover:border-[#2e2e2e] transition-colors overflow-hidden rounded-md cursor-pointer"
			>
				<div className="relative h-16 shrink-0">
					<div
						className="absolute inset-0"
						style={{ backgroundColor: 'rgba(204,189,159,0.06)' }}
					/>
					<div
						className="absolute inset-0"
						style={{
							WebkitMaskImage: "url('/icons/dots.svg')",
							WebkitMaskSize: '7px 7px',
							maskImage: "url('/icons/dots.svg')",
							maskSize: '7px 7px',
							backgroundColor: 'rgba(204,189,159,0.12)',
						}}
					/>
					<div
						className="absolute top-3 right-4 z-10"
						onClick={e => e.stopPropagation()}
					>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="w-8 h-8 rounded-full bg-[#1a1a1a]/80 flex items-center justify-center text-sand/50 hover:text-sand/80 transition-colors cursor-pointer border border-[#333]">
									<MoreHorizontal size={15} strokeWidth={1.5} />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-44 bg-[#1c1c1c] border border-[#2a2a2a] p-1"
							>
								<DropdownMenuItem
									onClick={() => onDelete(agent.id)}
									className="cursor-pointer px-3 py-2 text-[13px] text-red-400/70 focus:text-red-400 focus:bg-red-400/8 gap-2.5 [&_svg]:!size-[14px]"
								>
									<Trash2 strokeWidth={1.5} />
									Remove
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<div className="absolute top-[40px] left-5 w-12 h-12 bg-[#1a1a1a] border border-[#333] flex items-center justify-center z-10 rounded-full overflow-hidden">
					{agent.image_url ? (
						<img
							src={agent.image_url}
							alt={agent.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<span className="text-white/20 text-lg">◈</span>
					)}
				</div>

				<div className="flex flex-col gap-4 p-5 pt-10 flex-1">
					<div>
						<p className="text-[12px] text-sand/40 mb-0.5 font-mono">
							{CHAIN_NAMES[agent.chain_id] ?? `Chain ${agent.chain_id}`}
						</p>
						<p className="text-[18px] font-semibold text-sand leading-tight font-geist line-clamp-1">
							{agent.name}
						</p>
					</div>

					<div className="flex items-center gap-2 flex-wrap">
						<span className="flex items-center gap-1.5 text-[12px] font-medium text-sand/80 px-2.5 py-1 bg-white/5">
							<span
								className={`w-2 h-2 rounded-full shrink-0 ${agent.is_active ? 'bg-emerald-400' : 'bg-sand/30'}`}
							/>
							{agent.is_active ? 'Active' : 'Inactive'}
						</span>
						<span className="flex items-center gap-1.5 text-[12px] font-mono text-sand/80 px-2.5 py-1 bg-white/5">
							<Wallet size={13} strokeWidth={1.5} className="shrink-0" />
							<p>
								{agent.owner_address.slice(0, 4)}…
								{agent.owner_address.slice(-4)}
							</p>
						</span>
					</div>

					<div className="flex-1" />

					<div className="flex items-center justify-between pt-5 border-t border-white/5">
						<p className="text-[12px] text-sand/60">
							{new Date(agent.created_at).toLocaleDateString('en-GB', {
								day: 'numeric',
								month: 'short',
								year: 'numeric',
							})}
						</p>
						<button
							onClick={() => setModalOpen(true)}
							className="flex items-center gap-1.5 bg-sand hover:bg-sand-light text-ink-dark text-[13px] font-semibold px-6 py-2 transition-colors cursor-pointer"
							style={{
								clipPath:
									'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
							}}
						>
							Open
							<ArrowUpRight size={14} strokeWidth={2} />
						</button>
					</div>
				</div>
			</div>

			<AgentModal
				agent={agent}
				open={modalOpen}
				onOpenChange={setModalOpen}
				onDelete={() => onDelete(agent.id)}
			/>
		</>
	);
}
