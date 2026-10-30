import { useState } from "react";
import { X, ArrowUpRight, Zap, Loader2 } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { createPublicClient, createWalletClient, custom } from "viem";
import { useWallets, useConnectWallet } from "@privy-io/react-auth";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { agentService, type ProvanceAction } from "@/services/agent.service";
import { useEditorStore } from "@/stores/editor.store";
import type { NodePayment, PaymentContext } from "@/services/workflow.service";

export interface PaymentPlanItem {
   nodeId: string;
   agentId: string;
   agentName: string;
   agentImage: string | null;
   actionLabel: string;
   amount: number;
   token: string;
   tokenAddress: `0x${string}`;
   walletAddress: `0x${string}`;
   chainId: number;
}

interface WorkflowPaymentModalProps {
   isOpen: boolean;
   onClose: () => void;
}

const cutCorner = 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)';

const permitAbi = [
   { name: 'nonces',   type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
   { name: 'name',     type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
   { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
] as const;

export function WorkflowPaymentModal({ isOpen, onClose }: WorkflowPaymentModalProps) {
   const nodes = useEditorStore(s => s.nodes);
   const triggerRun = useEditorStore(s => s.triggerRun);
   const { wallets } = useWallets();
   const { connectWallet } = useConnectWallet();
   const [signing, setSigning] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const x402Nodes = nodes.filter(n => n.data.action?.x402);

   const agentQueries = useQueries({
      queries: x402Nodes.map(n => ({
         queryKey: ['agent', n.data.nodeId],
         queryFn: () => agentService.getById(n.data.nodeId),
         enabled: isOpen,
      })),
   });

   const plan = agentQueries.reduce<PaymentPlanItem[]>((acc, q, i) => {
      const node = x402Nodes[i];
      const action = q.data?.services[node.data.action.key] as ProvanceAction | undefined;
      if (!q.data || !action?.payment) return acc;
      acc.push({
         nodeId: node.id,
         agentId: node.data.nodeId,
         agentName: q.data.name,
         agentImage: q.data.image_url,
         actionLabel: node.data.action.label,
         amount: action.payment.amount,
         token: action.payment.token,
         tokenAddress: action.payment.tokenAddress as `0x${string}`,
         walletAddress: action.payment.walletAddress as `0x${string}`,
         chainId: action.payment.chainId,
      });
      return acc;
   }, []);

   const total = plan.reduce((sum, p) => sum + p.amount, 0);
   const loading = agentQueries.some(q => q.isLoading);

   async function handleConfirm() {
      const wallet = wallets[wallets.length - 1] ?? null;
      if (!wallet) { connectWallet(); return; }

      setSigning(true);
      setError(null);
      try {
         await wallet.switchChain(plan[0].chainId);
         const provider = await wallet.getEthereumProvider();
         const transport = custom(provider);
         const walletClient = createWalletClient({ transport });
         const publicClient = createPublicClient({ transport });
         const [owner] = await walletClient.requestAddresses();
         const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

         const payments: NodePayment[] = await Promise.all(
            plan.map(async (item) => {
               const [nonce, tokenName, decimals] = await Promise.all([
                  publicClient.readContract({ address: item.tokenAddress, abi: permitAbi, functionName: 'nonces', args: [owner] }),
                  publicClient.readContract({ address: item.tokenAddress, abi: permitAbi, functionName: 'name' }),
                  publicClient.readContract({ address: item.tokenAddress, abi: permitAbi, functionName: 'decimals' }),
               ]);

               const value = BigInt(Math.round(item.amount * 10 ** decimals));

               const sig = await walletClient.signTypedData({
                  account: owner,
                  domain: { name: tokenName, version: '2', chainId: item.chainId, verifyingContract: item.tokenAddress },
                  types: {
                     Permit: [
                        { name: 'owner',    type: 'address' },
                        { name: 'spender',  type: 'address' },
                        { name: 'value',    type: 'uint256' },
                        { name: 'nonce',    type: 'uint256' },
                        { name: 'deadline', type: 'uint256' },
                     ],
                  },
                  primaryType: 'Permit',
                  message: { owner, spender: item.walletAddress, value, nonce, deadline },
               });

               return {
                  nodeId: item.nodeId,
                  agentId: item.agentId,
                  amount: item.amount,
                  token: item.token,
                  tokenAddress: item.tokenAddress,
                  walletAddress: item.walletAddress,
                  chainId: item.chainId,
                  permit: {
                     owner,
                     spender: item.walletAddress,
                     tokenAddress: item.tokenAddress,
                     chainId: item.chainId,
                     amount: value,
                     nonce,
                     deadline,
                     v: parseInt(sig.slice(130, 132), 16),
                     r: `0x${sig.slice(2, 66)}` as `0x${string}`,
                     s: `0x${sig.slice(66, 130)}` as `0x${string}`,
                  },
               };
            })
         );

         const paymentContext: PaymentContext = { payments };
         await triggerRun(paymentContext);
         onClose();
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Signing failed');
      } finally {
         setSigning(false);
      }
   }

   return (
      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[420px] [&>button]:hidden overflow-hidden"
         >
            <DialogTitle className="sr-only">Authorize payments</DialogTitle>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
               <p className="text-[14px] font-semibold text-white font-manrope">Authorize payments</p>
               <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
               >
                  <X size={13} strokeWidth={2} />
               </button>
            </div>

            {/* Body */}
            <div className="flex flex-col px-5 py-4 gap-4">
               <p className="text-[13px] text-white/70 leading-relaxed">
                  This workflow includes paid actions. Sign a gasless permit for each one — nothing leaves your wallet until the action runs.
               </p>

               {/* Payment list */}
               <div className="flex flex-col gap-2">
                  {loading
                     ? [1, 2].map(i => (
                        <div key={i} className="h-12 rounded bg-white/4 animate-pulse" />
                     ))
                     : plan.map((item) => (
                        <div
                           key={item.nodeId}
                           className="flex items-center justify-between px-4 py-3 bg-white/4 ring-1 ring-white/8 ring-offset-2 ring-offset-[#141414]"
                        >
                           <div className="flex items-center gap-2.5">
                              {item.agentImage ? (
                                 <img src={item.agentImage} alt={item.agentName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                              ) : (
                                 <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                    <span className="text-[9px] font-bold text-white/60">{item.agentName[0]}</span>
                                 </div>
                              )}
                              <span className="text-[13px] text-white/70">{item.actionLabel}</span>
                           </div>
                           <span className="text-[14px] font-semibold text-white shrink-0 ml-4">
                              ${item.amount} <span className="text-white/55 text-[12px] font-normal">{item.token}</span>
                           </span>
                        </div>
                     ))
                  }
               </div>

               {/* Total */}
               <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
                  <span className="text-[12px] text-white/60">Total</span>
                  <span className="text-[15px] font-semibold text-white">${total.toFixed(4)}</span>
               </div>

               {/* Info row */}
               <div className="flex items-start gap-3 px-3 py-3 bg-white/3 border border-dashed border-white/8">
                  <Zap size={15} className="text-white/60 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-white/65 leading-relaxed">
                     Uses EIP-2612 gasless permits on GOAT Network. No gas fees. Funds only move if the action succeeds.
                  </p>
               </div>

               {error && (
                  <p className="text-[12px] text-red-400">{error}</p>
               )}
            </div>

            {/* Footer */}
            <div className="flex items-center px-5 py-4 border-t border-white/8">
               <button
                  onClick={() => { void handleConfirm(); }}
                  disabled={signing || loading}
                  style={{ clipPath: cutCorner }}
                  className="flex-1 h-10 flex items-center justify-center gap-2 text-[13px] font-semibold text-ink-dark bg-sand hover:bg-sand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
               >
                  {signing ? <Loader2 size={15} className="animate-spin" /> : <><span>Sign & run</span><ArrowUpRight size={15} strokeWidth={2.5} /></>}
               </button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
