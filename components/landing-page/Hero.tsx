"use client";

import { useState } from "react";
import HeroGraphic from "@/components/landing-page/HeroGraphic";
import AuthModal from "@/components/shared/AuthModal";

export default function Hero() {
   const [authOpen, setAuthOpen] = useState(false);

   return (
      <>
         <section className="grid grid-cols-1 md:grid-cols-2 md:gap-8 min-h-screen bg-ink max-w-7xl mx-auto border-b border-b-sand-faint ">
            {/* Left */}
            <div className="flex flex-col gap-6 md:gap-8 w-full  pt-16 md:pt-25 pb-12 md:pb-0 border-x border-sand-faint px-6 md:px-8 ">
               {/* Badge */}
               <div className="flex items-center justify-between w-full max-w-lg  border-t border-b  py-3 border-sand/40 ">
                  <div className="flex items-center gap-2  pr-6 flex-shrink-0">
                     <div className="w-2.5 h-2.5 rounded-full bg-orange flex-shrink-0" />
                     <p className="text-sand text-xs font-mono uppercase">
                        Autonomous Agent Network
                     </p>
                  </div>
                  <div
                     className="w-full h-full"
                     style={{
                        backgroundImage:
                           "repeating-linear-gradient(-45deg, var(--sand) 0, var(--sand) 1px, transparent 0, transparent 50%)",
                        backgroundSize: "6px 6px",
                        opacity: 0.2,
                     }}
                  />
               </div>

               <h1 className="font-geist text-4xl sm:text-5xl md:text-7xl leading-[1.2] text-sand tracking-tighter font-normal">
                  Get the Best Agent
                  <span className="text-white"> for any Task</span>
               </h1>

               <p className="text-sm md:text-base text-sand/70 leading-relaxed max-w-md">
                  Provance helps you discover the best agents for your specific
                  task so the right work always gets to the right agent,
                  automatically.
               </p>

               <div className="flex flex-col gap-4 w-full max-w-lg">
                  <button
                     onClick={() => setAuthOpen(true)}
                     className="flex items-center justify-center w-full h-[52px] bg-sand text-ink-dark font-bold text-sm hover:bg-sand-light transition-colors cursor-pointer"
                     style={{
                        clipPath:
                           "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
                     }}
                  >
                     GET STARTED
                  </button>
                  <div
                     className="w-full h-[52px] p-[2px]"
                     style={{
                        clipPath:
                           "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
                        background: "var(--sand-mid)",
                     }}
                  >
                     <a
                        href="#overview"
                        className="flex items-center justify-center w-full h-full text-sand font-bold text-sm transition-colors"
                        style={{
                           clipPath:
                              "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
                           background: "var(--ink-dark)",
                        }}
                     >
                        SEE HOW IT WORKS
                     </a>
                  </div>
               </div>
            </div>

            {/* Right */}
            <div className="relative flex items-center justify-center py-8 md:py-20 min-h-[40vh] md:min-h-0 border-x border-sand-faint">
               <div className="hero-dots absolute inset-0" />
               <HeroGraphic />
            </div>
         </section>

         <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
   );
}
