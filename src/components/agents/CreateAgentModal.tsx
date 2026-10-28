import { useState } from "react";
import { createWalletClient, custom } from "viem";
import { useConnectWallet, useWallets } from "@privy-io/react-auth";
import { Loader2, Search, CheckCircle2, X, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormInput } from "@/components/ui/form-input";
import { agentService, type AgentPreview } from "@/services/agent.service";

const CHAIN_NAMES: Record<number, string> = {
   1: "Ethereum", 8453: "Base", 42220: "Celo", 137: "Polygon",
   10: "Optimism", 42161: "Arbitrum", 56: "BSC", 100: "Gnosis",
   2345: "GOAT",
};

interface CreateAgentModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onCreated?: () => void;
}

export default function CreateAgentModal({ open, onOpenChange, onCreated }: CreateAgentModalProps) {
   const { connectWallet } = useConnectWallet();
   const { wallets } = useWallets();

   const [agentId, setAgentId] = useState("");
   const [fetching, setFetching] = useState(false);
   const [fetchError, setFetchError] = useState<string | null>(null);
   const [preview, setPreview] = useState<AgentPreview | null>(null);
   const [message, setMessage] = useState<string | null>(null);
   const [signing, setSigning] = useState(false);
   const [signError, setSignError] = useState<string | null>(null);
   const [claimed, setClaimed] = useState(false);
   const [imgError, setImgError] = useState(false);

   const connectedWallet = wallets[wallets.length - 1] ?? null;

   function handleClose() {
      onOpenChange(false);
      setTimeout(() => {
         setAgentId("");
         setFetching(false);
         setFetchError(null);
         setPreview(null);
         setMessage(null);
         setSigning(false);
         setSignError(null);
         setClaimed(false);
         setImgError(false);
      }, 300);
   }

   async function handleLookup() {
      const id = agentId.trim();
      if (!id) return;
      setFetching(true);
      setFetchError(null);
      setPreview(null);
      setSignError(null);
      setImgError(false);
      try {
         const data = await agentService.lookup(id);
         setPreview(data.agent);
         setMessage(data.message);
      } catch (err) {
         setFetchError(err instanceof Error ? err.message : "Agent not found");
      } finally {
         setFetching(false);
      }
   }

   async function handleClaim() {
      if (!preview || !message || !connectedWallet) return;
      setSigning(true);
      setSignError(null);
      try {
         const provider = await connectedWallet.getEthereumProvider();
         const client = createWalletClient({ transport: custom(provider) });
         const [account] = await client.requestAddresses();
         const signature = await client.signMessage({ account, message });
         await agentService.claim(preview.agent_id, signature);
         setClaimed(true);
         onCreated?.();
      } catch (err) {
         setSignError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
         setSigning(false);
      }
   }

   return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[460px] [&>button]:hidden"
         >
            <DialogTitle className="sr-only">Claim Agent</DialogTitle>

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
               <p className="text-[15px] font-semibold text-white font-manrope">Claim agent</p>
               <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
               >
                  <X size={14} strokeWidth={2} className="text-white/70" />
               </button>
            </div>

            <div className="px-6 py-6 flex flex-col gap-5">
               {claimed ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                     <CheckCircle2 size={40} strokeWidth={1.5} className="text-orange" />
                     <p className="text-white font-semibold">Agent claimed</p>
                     <p className="text-white/40 text-[13px] text-center">Your agent is now in your workspace.</p>
                  </div>
               ) : (
                  <>
                     <FormInput
                        label="Agent ID"
                        value={agentId}
                        onChange={(v) => {
                           setAgentId(v);
                           setFetchError(null);
                           if (preview) { setPreview(null); setMessage(null); }
                        }}
                        placeholder="https://8004scan.io/agents/goat/87"
                        suffix={
                           <button
                              type="button"
                              onClick={() => void handleLookup()}
                              disabled={!agentId.trim() || fetching}
                              className="flex items-center gap-1.5 h-full px-3 border-l border-white/10 text-white/50 hover:text-white text-[12px] font-medium disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                           >
                              {fetching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} strokeWidth={2} />}
                              {fetching ? "Looking…" : "Look up"}
                           </button>
                        }
                        error={fetchError ?? undefined}
                        touched={!!fetchError}
                     />
                     <p className="text-[11px] text-white/25 -mt-3">You can also use the short form: goat/87</p>

                     {preview && (
                        <div className="flex flex-col gap-3 p-4 border border-white/8 bg-white/3">
                           <div className="flex items-start gap-3">
                              {preview.image_url && !imgError ? (
                                 <img
                                    src={preview.image_url}
                                    alt=""
                                    className="w-10 h-10 object-contain shrink-0 bg-white/5 p-1.5 rounded-full"
                                    onError={() => setImgError(true)}
                                 />
                              ) : (
                                 <div className="w-10 h-10 bg-white/5 shrink-0 flex items-center justify-center rounded-full">
                                    <span className="text-white/20 text-base">◈</span>
                                 </div>
                              )}
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-white text-[14px] font-semibold leading-tight">{preview.name ?? "Unnamed Agent"}</p>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-orange bg-orange/10 px-1.5 py-0.5">
                                       {CHAIN_NAMES[preview.chain_id] ?? `Chain ${preview.chain_id}`}
                                    </span>
                                 </div>
                                 {preview.description && (
                                    <p className="text-white/40 text-[12px] mt-0.5 line-clamp-2">{preview.description}</p>
                                 )}
                              </div>
                           </div>
                           <p className="text-[11px] text-white/30 font-mono break-all border-t border-white/8 pt-3">{preview.owner_address}</p>

                           <button
                              onClick={() => connectWallet()}
                              className="flex items-center justify-center gap-2 border border-white/10 bg-white/4 hover:bg-white/8 text-white/60 hover:text-white text-[12px] py-2 transition-colors cursor-pointer"
                           >
                              <Wallet size={13} strokeWidth={1.5} />
                              {connectedWallet ? (
                                 <span className="font-mono">{connectedWallet.address.slice(0, 6)}…{connectedWallet.address.slice(-4)}</span>
                              ) : "Connect wallet to sign"}
                           </button>
                        </div>
                     )}

                     {signError && <p className="text-[12px] text-red-400">{signError}</p>}
                  </>
               )}
            </div>

            <div className="px-6 py-4 border-t border-white/8 shrink-0 flex items-center justify-between">
               <button
                  type="button"
                  onClick={handleClose}
                  className="text-[13px] text-white/40 hover:text-white transition-colors cursor-pointer"
               >
                  {claimed ? "Close" : "Cancel"}
               </button>
               {!claimed && preview && connectedWallet && (
                  <button
                     onClick={() => void handleClaim()}
                     disabled={signing}
                     className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-6 py-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                     style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                  >
                     {signing && <Loader2 size={13} className="animate-spin" />}
                     {signing ? "Signing…" : "Sign & Claim"}
                  </button>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
}
