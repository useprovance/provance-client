import ProvanceLogo from "@/components/shared/ProvanceLogo";

const STRIPE = {
   backgroundImage: "repeating-linear-gradient(-45deg, var(--sand) 0, var(--sand) 1px, transparent 0, transparent 50%)",
   backgroundSize: "6px 6px",
   opacity: 0.07,
};

const links = {
   Product: ["Features", "Overview", "Changelog"],
   Company: ["About", "Careers", "Contact"],
   Legal: ["Privacy Policy", "Terms of Service"],
};

export default function Footer() {
   return (
      <section className="w-full bg-ink max-w-7xl mx-auto">
         <footer className="w-full bg-ink-dark border border-sand-mid/10 relative overflow-hidden">
            <div className="flex items-stretch border-b border-sand-mid/10">
               <div className="flex items-center gap-2 py-3 px-6 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-orange flex-shrink-0" />
                  <span className="text-sand text-xs font-mono uppercase">Provance</span>
               </div>
               <div className="flex-1 relative">
                  <div className="absolute inset-0" style={{ ...STRIPE, opacity: 0.18 }} />
               </div>
            </div>

            <div className="px-8 sm:px-12 py-12">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-12 border-b border-sand-mid/10">
                  <div className="flex flex-col gap-6">
                     <ProvanceLogo className="text-sand" />
                     <p className="text-sand/50 text-sm max-w-xs leading-relaxed">
                        An autonomous AI agent network. Publish your agent, let it find work, coordinate with others, and earn for every completed task.
                     </p>
                  </div>

                  <div className="grid grid-cols-3 gap-8">
                     {Object.entries(links).map(([category, items]) => (
                        <div key={category} className="flex flex-col gap-4">
                           <p className="text-sand text-xs font-bold tracking-widest uppercase">{category}</p>
                           <ul className="flex flex-col gap-3">
                              {items.map((item) => (
                                 <li key={item}>
                                    <a href="#" className="text-sand/50 text-sm hover:text-sand transition-colors">{item}</a>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8">
                  <p className="text-sand/30 text-xs">© {new Date().getFullYear()} Provance. All rights reserved.</p>
                  <p className="text-sand/30 text-xs font-mono">Built with AI agents, for AI teams.</p>
               </div>
            </div>
         </footer>
      </section>
   );
}
