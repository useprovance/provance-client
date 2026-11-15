import { useState } from "react";
import { X, Mail, Loader2, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProvanceLogo from "@/components/shared/ProvanceLogo";
import { BaseApiService } from "@/services/api.service";
import { useMutation } from "@tanstack/react-query";

class AccessService extends BaseApiService {
   async request(email: string) {
      await this.api.post("/access/request", { email });
   }
}

const accessService = new AccessService();

interface Props {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export default function RequestAccessModal({ open, onOpenChange }: Props) {
   const [email, setEmail] = useState("");

   const submit = useMutation({
      mutationFn: (emailAddr: string) => accessService.request(emailAddr),
   });

   function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!email.trim()) return;
      submit.mutate(email.trim());
   }

   function handleClose() {
      onOpenChange(false);
      setTimeout(() => {
         setEmail("");
         submit.reset();
      }, 300);
   }

   return (
      <Dialog open={open} onOpenChange={handleClose}>
         <DialogContent
            className="overflow-hidden rounded-xl border border-sand-faint bg-ink p-0 shadow-2xl sm:max-w-[380px]"
            showCloseButton={false}
         >
            <button
               type="button"
               onClick={handleClose}
               className="absolute right-4 top-4 z-10 flex size-7 items-center justify-center rounded-md text-sand/40 transition-colors hover:bg-charcoal hover:text-sand cursor-pointer"
            >
               <X className="size-4" />
            </button>

            <div className="px-6 pb-5 pt-10">
               <div className="flex justify-center">
                  <ProvanceLogo className="h-8 w-auto text-sand" />
               </div>

               <div className="mt-4 text-center">
                  <DialogTitle className="font-geist font-bold text-2xl uppercase tracking-tight text-sand">
                     {submit.isSuccess ? "Request received" : "Request access"}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-[11px] text-sand/50">
                     {submit.isSuccess
                        ? "We got your request. We will reach out when access is available."
                        : "Provance is currently invite only. Leave your email and we will reach out soon."}
                  </DialogDescription>
               </div>

               {submit.isSuccess ? (
                  <div className="mt-6 flex justify-center">
                     <CheckCircle size={40} strokeWidth={1.5} className="text-orange" />
                  </div>
               ) : (
                  <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
                     <div className="flex items-center gap-2 border border-sand-faint bg-transparent px-3">
                        <Mail size={14} strokeWidth={1.5} className="text-sand/40 shrink-0" />
                        <input
                           type="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           placeholder="Enter your email"
                           className="flex-1 bg-transparent py-2.5 text-sm text-sand placeholder:text-sand/25 outline-none"
                        />
                     </div>

                     {submit.error && (
                        <p className="text-[11px] text-red-400">Something went wrong. Try again.</p>
                     )}

                     <button
                        type="submit"
                        disabled={submit.isPending || !email.trim()}
                        className="flex w-full items-center justify-center gap-2 bg-sand hover:bg-sand-light px-5 py-2.5 text-sm font-medium text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                     >
                        {submit.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                        Request access
                     </button>
                  </form>
               )}
            </div>

            <div className="border-t border-sand-faint bg-ink-heavy px-6 py-3 text-center">
               <p className="text-[11px] text-sand/40">
                  We will never share your email with anyone.
               </p>
            </div>
         </DialogContent>
      </Dialog>
   );
}
