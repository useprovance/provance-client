"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import ProvanceLogo from "@/components/shared/ProvanceLogo";
import Link from "next/link";
import AuthModal from "@/components/shared/AuthModal";

const navLinks = [
   { label: "Docs", href: "/docs/introduction" },
   { label: "Overview", href: "#overview" },
   { label: "Features", href: "#features" },
   { label: "FAQ", href: "#faq" },
];

export default function Header() {
   const [open, setOpen] = useState(false);
   const [authOpen, setAuthOpen] = useState(false);

   return (
      <>
      <header className="sticky top-0 z-50 bg-ink-dark border-b border-sand-faint">
         {/* Main bar */}
         <div className="h-[8vh] max-h-[72px] flex items-center justify-between border-x border-sand-faint px-4 md:px-6 max-w-7xl mx-auto w-full">
            <Link href="/">
               <ProvanceLogo className="text-sand" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-10 h-full">
               {navLinks.map((link) => (
                  <a
                     key={link.label}
                     href={link.href}
                     className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                  >
                     {link.label}
                  </a>
               ))}
               <button
                  onClick={() => setAuthOpen(true)}
                  className="px-6 py-3 text-sm font-bold bg-orange text-ink-dark hover:bg-orange-dark transition-colors h-full flex items-center cursor-pointer"
               >
                  GET STARTED
               </button>
            </nav>

            {/* Mobile hamburger */}
            <button
               onClick={() => setOpen(!open)}
               className="md:hidden bg-orange text-ink-dark px-6 h-full cursor-pointer flex items-center"
               aria-label="Toggle menu"
            >
               {open ? <X size={18} /> : <Menu size={18} />}
            </button>
         </div>

         {/* Mobile menu */}
         {open && (
            <div className="md:hidden border-t border-sand-faint bg-ink-dark">
               <div className="border-x border-sand-faint flex flex-col max-w-7xl mx-auto w-full">
                  {navLinks.map((link) => (
                     <a
                        key={link.label}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="px-6 py-4 text-sm font-medium text-white/60 hover:text-white border-b border-sand-faint/40 transition-colors"
                     >
                        {link.label}
                     </a>
                  ))}
                  <button
                     onClick={() => { setOpen(false); setAuthOpen(true); }}
                     className="mx-6 my-4 flex items-center justify-center py-3 bg-orange text-ink-dark text-sm font-bold hover:bg-orange-dark transition-colors cursor-pointer"
                     style={{
                        clipPath:
                           "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
                     }}
                  >
                     GET STARTED
                  </button>
               </div>
            </div>
         )}
      </header>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
   </>
   );
}
