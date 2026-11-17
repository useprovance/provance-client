import { useEffect, useState } from "react";
import { CalendarClock, Copy, Loader2, Plus, Radio, Trash2, Webhook } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
   workflowService,
   type WorkflowSchedule,
   type WorkflowTrigger,
} from "@/services/workflow.service";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; workflowId: string };

export function WorkflowAutomationModal({ open, onOpenChange, workflowId }: Props) {
   const [schedules, setSchedules] = useState<WorkflowSchedule[]>([]);
   const [triggers, setTriggers] = useState<WorkflowTrigger[]>([]);
   const [loading, setLoading] = useState(false);
   const [busy, setBusy] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [secret, setSecret] = useState<{ token: string; path: string | null } | null>(null);
   const [cron, setCron] = useState("0 9 * * *");
   const [timezone, setTimezone] = useState("UTC");
   const [triggerType, setTriggerType] = useState<"webhook" | "event">("webhook");
   const [eventName, setEventName] = useState("");

   async function refresh() {
      setLoading(true);
      setError(null);
      try {
         const [nextSchedules, nextTriggers] = await Promise.all([
            workflowService.getSchedules(workflowId),
            workflowService.getTriggers(workflowId),
         ]);
         setSchedules(nextSchedules);
         setTriggers(nextTriggers);
      } catch (err) {
         setError(err instanceof Error ? err.message : "Could not load automation settings");
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      if (open) void refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open, workflowId]);

   async function addSchedule() {
      setBusy(true);
      setError(null);
      try {
         await workflowService.createSchedule(workflowId, { cron, timezone, enabled: true });
         await refresh();
      } catch (err) {
         setError(err instanceof Error ? err.message : "Could not create schedule");
      } finally {
         setBusy(false);
      }
   }

   async function addTrigger() {
      setBusy(true);
      setError(null);
      try {
         const created = await workflowService.createTrigger(workflowId, {
            type: triggerType,
            eventName: triggerType === "event" ? eventName.trim() : undefined,
            name: triggerType === "event" ? `Event: ${eventName.trim()}` : "Webhook",
         });
         if (triggerType === "webhook") setSecret({ token: created.token, path: created.webhookPath });
         setEventName("");
         await refresh();
      } catch (err) {
         setError(err instanceof Error ? err.message : "Could not create trigger");
      } finally {
         setBusy(false);
      }
   }

   async function removeSchedule(id: string) {
      setBusy(true);
      try {
         await workflowService.deleteSchedule(workflowId, id);
         await refresh();
      } catch (err) {
         setError(err instanceof Error ? err.message : "Could not delete schedule");
      } finally {
         setBusy(false);
      }
   }

   async function removeTrigger(id: string) {
      setBusy(true);
      try {
         await workflowService.deleteTrigger(workflowId, id);
         await refresh();
      } catch (err) {
         setError(err instanceof Error ? err.message : "Could not delete trigger");
      } finally {
         setBusy(false);
      }
   }

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[560px] max-h-[85vh] [&>button]:hidden overflow-hidden"
         >
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8">
               <CalendarClock size={15} className="text-orange-300" />
               <DialogTitle className="text-[14px] font-semibold text-white font-manrope">Automation</DialogTitle>
            </div>

            <div className="overflow-y-auto px-5 py-4 flex flex-col gap-6">
               <p className="text-[12px] text-white/55 leading-relaxed">
                  Scheduled and triggered runs enforce the wallet's signed automation policy. Amounts above the approval
                  threshold wait for your approval before execution.
               </p>

               <section className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-white/85">
                     <CalendarClock size={13} />
                     <h3 className="text-[13px] font-semibold">Schedules</h3>
                  </div>
                  <div className="grid grid-cols-[1fr_120px_auto] gap-2">
                     <input
                        value={cron}
                        onChange={(e) => setCron(e.target.value)}
                        placeholder="0 9 * * *"
                        className="h-9 px-3 rounded-md bg-white/5 border border-white/10 text-[12px] text-white outline-none focus:border-white/30"
                     />
                     <input
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        placeholder="UTC"
                        className="h-9 px-3 rounded-md bg-white/5 border border-white/10 text-[12px] text-white outline-none focus:border-white/30"
                     />
                     <button
                        onClick={() => void addSchedule()}
                        disabled={busy || !cron.trim()}
                        className="h-9 px-3 rounded-md bg-white/10 text-[12px] text-white hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                     >
                        <Plus size={13} /> Add
                     </button>
                  </div>
                  <p className="text-[11px] text-white/40 -mt-1">Five-field cron in the selected IANA timezone.</p>

                  {schedules.length === 0 ? (
                     <p className="text-[12px] text-white/40">No schedules yet.</p>
                  ) : schedules.map((schedule) => (
                     <div key={schedule.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white/4 ring-1 ring-white/8">
                        <div className="min-w-0">
                           <p className="text-[12px] text-white font-medium truncate">{schedule.name || schedule.cron}</p>
                           <p className="text-[11px] text-white/40 truncate">
                              {schedule.cron} · {schedule.timezone} · next {formatDate(schedule.next_run_at)}
                           </p>
                        </div>
                        <button onClick={() => void removeSchedule(schedule.id)} disabled={busy} className="text-white/40 hover:text-red-300 cursor-pointer disabled:opacity-40">
                           <Trash2 size={14} />
                        </button>
                     </div>
                  ))}
               </section>

               <section className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-white/85">
                     <Webhook size={13} />
                     <h3 className="text-[13px] font-semibold">Triggers</h3>
                  </div>
                  <div className="grid grid-cols-[120px_1fr_auto] gap-2">
                     <select
                        value={triggerType}
                        onChange={(e) => setTriggerType(e.target.value as "webhook" | "event")}
                        className="h-9 px-2 rounded-md bg-white/5 border border-white/10 text-[12px] text-white outline-none focus:border-white/30"
                     >
                        <option value="webhook" className="bg-[#141414]">Webhook</option>
                        <option value="event" className="bg-[#141414]">Event</option>
                     </select>
                     <input
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        disabled={triggerType !== "event"}
                        placeholder={triggerType === "event" ? "event name" : "generated token"}
                        className="h-9 px-3 rounded-md bg-white/5 border border-white/10 text-[12px] text-white outline-none focus:border-white/30 disabled:opacity-40"
                     />
                     <button
                        onClick={() => void addTrigger()}
                        disabled={busy || (triggerType === "event" && !eventName.trim())}
                        className="h-9 px-3 rounded-md bg-white/10 text-[12px] text-white hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                     >
                        <Plus size={13} /> Add
                     </button>
                  </div>

                  {secret && (
                     <div className="px-3 py-2.5 bg-amber-500/8 ring-1 ring-amber-400/20 text-[11px] text-amber-100/90 flex flex-col gap-2">
                        <p>Webhook token (shown once):</p>
                        <div className="flex items-center gap-2">
                           <code className="flex-1 break-all text-[11px] text-amber-50">{secret.token}</code>
                           <button
                              onClick={() => void navigator.clipboard.writeText(secret.token)}
                              className="p-1.5 rounded hover:bg-white/10 cursor-pointer"
                           >
                              <Copy size={12} />
                           </button>
                        </div>
                        {secret.path && <p className="text-amber-100/60">POST {secret.path}</p>}
                     </div>
                  )}

                  {triggers.length === 0 ? (
                     <p className="text-[12px] text-white/40">No triggers yet.</p>
                  ) : triggers.map((trigger) => (
                     <div key={trigger.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white/4 ring-1 ring-white/8">
                        <div className="min-w-0">
                           <p className="text-[12px] text-white font-medium truncate flex items-center gap-1.5">
                              {trigger.type === "event" ? <Radio size={11} /> : <Webhook size={11} />}
                              {trigger.name}
                           </p>
                           <p className="text-[11px] text-white/40 truncate">
                              {trigger.type === "event" ? trigger.event_name : `token ${trigger.token_hint}…`} · last {formatDate(trigger.last_triggered_at)}
                           </p>
                        </div>
                        <button onClick={() => void removeTrigger(trigger.id)} disabled={busy} className="text-white/40 hover:text-red-300 cursor-pointer disabled:opacity-40">
                           <Trash2 size={14} />
                        </button>
                     </div>
                  ))}
               </section>

               {loading && <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-white/40" /></div>}
               {error && <p className="text-[12px] text-red-300">{error}</p>}
            </div>
         </DialogContent>
      </Dialog>
   );
}

function formatDate(value: string | null): string {
   if (!value) return "never";
   const date = new Date(value);
   return Number.isNaN(date.getTime()) ? "unknown" : date.toLocaleString();
}
