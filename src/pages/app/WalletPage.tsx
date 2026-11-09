import { useEffect, useRef } from "react";
import { Wallet, Copy, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnectWallet, useWallets } from "@privy-io/react-auth";
import { WalletBlockie } from "@/components/shared/WalletBlockie";
import { walletService, type SavedWallet, type WalletChain } from "@/services/wallet.service";
import { CHAIN_ID_TO_WALLET_CHAIN } from "@/lib/wagmi";


export default function WalletPage() {
	const queryClient = useQueryClient();
	const { connectWallet } = useConnectWallet();
	const { wallets: privyWallets } = useWallets();
	const connectedAddresses = new Set(privyWallets.map(w => w.address.toLowerCase()));
	const savedAddresses = useRef<Set<string>>(new Set());

	const { data: wallets = [] } = useQuery({
		queryKey: ["wallets"],
		queryFn: () => walletService.list(),
	});

	const addMutation = useMutation({
		mutationFn: ({ address, chain }: { address: string; chain: WalletChain }) =>
			walletService.add(address, chain),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["wallets"] });
			toast.success("Wallet added");
		},
		onError: (err: Error) => {
			const msg = err.message ?? "Failed to add wallet";
			if (msg.includes("already")) toast("Wallet already added", { icon: "ℹ️" });
			else toast.error(msg);
		},
	});

	const removeMutation = useMutation({
		mutationFn: (id: string) => walletService.remove(id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["wallets"] });
			toast.success("Wallet removed");
		},
		onError: () => toast.error("Failed to remove wallet"),
	});

	// When Privy connects a new wallet, auto-save it
	useEffect(() => {
		for (const w of privyWallets) {
			if (savedAddresses.current.has(w.address.toLowerCase())) continue;
			savedAddresses.current.add(w.address.toLowerCase());
			const chainId = w.chainId ? parseInt(w.chainId.replace("eip155:", ""), 10) : 0;
			const chain = (CHAIN_ID_TO_WALLET_CHAIN[chainId] ?? "evm") as WalletChain;
			addMutation.mutate({ address: w.address, chain });
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [privyWallets]);

	return (
		<div className="p-8 h-full overflow-y-auto">
			<div className="flex items-center gap-2.5">
				<div className="flex size-9 items-center justify-center rounded-full bg-white/8 shrink-0">
					<Wallet className="size-4 text-white/60" />
				</div>
				<h1 className="text-2xl font-semibold text-white font-manrope">Wallet</h1>
			</div>

			<div className="mt-5 flex items-center justify-between gap-4">
				<p className="text-[13px] text-white/40">Wallets linked to your account for on-chain payments and agent interactions.</p>
				<button
					onClick={() => connectWallet()}
					className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 shrink-0 transition-colors cursor-pointer"
					style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
				>
					<Plus size={13} strokeWidth={2.5} />
					Add Wallet
				</button>
			</div>

			<div className="mt-6">
				{wallets.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-sand/10">
						<p className="text-[13px] text-sand/30">No wallets added yet</p>
						<button
							onClick={() => connectWallet()}
							className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 transition-colors cursor-pointer"
							style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
						>
							<Plus size={13} strokeWidth={2.5} />
							Add your first wallet
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{wallets.map((w: SavedWallet) => {
							const isConnected = connectedAddresses.has(w.address.toLowerCase());
							return (
							<div key={w.id} className={`flex items-center gap-4 px-5 py-4 border rounded-lg ${isConnected ? 'border-white/20 bg-white/5' : 'border-white/8 bg-[#161616]'}`}>
								<WalletBlockie address={w.address} size={44} />
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<p className="text-[13px] text-white font-mono truncate">
											{w.address.slice(0, 6)}...{w.address.slice(-6)}
										</p>
										{isConnected && (
											<span className="text-[9px] font-bold uppercase tracking-widest text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded shrink-0">connected</span>
										)}
									</div>
									<p className="text-[11px] text-white/40 mt-0.5 uppercase tracking-wider">{w.chain}</p>
								</div>
								<div className="flex items-center gap-1">
									<button
										onClick={() => {
											void navigator.clipboard.writeText(w.address);
											toast.success("Address copied");
										}}
										className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white transition-colors cursor-pointer"
									>
										<Copy size={15} strokeWidth={1.5} />
									</button>
									<button
										onClick={() => removeMutation.mutate(w.id)}
										disabled={removeMutation.isPending}
										className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
									>
										<Trash2 size={15} strokeWidth={1.5} />
									</button>
								</div>
							</div>
						);})}
					</div>
				)}
			</div>
		</div>
	);
}
