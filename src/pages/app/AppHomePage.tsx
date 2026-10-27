import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LayoutDashboard, Search, Plus, Loader2 } from "lucide-react";
import { WorkflowCard } from "@/components/workflow/WorkflowCard";
import CreateWorkflowModal from "@/components/workflow/CreateWorkflowModal";
import { workflowService } from "@/services/workflow.service";
import { queryClient } from "@/lib/queryClient";

export default function AppHomePage() {
   const [search, setSearch] = useState("");
   const [createOpen, setCreateOpen] = useState(false);

   const { data, isPending } = useQuery({
      queryKey: ["workflows"],
      queryFn: () => workflowService.getAll(),
   });

   const remove = useMutation({
      mutationFn: (id: string) => workflowService.remove(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflows"] }),
   });

   const workflows = (data ?? []).filter((w) =>
      w.name.toLowerCase().includes(search.toLowerCase())
   );

   return (
      <div className="p-8">
         <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-orange/15 shrink-0">
               <LayoutDashboard className="size-4 text-orange" />
            </div>
            <h1 className="text-2xl font-semibold text-white font-manrope">Workflows</h1>
         </div>

         <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 w-full max-w-sm rounded-full border border-white/10 bg-white/5 px-4 py-2">
               <Search className="size-4 text-white/30 shrink-0" />
               <input
                  type="text"
                  placeholder="Search workflows..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
               />
            </div>

            <button
               onClick={() => setCreateOpen(true)}
               className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 shrink-0 transition-colors cursor-pointer"
               style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
               <Plus size={13} strokeWidth={2.5} />
               New Workflow
            </button>
         </div>

         <div className="mt-6">
            {isPending ? (
               <div className="flex items-center justify-center py-24">
                  <Loader2 className="size-5 text-white/30 animate-spin" />
               </div>
            ) : workflows.length === 0 ? (
               <div className="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-white/10">
                  <p className="text-[13px] text-white/30">No workflows yet</p>
                  <button
                     onClick={() => setCreateOpen(true)}
                     className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 transition-colors cursor-pointer"
                     style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                  >
                     <Plus size={13} strokeWidth={2.5} />
                     Create your first workflow
                  </button>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {workflows.map((w) => (
                     <WorkflowCard key={w.id} workflow={w} onDelete={(id) => remove.mutate(id)} />
                  ))}
               </div>
            )}
         </div>

         <CreateWorkflowModal open={createOpen} onOpenChange={setCreateOpen} />
      </div>
   );
}
