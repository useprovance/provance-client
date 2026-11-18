import { useEffect, useState } from "react";
import { Wallet, Copy, Plus, Trash2, Send, RefreshCw, Loader2, ArrowLeftRight, Coins, ArrowDownToLine, ChartCandlestick, Landmark, ShieldCheck, Braces } from "lucide-react";
import toast from "react-hot-toast";
import { WalletBlockie } from "@/components/shared/WalletBlockie";
import { WalletPickerModal } from "@/components/shared/WalletPickerModal";
import { walletService, type WalletRecord, type WalletTransaction } from "@/services/wallet.service";
import { StellarSendModal } from "@/components/shared/StellarSendModal";
import { EvmSendModal } from "@/components/shared/EvmSendModal";
import { StellarSwapModal } from "@/components/shared/StellarSwapModal";
import { EvmSwapModal } from "@/components/shared/EvmSwapModal";
import { EvmTokenSendModal } from "@/components/shared/EvmTokenSendModal";
import { ReceiveWalletModal } from "@/components/shared/ReceiveWalletModal";
import { StellarOrdersModal } from "@/components/shared/StellarOrdersModal";
import { DefindexPositionsModal } from "@/components/shared/DefindexPositionsModal";
import { AutomationPolicyModal } from "@/components/shared/AutomationPolicyModal";
import { EvmBridgeModal } from "@/components/shared/EvmBridgeModal";
import { EvmContractModal } from "@/components/shared/EvmContractModal";
import { getWalletBalances, type WalletBalanceResult } from "@/services/wallet-balance.service";
import { EVM_SWAP_NETWORKS } from "@/services/evm-swap.service";

function Card({ children }: { children: React.ReactNode }) {
   return (
      <div className="border border-white/8 bg-[#161616] rounded-lg overflow-hidden divide-y divide-white/8">
         {children}
      </div>
   );
}

function transactionExplorerUrl(transaction: WalletTransaction): string | null {
   if (transaction.chain === "evm") {
      if (transaction.network === "goat-network") return `https://explorer.goat.network/tx/${transaction.transaction_hash}`;
      const chain = EVM_SWAP_NETWORKS.find((item) => item.name.toLowerCase().replaceAll(" ", "-") === transaction.network);
      const explorer = chain?.blockExplorers?.default.url;
      return explorer ? `${explorer.replace(/\/$/, "")}/tx/${transaction.transaction_hash}` : null;
   }
   return `https://${transaction.network === "testnet" ? "testnet." : ""}stellar.expert/explorer/${transaction.network === "testnet" ? "testnet" : "public"}/tx/${transaction.transaction_hash}`;
}

function activityAssetLabel(transaction: WalletTransaction, asset: string | null, amount: string | null): string {
   let label = asset ?? "asset";
   if (asset && transaction.chain === "evm" && /^0x[0-9a-fA-F]{40}$/.test(asset)) label = `${asset.slice(0, 6)}…${asset.slice(-4)}`;
   if (asset && transaction.chain === "stellar" && asset.includes(":")) {
      const [code, issuer = ""] = asset.split(":");
      label = `${code} · ${issuer.slice(0, 5)}…${issuer.slice(-5)}`;
   }
   return `${amount ?? "…"} ${label}`;
}

function transactionSummary(transaction: WalletTransaction): string {
   if (transaction.kind !== "order") {
      return `${transaction.kind}: ${activityAssetLabel(transaction, transaction.from_asset, transaction.amount_in)}${transaction.to_asset ? ` → ${activityAssetLabel(transaction, transaction.to_asset, transaction.amount_out)}` : ""}`;
   }
   const selling = activityAssetLabel(transaction, transaction.from_asset, transaction.amount_in);
   const buying = activityAssetLabel(transaction, transaction.to_asset, null).replace(/^… /, "");
   const action = transaction.details.action === "cancel" ? "Cancelled SDEX offer" : "Placed SDEX order";
   if (transaction.details.action === "cancel") return `${action} #${String(transaction.details.offerId ?? "")}: ${selling}`;
   const price = typeof transaction.details.price === "string" ? transaction.details.price : "market";
   const lifecycle = transaction.details.lifecycle;
   const lifecycleLabel = lifecycle === "open"
      ? ` · open${typeof transaction.details.remainingAmount === "string" ? `, ${transaction.details.remainingAmount} remaining` : ""}${typeof transaction.details.filledAmount === "string" && transaction.details.filledAmount !== "0" ? `, ${transaction.details.filledAmount} filled` : ""}`
      : lifecycle === "filled" ? " · fully filled"
      : lifecycle === "cancelled" ? ` · cancelled${typeof transaction.details.filledAmount === "string" && transaction.details.filledAmount !== "0" ? ` after ${transaction.details.filledAmount} filled` : ""}`
      : lifecycle === "closed" ? " · closed (fill status unavailable)" : "";
   return `${action}: ${selling} at ${price} ${buying} per ${transaction.from_asset.split(":")[0]}${lifecycleLabel}`;
}

