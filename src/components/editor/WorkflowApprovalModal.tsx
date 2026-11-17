import { useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEditorStore } from "@/stores/editor.store";

function value(summary: Record<string, unknown>, key: string): string {
   const item = summary[key];
   return typeof item === "string" || typeof item === "number" ? String(item) : "—";
}

export function WorkflowApprovalModal() {
   const pending = useEditorStore(s => s.pendingApproval);
   const decideApproval = useEditorStore(s => s.decideApproval);
   const [busy, setBusy] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const isOpen = pending !== null;

   async function decide(decision: boolean) {
      if (!pending || busy) return;
      setBusy(true);
      setError(null);
      try {
         await decideApproval(decision);
      } catch (err) {
         setError(err instanceof Error ? err.message : "Could not submit approval decision");
      } finally {
         setBusy(false);
      }
   }

   return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) void decide(false); }}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[440px] [&>button]:hidden overflow-hidden"
         >
            <DialogTitle className="sr-only">Approve automation action</DialogTitle>

            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
               <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-300" />
                  <p className="text-[14px] font-semibold text-white font-manrope">Approve automation action</p>
               </div>
               <button
                  onClick={() => void decide(false)}
                  disabled={busy}
                  className="w-7 h-7 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
               >
                  <X size={13} strokeWidth={2} />
               </button>
            </div>

            {pending && (
               <div className="flex flex-col px-5 py-4 gap-4">
                  <p className="text-[13px] text-white/70 leading-relaxed">
                     A scheduled or automated workflow wants to move funds above your signed approval threshold.
                     Review the request and approve or reject it.
                  </p>

                  <div className="flex flex-col gap-1.5 text-[13px]">
                     <Row label="Action" value={value(pending.summary, "kind")} />
                     <Row label="Node" value={value(pending.summary, "nodeLabel")} />
                     <Row label="Amount" value={`$${Number(pending.summary.amountUsd ?? 0).toFixed(2)}`} />
                     <Row label="Network" value={value(pending.summary, "network")} />
                     <Row label="Wallet" value={value(pending.summary, "walletAddress")} />
                     <Row label="Recipient" value={value(pending.summary, "recipient")} />
                     <Row label="Token" value={value(pending.summary, "token")} />
                  </div>

                  {error && <p className="text-[12px] text-red-300">{error}</p>}

                  <div className="flex items-center gap-2 pt-1">
                     <button
                        onClick={() => void decide(false)}
                        disabled={busy}
                        className="flex-1 h-10 rounded-md border border-white/15 text-[13px] text-white/75 hover:bg-white/6 transition-colors cursor-pointer disabled:opacity-40"
                     >
                        Reject
                     </button>
                     <button
                        onClick={() => void decide(true)}
                        disabled={busy}
                        className="flex-1 h-10 rounded-md bg-emerald-400 text-black text-[13px] font-semibold hover:bg-emerald-300 transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                     >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Approve
                     </button>
                  </div>
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
}

function Row({ label, value }: { label: string; value: string }) {
   return (
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-white/4 ring-1 ring-white/8 ring-offset-2 ring-offset-[#141414]">
         <span className="text-white/55">{label}</span>
         <span className="text-white font-medium text-right break-all">{value}</span>
      </div>
   );
}
