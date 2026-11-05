import { useState } from "react";
import { X, ArrowUpRight, Zap, Loader2 } from "lucide-react";
import { createPublicClient, createWalletClient, custom, parseUnits } from "viem";
import { useWallets, useConnectWallet } from "@privy-io/react-auth";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEditorStore } from "@/stores/editor.store";
import { workflowService } from "@/services/workflow.service";

const cutCorner = 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)';

const permitAbi = [
   { name: 'nonces',   type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
   { name: 'name',     type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
   { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
] as const;

export function WorkflowPaymentModal() {
   const pendingPayment = useEditorStore(s => s.pendingPayment);
   const clearPendingPayment = useEditorStore(s => s.clearPendingPayment);
   const stopRun = useEditorStore(s => s.stopRun);
   const { wallets } = useWallets();
   const { connectWallet } = useConnectWallet();
   const [signing, setSigning] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const isOpen = pendingPayment !== null;

   function handleClose() {
      if (signing) return;
      clearPendingPayment();
      stopRun();
      setError(null);
   }

   async function handleConfirm() {
      if (!pendingPayment) return;
      const wallet = wallets[wallets.length - 1] ?? null;
      if (!wallet) { connectWallet(); return; }

      setSigning(true);
      setError(null);
      try {
         await wallet.switchChain(pendingPayment.chainId);
         const provider = await wallet.getEthereumProvider();
         const transport = custom(provider);
         const walletClient = createWalletClient({ transport });
         const publicClient = createPublicClient({ transport });
         const [owner] = await walletClient.requestAddresses();
         const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

         const [nonce, tokenName, decimals] = await Promise.all([
            publicClient.readContract({ address: pendingPayment.tokenAddress, abi: permitAbi, functionName: 'nonces', args: [owner] }),
            publicClient.readContract({ address: pendingPayment.tokenAddress, abi: permitAbi, functionName: 'name' }),
            publicClient.readContract({ address: pendingPayment.tokenAddress, abi: permitAbi, functionName: 'decimals' }),
         ]);

         const value = parseUnits(pendingPayment.totalAmount.toFixed(decimals),decimals);

         const sig = await walletClient.signTypedData({
            account: owner,
            domain: { name: tokenName, version: '2', chainId: pendingPayment.chainId, verifyingContract: pendingPayment.tokenAddress },
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
            message: { owner, spender: pendingPayment.walletAddress, value, nonce, deadline },
         });

         await workflowService.submitPayment(pendingPayment.runId, {
            owner,
            spender: pendingPayment.walletAddress,
            tokenAddress: pendingPayment.tokenAddress,
            chainId: pendingPayment.chainId,
            amount: value,
            nonce,
            deadline,
            v: parseInt(sig.slice(130, 132), 16),
            r: `0x${sig.slice(2, 66)}` as `0x${string}`,
            s: `0x${sig.slice(66, 130)}` as `0x${string}`,
         }, pendingPayment.nodeId);

         clearPendingPayment();
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Signing failed');
      } finally {
         setSigning(false);
      }
   }

   return (
      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) handleClose(); }}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[420px] [&>button]:hidden overflow-hidden"
         >
            <DialogTitle className="sr-only">Authorize payment</DialogTitle>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
               <p className="text-[14px] font-semibold text-white font-manrope">Authorize payment</p>
               <button
                  onClick={handleClose}
                  disabled={signing}
                  className="w-7 h-7 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
               >
                  <X size={13} strokeWidth={2} />
               </button>
            </div>

            {/* Body */}
            {pendingPayment && (
               <div className="flex flex-col px-5 py-4 gap-4">
                  <p className="text-[13px] text-white/70 leading-relaxed">
                     This workflow reached a paid step. Sign a gasless permit to continue — nothing leaves your wallet until the action runs.
                  </p>

                  {/* Payment breakdown */}
                  <div className="flex flex-col gap-1.5">
                     <div className="flex items-center justify-between px-4 py-3 bg-white/4 ring-1 ring-white/8 ring-offset-2 ring-offset-[#141414]">
                        <span className="text-[13px] text-white/70">Price per call</span>
                        <span className="text-[14px] font-semibold text-white">
                           ${pendingPayment.pricePerCall} <span className="text-white/55 text-[12px] font-normal">{pendingPayment.token}</span>
                        </span>
                     </div>
                     <div className="flex items-center justify-between px-4 py-3 bg-white/4 ring-1 ring-white/8 ring-offset-2 ring-offset-[#141414]">
                        <span className="text-[13px] text-white/70">Iterations</span>
                        <span className="text-[14px] font-semibold text-white">{pendingPayment.itemCount}</span>
                     </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
                     <span className="text-[12px] text-white/60">Total</span>
                     <span className="text-[15px] font-semibold text-white">
                        ${pendingPayment.totalAmount.toFixed(4)} <span className="text-white/55 text-[12px] font-normal">{pendingPayment.token}</span>
                     </span>
                  </div>

                  {/* Info row */}
                  <div className="flex items-start gap-3 px-3 py-3 bg-white/3 border border-dashed border-white/8">
                     <Zap size={15} className="text-white/60 shrink-0 mt-0.5" />
                     <p className="text-[12px] text-white/65 leading-relaxed">
                        Authorizes execution fees through an EIP-2612 permit. Fees may be collected before the action completes. Trade amounts and other transfers need separate limits.
                     </p>
                  </div>

                  {error && (
                     <p className="text-[12px] text-red-400">{error}</p>
                  )}
               </div>
            )}

            {/* Footer */}
            <div className="flex items-center px-5 py-4 border-t border-white/8">
               <button
                  onClick={() => { void handleConfirm(); }}
                  disabled={signing || !pendingPayment}
                  style={{ clipPath: cutCorner }}
                  className="flex-1 h-10 flex items-center justify-center gap-2 text-[13px] font-semibold text-ink-dark bg-sand hover:bg-sand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
               >
                  {signing ? <Loader2 size={15} className="animate-spin" /> : <><span>Sign & continue</span><ArrowUpRight size={15} strokeWidth={2.5} /></>}
               </button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