export default function WalletPage() {
   const [wallets, setWallets] = useState<WalletRecord[]>([]);
   const [pickerOpen, setPickerOpen] = useState(false);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [sendWallet, setSendWallet] = useState<WalletRecord | null>(null);
   const [swapWallet, setSwapWallet] = useState<WalletRecord | null>(null);
   const [ordersWallet, setOrdersWallet] = useState<WalletRecord | null>(null);
   const [defindexWallet, setDefindexWallet] = useState<WalletRecord | null>(null);
   const [evmSwapWallet, setEvmSwapWallet] = useState<WalletRecord | null>(null);
   const [tokenSendWallet, setTokenSendWallet] = useState<WalletRecord | null>(null);
   const [receiveWallet, setReceiveWallet] = useState<WalletRecord | null>(null);
   const [policyWallet, setPolicyWallet] = useState<WalletRecord | null>(null);
   const [bridgeWallet, setBridgeWallet] = useState<WalletRecord | null>(null);
   const [contractWallet, setContractWallet] = useState<WalletRecord | null>(null);
   const [balances, setBalances] = useState<Record<string, WalletBalanceResult>>({});
   const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

   async function refreshTransactions() {
      try {
         setTransactions(await walletService.getTransactions());
      } catch {
         setTransactions([]);
      }
   }

   async function refreshWallets() {
      try {
         setLoading(true);
         const records = await walletService.getAll();
         setWallets(records);
         const balanceEntries = await Promise.all(records.map(async (wallet) => [wallet.id, await getWalletBalances(wallet)] as const));
         setBalances(Object.fromEntries(balanceEntries));
         await refreshTransactions();
      } catch (error) {
         toast.error(error instanceof Error ? error.message : "Could not load wallets");
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      void refreshWallets();
   }, []);

   async function handleConnected(address: string, chain: "evm" | "stellar", proof: { challengeId: string; signature: string }) {
      setSaving(true);
      try {
         await walletService.add({ address, chain, ...proof });
         await refreshWallets();
         toast.success("Wallet linked");
      } catch (error) {
         if (error instanceof Error && error.message.toLowerCase().includes("already added")) {
            await refreshWallets();
            toast.success("Wallet is already linked");
            return;
         }
         throw error;
      } finally {
         setSaving(false);
      }
   }

   async function handleRemove(wallet: WalletRecord) {
      try {
         await walletService.remove(wallet.id);
         setWallets((current) => current.filter((item) => item.id !== wallet.id));
         toast.success("Wallet unlinked");
      } catch (error) {
         toast.error(error instanceof Error ? error.message : "Could not unlink wallet");
      }
   }

   return (
      <div className="p-8 h-full overflow-y-auto">
         {/* Title */}
         <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-orange/15 shrink-0">
               <Wallet className="size-4 text-orange" />
            </div>
            <h1 className="text-2xl font-semibold text-white font-manrope">Wallet</h1>
         </div>

         <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-[13px] text-white/40">Wallet addresses linked to your account.</p>
            <div className="flex items-center gap-2">
               <button onClick={() => void refreshWallets()} disabled={loading} title="Refresh wallets and balances" className="flex size-8 items-center justify-center border border-white/10 text-white/50 hover:text-white disabled:opacity-40">
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
               </button>
               <button
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 shrink-0 transition-colors cursor-pointer"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
               >
                  <Plus size={13} strokeWidth={2.5} />
                  Add Wallet
               </button>
            </div>
         </div>

         <div className="mt-6 max-w-lg">
            <Card>
               {loading ? (
                  <p className="px-5 py-6 text-[12px] text-white/40">Loading wallets…</p>
               ) : wallets.length === 0 ? (
                  <p className="px-5 py-6 text-[12px] text-white/40">No wallets linked yet.</p>
               ) : wallets.map((w) => (
                  <div key={w.id} className="px-5 py-4">
                     <div className="flex items-center gap-4">
                        <WalletBlockie address={w.address} size={44} />
                        <div className="flex-1 min-w-0">
                           <p className="text-[13px] text-white font-mono truncate">{w.address.slice(0, 6)}...{w.address.slice(-6)}</p>
                           <p className="text-[11px] text-white/40 mt-0.5 uppercase tracking-wider">{w.chain}</p>
                        </div>
                        {w.chain !== "arc" && <button
                           onClick={() => setReceiveWallet(w)}
                           aria-label={`Receive to ${w.address}`}
                           title="Receive assets"
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                        ><ArrowDownToLine size={15} strokeWidth={1.5} /></button>}
                        <button
                           onClick={() => setSendWallet(w)}
                           aria-label={`Send from ${w.address}`}
                           disabled={w.chain === "arc"}
                           title={w.chain === "arc" ? "Arc sending is not configured yet" : `Send native asset from this wallet`}
                           className="text-white/30 hover:text-white transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                        ><Send size={15} strokeWidth={1.5} /></button>
                        {(w.chain === "evm" || w.chain === "base" || w.chain === "goat") && <button
                           onClick={() => setTokenSendWallet(w)}
                           aria-label={`Send token from ${w.address}`}
                           title="Send an ERC-20 token"
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                        ><Coins size={15} strokeWidth={1.5} /></button>}
                        {w.chain === "stellar" && <button
                           onClick={() => setSwapWallet(w)}
                           aria-label={`Swap from ${w.address}`}
                           title="Swap XLM and USDC"
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                        ><ArrowLeftRight size={15} strokeWidth={1.5} /></button>}
                        {w.chain === "stellar" && <button
                           onClick={() => setOrdersWallet(w)}
                           aria-label={`Manage Stellar limit orders for ${w.address}`}
                           title="Manage Stellar SDEX limit orders"
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                        ><ChartCandlestick size={15} strokeWidth={1.5} /></button>}
                        {w.chain === "stellar" && <button
                           onClick={() => setDefindexWallet(w)}
                           aria-label={`View DeFindex positions for ${w.address}`}
                           title="Browse DeFindex vaults and positions"
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                        ><Landmark size={15} strokeWidth={1.5} /></button>}
                        {(w.chain === "evm" || w.chain === "base") && <button
                           onClick={() => setEvmSwapWallet(w)}
                           aria-label={`Swap tokens from ${w.address}`}
                           title="Swap ERC-20 tokens"
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                        ><ArrowLeftRight size={15} strokeWidth={1.5} /></button>}
                        {(w.chain === "evm" || w.chain === "base") && <button
                           onClick={() => setBridgeWallet(w)}
                           aria-label={`Bridge tokens from ${w.address}`}
                           title="Bridge tokens across EVM networks with LI.FI"
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                        ><ArrowLeftRight size={15} strokeWidth={1.5} /></button>}
                        {(w.chain === "evm" || w.chain === "base") && <button
                           onClick={() => setContractWallet(w)}
                           aria-label={`Call a contract from ${w.address}`}
                           title="Inspect, simulate, and call a contract"
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                        ><Braces size={15} strokeWidth={1.5} /></button>}
                        <button
                           onClick={() => setPolicyWallet(w)}
                           aria-label={`Configure automation policy for ${w.address}`}
                           title="Automation policy"
                           className="text-white/30 hover:text-white transition-colors cursor-pointer"
                        ><ShieldCheck size={15} strokeWidth={1.5} /></button>
                        <button onClick={() => { void navigator.clipboard.writeText(w.address); toast.success("Address copied"); }} className="text-white/30 hover:text-white transition-colors cursor-pointer"><Copy size={16} strokeWidth={1.5} /></button>
                        <button onClick={() => void handleRemove(w)} aria-label={`Unlink ${w.chain} wallet`} className="text-white/30 hover:text-red-300 transition-colors cursor-pointer"><Trash2 size={15} strokeWidth={1.5} /></button>
                     </div>
                     <div className="ml-[60px] mt-3 border-t border-white/6 pt-2.5">
                        {!balances[w.id] ? (
                           <div className="flex items-center gap-2 text-[10px] text-white/35"><Loader2 size={11} className="animate-spin" />Reading balances</div>
                        ) : balances[w.id].balances.length ? (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                              {balances[w.id].balances.map((balance) => (
                                 <div key={`${balance.network}-${balance.symbol}-${balance.asset ?? "native"}`} className="flex justify-between gap-2 text-[10px]">
                                    <span className="text-white/40 truncate">{balance.network} · {balance.symbol}</span>
                                    <span className="text-white/75 font-mono shrink-0">{balance.amount}</span>
                                 </div>
                              ))}
                           </div>
                        ) : <p className="text-[10px] text-white/35">No balances found on supported networks.</p>}
                        {balances[w.id]?.errors.map((message) => <p key={message} className="mt-1 text-[10px] text-amber-300/70">{message}</p>)}
                     </div>
                  </div>
               ))}
            </Card>
         </div>

         <section className="mt-8 max-w-3xl">
            <h2 className="text-[13px] font-semibold text-white font-manrope">Recent activity</h2>
            <p className="mt-1 text-[11px] text-white/35">Recorded wallet transfers, swaps, vault actions, and Stellar orders.</p>
            <div className="mt-3 border border-white/8 bg-[#161616] divide-y divide-white/8">
               {transactions.length === 0 ? (
                  <p className="px-5 py-5 text-[11px] text-white/35">No recorded transactions yet.</p>
               ) : transactions.map((transaction) => (
                  <div key={transaction.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-[11px]">
                     <div className="min-w-[130px] flex-1">
                        <p className="text-white capitalize">{transactionSummary(transaction)}</p>
                        <p className="mt-1 text-[10px] text-white/35">{transaction.chain === "stellar" ? "Stellar" : "EVM"} {transaction.network} · {transaction.provider} · {new Date(transaction.created_at).toLocaleString()}</p>
                     </div>
                     <span className={`uppercase tracking-wide ${transaction.status === "confirmed" ? "text-emerald-300/80" : transaction.status === "failed" ? "text-red-300/80" : "text-amber-200/80"}`}>{transaction.status}</span>
                     {transactionExplorerUrl(transaction) && <a href={transactionExplorerUrl(transaction)!} target="_blank" rel="noreferrer" className="font-mono text-white/40 hover:text-white/75">{transaction.transaction_hash.slice(0, 10)}…</a>}
                  </div>
               ))}
            </div>
         </section>

         <WalletPickerModal
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onConnected={handleConnected}
            saving={saving}
         />
         {sendWallet?.chain === "stellar" && (
            <StellarSendModal
               open={Boolean(sendWallet)}
               onOpenChange={(open) => { if (!open) setSendWallet(null); }}
               source={sendWallet.address}
               onSubmitted={() => { void refreshWallets(); }}
            />
         )}
         {sendWallet && sendWallet.chain !== "stellar" && sendWallet.chain !== "arc" && (
            <EvmSendModal
               key={sendWallet.id}
               open={Boolean(sendWallet)}
               onOpenChange={(open) => { if (!open) setSendWallet(null); }}
               source={sendWallet.address}
               walletChain={sendWallet.chain}
               onSubmitted={() => { void refreshWallets(); }}
            />
         )}
         {swapWallet && (
            <StellarSwapModal
               key={swapWallet.id}
               open={Boolean(swapWallet)}
               onOpenChange={(open) => { if (!open) setSwapWallet(null); }}
               address={swapWallet.address}
               onSubmitted={() => { void refreshWallets(); }}
            />
         )}
         {ordersWallet && (
            <StellarOrdersModal
               key={ordersWallet.id}
               open={Boolean(ordersWallet)}
               onOpenChange={(open) => { if (!open) setOrdersWallet(null); }}
               address={ordersWallet.address}
               onSubmitted={() => { void refreshWallets(); }}
            />
         )}
         {defindexWallet && (
            <DefindexPositionsModal
               key={defindexWallet.id}
               open={Boolean(defindexWallet)}
               onOpenChange={(open) => { if (!open) setDefindexWallet(null); }}
               walletAddress={defindexWallet.address}
            />
         )}
         {evmSwapWallet && (
            <EvmSwapModal
               key={evmSwapWallet.id}
               open={Boolean(evmSwapWallet)}
               onOpenChange={(open) => { if (!open) setEvmSwapWallet(null); }}
               address={evmSwapWallet.address}
               walletChain={evmSwapWallet.chain}
               onSubmitted={() => { void refreshWallets(); }}
            />
         )}
         {tokenSendWallet && (
            <EvmTokenSendModal
               key={tokenSendWallet.id}
               open={Boolean(tokenSendWallet)}
               onOpenChange={(open) => { if (!open) setTokenSendWallet(null); }}
               source={tokenSendWallet.address}
               walletChain={tokenSendWallet.chain}
               onSubmitted={() => { void refreshWallets(); }}
            />
         )}
         {bridgeWallet && (
            <EvmBridgeModal
               key={bridgeWallet.id}
               open={Boolean(bridgeWallet)}
               onOpenChange={(open) => { if (!open) setBridgeWallet(null); }}
               address={bridgeWallet.address}
               onSubmitted={() => { void refreshTransactions(); }}
            />
         )}
         {contractWallet && (
            <EvmContractModal
               key={contractWallet.id}
               open={Boolean(contractWallet)}
               onOpenChange={(open) => { if (!open) setContractWallet(null); }}
               wallet={contractWallet}
               onSubmitted={() => { void refreshTransactions(); }}
            />
         )}
         {policyWallet && (
            <AutomationPolicyModal
               key={policyWallet.id}
               open={Boolean(policyWallet)}
               onOpenChange={(open) => { if (!open) setPolicyWallet(null); }}
               walletAddress={policyWallet.address}
               walletChain={policyWallet.chain}
            />
         )}
         {receiveWallet && (
            <ReceiveWalletModal
               key={receiveWallet.id}
               open={Boolean(receiveWallet)}
               onOpenChange={(open) => { if (!open) setReceiveWallet(null); }}
               address={receiveWallet.address}
               walletChain={receiveWallet.chain}
            />
         )}
      </div>
   );
}
