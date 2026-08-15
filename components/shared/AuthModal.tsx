"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import ProvanceLogo from "@/components/shared/ProvanceLogo";

interface AuthModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

type Step = "entry" | "otp";

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
   const router = useRouter();
   const user = useAuthStore((s) => s.user);

   const [step, setStep] = useState<Step>("entry");
   const [email, setEmail] = useState("");
   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
   const [emailLoading, setEmailLoading] = useState(false);
   const [otpLoading, setOtpLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

   useEffect(() => {
      if (user && open) {
         onOpenChange(false);
         router.push("/dashboard");
      }
   }, [user, open, onOpenChange, router]);

   // Reset state when modal closes
   useEffect(() => {
      if (!open) {
         setStep("entry");
         setEmail("");
         setOtp(["", "", "", "", "", ""]);
         setError(null);
      }
   }, [open]);

   const handleGoogle = () => { window.location.href = "/api/auth/google"; };

   const handleEmailSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;
      setEmailLoading(true);
      setError(null);

      const res = await fetch("/api/auth/email/send", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json() as { error?: string };
      setEmailLoading(false);

      if (!res.ok) { setError(data.error ?? "Could not send code"); return; }
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
   };

   const handleOtpChange = (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...otp];
      next[index] = digit;
      setOtp(next);
      if (digit && index < 5) otpRefs.current[index + 1]?.focus();
      if (next.every((d) => d !== "")) void submitOtp(next.join(""));
   };

   const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
         otpRefs.current[index - 1]?.focus();
      }
   };

   const submitOtp = async (code: string) => {
      setOtpLoading(true);
      setError(null);

      const res = await fetch("/api/auth/email/verify", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: email.trim(), code }),
      });

      const data = await res.json() as { ok?: boolean; redirect?: string; error?: string };
      setOtpLoading(false);

      if (!res.ok || !data.ok) {
         setError(data.error ?? "Invalid code");
         setOtp(["", "", "", "", "", ""]);
         setTimeout(() => otpRefs.current[0]?.focus(), 50);
         return;
      }

      onOpenChange(false);
      router.push(data.redirect ?? "/dashboard");
   };

   const handleOtpSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const code = otp.join("");
      if (code.length === 6) void submitOtp(code);
   };

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
                     {step === "otp" ? "Check your email" : "Get started"}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-[11px] text-sand/50">
                     {step === "otp"
                        ? `We sent a 6-digit code to ${email}`
                        : "Sign in or create an account to access Provance."}
                  </DialogDescription>
               </div>

               {step === "entry" ? (
                  <div className="mt-5 flex flex-col gap-3">
                     <button
                        type="button"
                        onClick={handleGoogle}
                        className="flex w-full items-center justify-center gap-3 border border-sand-faint bg-transparent px-5 py-2.5 text-sm text-sand transition-colors hover:bg-sand-faint cursor-pointer"
                     >
                        <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                           <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                           <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                           <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                           <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                     </button>

                     {/* Divider */}
                     <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-sand-faint" />
                        <span className="text-[11px] text-sand/30">or</span>
                        <div className="flex-1 h-px bg-sand-faint" />
                     </div>

                     {/* Email input + submit */}
                     <form onSubmit={handleEmailSend} className="flex flex-col gap-3">
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

                        {error && <p className="text-[11px] text-red-400">{error}</p>}

                        <button
                           type="submit"
                           disabled={emailLoading || !email.trim()}
                           className="flex w-full items-center justify-center gap-2 bg-sand hover:bg-sand-light px-5 py-2.5 text-sm font-medium text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                           style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                        >
                           {emailLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                           Submit email
                        </button>
                     </form>
                  </div>
               ) : (
                  <form onSubmit={handleOtpSubmit} className="mt-5 flex flex-col gap-4">
                     {/* OTP boxes */}
                     <div className="flex items-center justify-center gap-2">
                        {otp.map((digit, i) => (
                           <input
                              key={i}
                              ref={(el) => { otpRefs.current[i] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              disabled={otpLoading}
                              className="w-11 h-12 text-center text-lg font-semibold text-sand bg-transparent border border-sand-faint rounded-lg outline-none focus:border-orange transition-colors disabled:opacity-40"
                           />
                        ))}
                     </div>

                     {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}

                     {otpLoading && (
                        <div className="flex justify-center">
                           <Loader2 size={16} className="animate-spin text-sand/40" />
                        </div>
                     )}

                     <button
                        type="button"
                        onClick={() => { setStep("entry"); setOtp(["", "", "", "", "", ""]); setError(null); }}
                        className="text-[11px] text-sand/40 hover:text-sand/70 transition-colors text-center cursor-pointer"
                     >
                        Use a different email
                     </button>
                  </form>
               )}
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
