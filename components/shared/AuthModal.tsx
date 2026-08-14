"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import ProvanceLogo from "@/components/shared/ProvanceLogo";

interface AuthModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
   const router = useRouter();
   const user = useAuthStore((s) => s.user);

   useEffect(() => {
      if (user && open) {
         onOpenChange(false);
         router.push("/dashboard");
      }
   }, [user, open, onOpenChange, router]);

   const handleGoogle = () => { window.location.href = "/api/auth/google"; };
   const handleEmail = () => { /* coming soon */ };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            className="overflow-hidden rounded-xl border border-sand-faint bg-ink p-0 shadow-2xl sm:max-w-[380px]"
         >
            <button
               type="button"
               onClick={() => onOpenChange(false)}
               className="absolute right-4 top-4 z-10 flex size-7 items-center justify-center rounded-md text-sand/40 transition-colors hover:bg-charcoal hover:text-sand cursor-pointer"
            >
               <X className="size-4" />
            </button>

            <div className="px-6 pb-5 pt-10">
               <div className="flex justify-center">
                  <ProvanceLogo className="h-10 w-auto text-sand" />
               </div>

               <div className="mt-4 text-center">
                  <DialogTitle className="font-geist font-bold text-2xl uppercase tracking-wide text-sand">
                     Get started
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-[11px] text-sand/50">
                     Sign in or create an account to access Provance.
                  </DialogDescription>
               </div>

               <div className="mt-5 flex flex-col gap-3">
                  <button
                     type="button"
                     onClick={handleGoogle}
                     className="flex w-full items-center justify-center gap-3 border border-sand-faint bg-transparent px-5 py-4 text-sm text-sand transition-colors hover:bg-sand-faint cursor-pointer"
                  >
                     <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                     </svg>
                     Continue with Google
                  </button>

                  <button
                     type="button"
                     onClick={handleEmail}
                     className="flex w-full items-center justify-center gap-3 border border-sand-faint bg-transparent px-5 py-4 text-sm text-sand transition-colors hover:bg-sand-faint cursor-pointer"
                  >
                     <Mail className="size-4 shrink-0" />
                     Continue with Email
                  </button>

               </div>
            </div>

            <div className="border-t border-sand-faint bg-ink-heavy px-6 py-3 text-center">
               <p className="text-[11px] text-sand/40">
                  By continuing you agree to our terms of service and privacy policy.
               </p>
            </div>
         </DialogContent>
      </Dialog>
   );
}
