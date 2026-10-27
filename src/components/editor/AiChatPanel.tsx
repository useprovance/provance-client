import { useRef, useState } from "react";
import { Send, Plus, PanelLeftClose } from "lucide-react";

const SUGGESTIONS = [
   "What does this workflow do?",
   "Why did the last run fail?",
   "How can I improve this workflow?",
   "What agents should I add next?",
];

const DEFAULT_WIDTH = 340;
const MIN_WIDTH = 260;
const MAX_WIDTH = 560;

export function AiChatPanel({ onCollapse }: { onCollapse: () => void }) {
   const [width, setWidth] = useState(DEFAULT_WIDTH);
   const [input, setInput] = useState("");
   const dragStartX = useRef<number | null>(null);
   const dragStartWidth = useRef(DEFAULT_WIDTH);
   const textareaRef = useRef<HTMLTextAreaElement>(null);

   const autoResize = (el: HTMLTextAreaElement) => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
   };

   const onDragMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;
      const onMouseMove = (ev: MouseEvent) => {
         if (dragStartX.current === null) return;
         const delta = ev.clientX - dragStartX.current;
         setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta)));
      };
      const onMouseUp = () => {
         dragStartX.current = null;
         window.removeEventListener("mousemove", onMouseMove);
         window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
   };

   return (
      <div className="relative shrink-0 flex flex-col border-r border-white/8 bg-[#0f0f0f]" style={{ width }}>
         {/* Drag handle */}
         <div onMouseDown={onDragMouseDown} className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize z-10 hover:bg-white/10 transition-colors" />

         {/* Header */}
         <div className="px-4 py-2 border-b border-white/8 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
               <img src="/icons/chat-sparkle.svg" alt="Provance Agent" width={18} height={18} className="brightness-0 invert" />
               <span className="text-[13px] font-semibold text-white">Provance Agent</span>
            </div>
            <button
               onClick={onCollapse}
               className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer rounded-md hover:bg-white/8"
            >
               <PanelLeftClose size={17} strokeWidth={1.5} />
            </button>
         </div>

         {/* Empty state */}
         <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 flex flex-col">
            <div className="flex flex-col flex-1 justify-center gap-8">
               <div className="flex flex-col items-center gap-3">
                  <img src="/icons/chat-sparkle.svg" alt="Provance Agent" width={32} height={32} className="brightness-0 invert opacity-80" />
                  <div className="flex flex-col items-center gap-1">
                     <p className="text-[15px] font-semibold text-white">Provance Agent</p>
                     <p className="text-[12px] text-white/50 text-center leading-relaxed max-w-[200px]">
                        Ask me anything. I can see your canvas and recent runs.
                     </p>
                  </div>
               </div>
               <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-0.5 px-0.5">Try asking</p>
                  {SUGGESTIONS.map((s) => (
                     <button
                        key={s}
                        className="text-left px-3 py-2.5 text-[12px] text-white/70 hover:text-white border border-white/6 hover:border-white/14 bg-white/[0.03] hover:bg-white/[0.06] rounded-sm transition-all cursor-pointer leading-snug"
                     >
                        {s}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Input */}
         <div className="shrink-0 p-2">
            <div className="flex flex-col border border-white/15 rounded-lg overflow-hidden">
               <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) e.preventDefault(); }}
                  placeholder="Ask anything about your workflow..."
                  rows={1}
                  className="w-full bg-transparent text-[15px] font-medium text-white placeholder:text-white/30 px-3 pt-3 pb-2 outline-none resize-none"
               />
               <div className="flex items-center justify-between px-1.5 pb-1.5 pt-0">
                  <button className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5">
                     <Plus size={20} strokeWidth={2.5} />
                  </button>
                  <button
                     disabled={!input.trim()}
                     className="w-8 h-8 flex items-center justify-center bg-white hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-full"
                  >
                     <Send size={15} strokeWidth={2} className="text-[#141414]" />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}
