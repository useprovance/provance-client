"use client";

import { useState } from "react";
import AuthModal from "@/components/shared/AuthModal";

function WaitlistGraphic() {
   return (
      <svg
         display="block"
         role="presentation"
         viewBox="0 0 294 155"
         xmlns="http://www.w3.org/2000/svg"
         className="w-full h-full"
      >
         <path
            d="M 146 76.165 C 146 76.165 94.136 152.33 60.644 152.33 C 27.151 152.33 0 118.23 0 76.165 C 0 34.1 27.151 0 60.644 0 C 94.136 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 197.864 152.33 231.356 152.33 C 264.849 152.33 292 118.23 292 76.165 C 292 34.1 264.849 0 231.356 0 C 197.864 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 100.72 152.33 71.48 152.33 C 42.239 152.33 18.534 118.23 18.534 76.165 C 18.534 34.1 42.239 0 71.48 0 C 100.72 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 191.28 152.33 220.52 152.33 C 249.761 152.33 273.466 118.23 273.466 76.165 C 273.466 34.1 249.761 0 220.52 0 C 191.28 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 107.535 152.33 82.696 152.33 C 57.856 152.33 37.719 118.23 37.719 76.165 C 37.719 34.1 57.856 0 82.695 0 C 107.535 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 184.465 152.33 209.304 152.33 C 234.144 152.33 254.281 118.23 254.281 76.165 C 254.281 34.1 234.144 0 209.304 0 C 184.465 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 115.505 152.33 95.813 152.33 C 76.12 152.33 60.156 118.23 60.156 76.165 C 60.156 34.1 76.12 0 95.813 0 C 115.505 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 176.495 152.33 196.187 152.33 C 215.88 152.33 231.844 118.23 231.844 76.165 C 231.844 34.1 215.88 0 196.187 0 C 176.495 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 123.244 152.33 108.55 152.33 C 93.855 152.33 81.942 118.23 81.942 76.165 C 81.942 34.1 93.855 0 108.55 0 C 123.244 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 168.756 152.33 183.45 152.33 C 198.145 152.33 210.058 118.23 210.058 76.165 C 210.058 34.1 198.145 0 183.45 0 C 168.756 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 130.984 152.33 121.287 152.33 C 111.589 152.33 103.728 118.23 103.728 76.165 C 103.728 34.1 111.589 0 121.287 0 C 130.984 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 161.016 152.33 170.713 152.33 C 180.411 152.33 188.272 118.23 188.272 76.165 C 188.272 34.1 180.411 0 170.713 0 C 161.016 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 138.723 152.33 134.024 152.33 C 129.324 152.33 125.515 118.23 125.515 76.165 C 125.515 34.1 129.324 0 134.024 0 C 138.723 0 146 76.165 146 76.165 Z M 146 76.165 C 146 76.165 153.277 152.33 157.976 152.33 C 162.676 152.33 166.485 118.23 166.485 76.165 C 166.485 34.1 162.676 0 157.976 0 C 153.277 0 146 76.165 146 76.165 Z M 146 76.165 C 146 118.23 146.03 152.33 146.067 152.33 C 146.105 152.33 146.163 76.165 146.163 76.165 M 146 76.165 C 146 34.1 146.03 0 146.067 0 C 146.105 0 146.163 76.165 146.163 76.165 M 146.163 76.165 C 146.163 76.165 146.221 152.33 146.258 152.33 C 146.295 152.33 146.325 118.23 146.325 76.165 C 146.325 34.1 146.295 0 146.258 0 C 146.221 0 146.163 76.165 146.163 76.165 Z"
            fill="var(--ink-dark)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth=".4"
            stroke="var(--sand-mid)"
            transform="translate(1 1.335)"
         />
      </svg>
   );
}

export default function Waitlist() {
   const [authOpen, setAuthOpen] = useState(false);

   return (
    <>
      <section id="get-started" className="w-full bg-ink max-w-7xl mx-auto">
         <div className="w-full bg-ink-dark border border-sand-mid/10 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
               {/* Left — content + CTA */}
               <div className="order-2 lg:order-1 flex flex-col justify-between px-8 sm:px-12 py-12 sm:py-20 border-t lg:border-t-0 lg:border-r border-sand-mid/10">
                  <div className="flex items-center justify-between w-full max-w-lg border-t border-b py-3 border-sand/40">
                     <div className="flex items-center gap-2 pr-6 flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange flex-shrink-0" />
                        <p className="text-sand text-xs font-mono uppercase">
                           Start Now
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
                  <div className="flex flex-col gap-6 max-w-lg mt-10">
                     <h2 className="font-geist text-4xl sm:text-5xl font-normal text-sand leading-tight">
                        Your agent workforce
                        <span className="text-white"> starts here.</span>
                     </h2>
                     <p className="text-sand/70 text-md leading-relaxed max-w-lg">
                        Build and deploy autonomous AI agent workflows today. The right work always gets to the right agent, automatically.
                     </p>
                  </div>

                  <div className="mt-8 flex flex-col gap-4">
                     <button
                        onClick={() => setAuthOpen(true)}
                        className="flex items-center justify-center w-full max-w-lg h-[52px] bg-sand text-ink-dark font-bold text-xs tracking-widest hover:bg-sand-light transition-colors cursor-pointer"
                        style={{
                           clipPath:
                              "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
                        }}
                     >
                        GET STARTED
                     </button>
                  </div>
               </div>

               {/* Right — graphic */}
               <div className="order-1 lg:order-2 relative min-h-[280px] sm:min-h-[360px] lg:min-h-0 overflow-hidden bg-orange">
                  <div
                     className="absolute inset-0 pointer-events-none"
                     style={{
                        backgroundColor: "rgba(29,29,29,0.8)",
                        WebkitMaskImage: "url('/icons/dots.svg')",
                        WebkitMaskSize: "7px 7px",
                        maskImage: "url('/icons/dots.svg')",
                        maskSize: "7px 7px",
                     }}
                  />
                  <div
                     className="absolute z-10"
                     style={{
                        width: "209%",
                        top: "16px",
                        left: "16px",
                     }}
                  >
                     <WaitlistGraphic />
                  </div>
               </div>
            </div>
         </div>
      </section>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
   );
}
