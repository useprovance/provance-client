import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { workflowService } from "@/services/workflow.service";

interface CreateWorkflowModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export default function CreateWorkflowModal({ open, onOpenChange }: CreateWorkflowModalProps) {
   const navigate = useNavigate();
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");

   const create = useMutation({
      mutationFn: () => workflowService.create({ name: name.trim(), description: description.trim() }),
      onSuccess: (workflow) => {
         queryClient.invalidateQueries({ queryKey: ["workflows"] });
         onOpenChange(false);
         setName("");
         setDescription("");
         navigate(`/app/workflows/${workflow.id}`);
      },
   });

   function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!name.trim()) return;
      create.mutate();
   }

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="bg-[#141414] border border-white/10 p-6 sm:max-w-[420px]">
            <DialogTitle className="text-white font-manrope font-semibold text-lg">New workflow</DialogTitle>
            <DialogDescription className="text-white/40 text-sm mt-1">
               Give your workflow a name to get started.
            </DialogDescription>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
               <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] text-white/50">Name</label>
                  <input
                     type="text"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     placeholder="e.g. Lead Enrichment"
                     className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-colors"
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] text-white/50">Description <span className="text-white/25">(optional)</span></label>
                  <textarea
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder="What does this workflow do?"
                     rows={3}
                     className="bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-colors resize-none"
                  />
               </div>

               {create.error && (
                  <p className="text-[12px] text-red-400">{create.error.message}</p>
               )}

               <div className="flex gap-2 justify-end mt-1">
                  <button
                     type="button"
                     onClick={() => onOpenChange(false)}
                     className="px-4 py-2 text-[13px] text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     disabled={create.isPending || !name.trim()}
                     className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                     style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                  >
                     {create.isPending && <Loader2 size={13} className="animate-spin" />}
                     Create
                  </button>
               </div>
            </form>
         </DialogContent>
      </Dialog>
   );
}
