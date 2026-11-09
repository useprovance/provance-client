import { useState } from "react";
import { KeyRound, Copy, Trash2, Plus, Eye, EyeOff, X } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { credentialService, type Credential } from "@/services/credential.service";

function AddCredentialModal({ onClose }: { onClose: () => void }) {
   const queryClient = useQueryClient();
   const [name, setName] = useState("");
   const [value, setValue] = useState("");
   const [showValue, setShowValue] = useState(false);

   const mutation = useMutation({
      mutationFn: () => credentialService.add(name.trim(), value.trim()),
      onSuccess: () => {
         void queryClient.invalidateQueries({ queryKey: ["credentials"] });
         toast.success("Credential saved");
         onClose();
      },
      onError: (err: Error) => toast.error(err.message ?? "Failed to save"),
   });

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
         <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-lg p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
               <h2 className="text-[15px] font-semibold text-white">Add Credential</h2>
               <button onClick={onClose} className="text-white/40 hover:text-white transition-colors cursor-pointer">
                  <X size={16} strokeWidth={1.5} />
               </button>
            </div>

            <div className="flex flex-col gap-4">
               <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-white/60">Name</label>
                  <input
                     value={name}
                     onChange={e => setName(e.target.value)}
                     placeholder="e.g. OpenAI API Key"
                     className="bg-[#0c0c0c] border border-[#2a2a2a] focus:border-white/30 text-[13px] text-white placeholder:text-white/20 px-3 py-3 outline-none w-full"
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-white/60">Value</label>
                  <div className="flex items-stretch bg-[#0c0c0c] border border-[#2a2a2a] focus-within:border-white/30">
                     <input
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        type={showValue ? "text" : "password"}
                        placeholder="Paste your secret here"
                        className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/20 px-3 py-3 outline-none"
                     />
                     <button
                        type="button"
                        onClick={() => setShowValue(v => !v)}
                        className="px-3 border-l border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                     >
                        {showValue ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                     </button>
                  </div>
               </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
               <button
                  onClick={onClose}
                  className="px-4 py-2 text-[12px] text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
               >
                  Cancel
               </button>
               <button
                  onClick={() => mutation.mutate()}
                  disabled={!name.trim() || !value.trim() || mutation.isPending}
                  className="flex items-center gap-2 bg-sand hover:bg-sand-light disabled:opacity-40 text-ink-dark text-[12px] font-bold px-5 py-2 transition-colors cursor-pointer"
                  style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
               >
                  {mutation.isPending ? "Saving…" : "Save"}
               </button>
            </div>
         </div>
      </div>
   );
}

function CredentialCard({ credential, onDelete }: { credential: Credential; onDelete: () => void }) {
   const [revealed, setRevealed] = useState(false);

   return (
      <div className="flex items-center gap-4 px-5 py-4 border border-white/8 bg-[#161616] rounded-lg">
         <div className="flex size-9 items-center justify-center rounded-full bg-white/8 shrink-0 overflow-hidden">
            <KeyRound size={18} strokeWidth={1.5} className="text-white/80" />
         </div>
         <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-sand">{credential.name}</p>
            <p className="text-[12px] font-mono text-white/35 mt-0.5 truncate">
               {revealed ? "••••••••••••••••" : "••••••••••••••••"}
            </p>
         </div>
         <div className="flex items-center gap-2">
            <button
               onClick={() => setRevealed(r => !r)}
               className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
            >
               {revealed ? <EyeOff size={20} strokeWidth={1.5} className="shrink-0" /> : <Eye size={20} strokeWidth={1.5} className="shrink-0" />}
            </button>
            <button
               onClick={() => { toast("Value is write-only for security", { icon: "🔒" }); }}
               className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
            >
               <Copy size={20} strokeWidth={1.5} className="shrink-0" />
            </button>
            <button
               onClick={onDelete}
               className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-red-400 transition-colors cursor-pointer"
            >
               <Trash2 size={20} strokeWidth={1.5} className="shrink-0" />
            </button>
         </div>
      </div>
   );
}

export default function CredentialsPage() {
   const queryClient = useQueryClient();
   const [showModal, setShowModal] = useState(false);

   const { data: credentials = [] } = useQuery({
      queryKey: ["credentials"],
      queryFn: () => credentialService.list(),
   });

   const removeMutation = useMutation({
      mutationFn: (id: string) => credentialService.remove(id),
      onSuccess: () => {
         void queryClient.invalidateQueries({ queryKey: ["credentials"] });
         toast.success("Credential removed");
      },
      onError: () => toast.error("Failed to remove"),
   });

   return (
      <>
         {showModal && <AddCredentialModal onClose={() => setShowModal(false)} />}

         <div className="p-8 h-full overflow-y-auto">
            <div className="flex items-center gap-2.5">
               <div className="flex size-9 items-center justify-center rounded-full bg-white/8 shrink-0">
                  <KeyRound className="size-4 text-white/80" />
               </div>
               <h1 className="text-2xl font-semibold text-white font-manrope">Credentials</h1>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
               <p className="text-[13px] text-white/40">Store API keys and secrets your agents use across workflows.</p>
               <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 shrink-0 transition-colors cursor-pointer"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
               >
                  <Plus size={13} strokeWidth={2.5} />
                  Add Credential
               </button>
            </div>

            <div className="mt-6">
               {credentials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-sand/10">
                     <p className="text-[13px] text-sand/30">No credentials saved yet</p>
                     <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-sand hover:bg-sand-light text-ink-dark text-[12px] font-bold px-5 py-2 transition-colors cursor-pointer"
                        style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                     >
                        <Plus size={13} strokeWidth={2.5} />
                        Add your first credential
                     </button>
                  </div>
               ) : (
                  <div className="flex flex-col gap-2 max-w-2xl">
                     {credentials.map(c => (
                        <CredentialCard
                           key={c.id}
                           credential={c}
                           onDelete={() => removeMutation.mutate(c.id)}
                        />
                     ))}
                  </div>
               )}
            </div>
         </div>
      </>
   );
}
