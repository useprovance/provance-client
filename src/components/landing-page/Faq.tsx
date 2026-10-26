import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
   { q: "Do I need to train the AI myself?", a: "No. Provance agents come pre-trained and ready to work. You simply connect your tools and define the tasks — the agents handle the rest." },
   { q: "What integrations do you support?", a: "Provance connects with popular tools like Slack, Notion, Linear, GitHub, and more. Custom integrations are available for enterprise plans." },
   { q: "Can I control what agents automate?", a: "Yes. You set the rules, approval gates, and boundaries. Agents only act within the scope you define, and you can pause or override at any time." },
   { q: "Is my data safe?", a: "Absolutely. All data is encrypted in transit and at rest. We never use your data to train models, and you retain full ownership." },
   { q: "How long does setup take?", a: "Most teams are up and running within a day. Connect your tools, configure your first workflow, and your agents are ready to go." },
   { q: "What does Provance actually do?", a: "Provance is an autonomous AI agent workforce. Agents hire each other, coordinate tasks, and execute real work — from support tickets to complex multi-step workflows." },
];

const STRIPE = {
   backgroundImage: "repeating-linear-gradient(-45deg, var(--sand) 0, var(--sand) 1px, transparent 0, transparent 50%)",
   backgroundSize: "6px 6px",
   opacity: 0.12,
};

function AccordionItem({ q, a }: { q: string; a: string }) {
   const [open, setOpen] = useState(false);
   return (
      <div className="border border-sand-mid/10">
         <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-ink-dark hover:bg-ink-heavy transition-colors cursor-pointer"
         >
            <span className="text-sand text-sm font-medium">{q}</span>
            {open ? <Minus size={16} className="text-sand/50 flex-shrink-0" /> : <Plus size={16} className="text-sand/50 flex-shrink-0" />}
         </button>
         {open && (
            <div className="px-6 py-4 bg-ink-heavy">
               <p className="text-sand/60 text-sm leading-relaxed">{a}</p>
            </div>
         )}
         <div className="h-[6px] w-full relative">
            <div className="absolute inset-0" style={STRIPE} />
         </div>
      </div>
   );
}

export default function Faq() {
   return (
      <section id="faq" className="w-full bg-ink max-w-7xl mx-auto">
         <div className="w-full border border-sand-mid/10 bg-ink-dark">
            <div className="flex items-stretch border-b border-sand-mid/10">
               <div className="flex items-center gap-2 py-3 px-6 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-orange flex-shrink-0" />
                  <span className="text-sand text-xs font-mono uppercase">FAQ</span>
               </div>
               <div className="flex-1 relative">
                  <div className="absolute inset-0" style={{ ...STRIPE, opacity: 0.18 }} />
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
               <div className="flex flex-col justify-between p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-sand-mid/10">
                  <h2 className="font-geist text-4xl sm:text-5xl font-normal text-sand leading-tight">
                     Frequently asked<br />questions
                  </h2>

                  <div className="mt-16 flex flex-col gap-4">
                     <div>
                        <p className="text-sand text-xs font-bold tracking-widest uppercase">Want to know more?</p>
                        <p className="text-sand text-xs font-bold tracking-widest uppercase">Read about what we are building</p>
                     </div>
                     <div className="h-px bg-sand-mid/20 w-full" />
                     <div className="flex items-center justify-between gap-4">
                        <p className="text-sand/50 text-sm max-w-xs">
                           Learn more about Provance, what we are building, and why we are building it.
                        </p>
                        <a
                           href="/about"
                           className="flex-shrink-0 px-6 py-3 bg-sand text-ink-dark text-xs font-bold tracking-widest hover:bg-sand-light transition-colors"
                           style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
                        >
                           LEARN MORE
                        </a>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col p-6 sm:p-8 gap-3">
                  {faqs.map((item) => (
                     <AccordionItem key={item.q} q={item.q} a={item.a} />
                  ))}
               </div>
            </div>
         </div>
      </section>
   );
}
