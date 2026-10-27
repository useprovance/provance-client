import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormInput } from "@/components/ui/form-input";
import { queryClient } from "@/lib/queryClient";
import { workflowService } from "@/services/workflow.service";

interface CreateWorkflowModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export default function CreateWorkflowModal({ open, onOpenChange }: CreateWorkflowModalProps) {
   const navigate = useNavigate();
   const [name, setName] = useState("");
   const [nameTouched, setNameTouched] = useState(false);
   const [description, setDescription] = useState("");

   const nameError = !name.trim() ? "Workflow name is required" : undefined;

   function handleClose() {
      onOpenChange(false);
      setTimeout(() => {
         setName("");
         setDescription("");
         setNameTouched(false);
      }, 200);
   }

   const create = useMutation({
      mutationFn: () => workflowService.create({ name: name.trim(), description: description.trim() }),
      onSuccess: (workflow) => {
         queryClient.invalidateQueries({ queryKey: ["workflows"] });
         handleClose();
         navigate(`/app/workflows/${workflow.id}`);
      },
   });

   function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!name.trim()) return;
      create.mutate();
   }

   return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
         <DialogContent
            aria-describedby={undefined}
            className="bg-[#141414] border border-white/10 p-0 gap-0 flex flex-col sm:max-w-[460px] [&>button]:hidden"
         >
            <DialogTitle className="sr-only">Create Workflow</DialogTitle>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
               <p className="text-[15px] font-semibold text-white font-manrope">New workflow</p>
               <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
               >
                  <X size={14} strokeWidth={2} className="text-white/70" />
               </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} id="create-workflow-form" className="px-6 py-6 flex flex-col gap-5">
               <FormInput
                  label="Workflow Name"
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Lead Enrichment"
                  required
                  error={nameError}
                  touched={nameTouched}
                  onBlur={() => setNameTouched(true)}
               />
               <FormInput
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  placeholder="What does this workflow do?"
                  type="textarea"
                  rows={3}
               />
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/8 shrink-0 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button
                     type="button"
                     onClick={handleClose}
                     className="text-[13px] text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                     Cancel
                  </button>
                  {create.error && <p className="text-[12px] text-red-400">{create.error.message}</p>}
               </div>
               <button
                  type="submit"
                  form="create-workflow-form"
                  disabled={create.isPending || !name.trim()}
                  className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-6 py-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
               >
                  {create.isPending && <Loader2 size={13} className="animate-spin" />}
                  Create Workflow
               </button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
