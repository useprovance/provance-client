"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Add a stop loss to my workflow",
  "What agents do I need for a DeFi monitor?",
  "How do I connect two agents together?",
  "Explain what the GoPlus agent does",
];

interface AiChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiChatSheet({ open, onOpenChange }: AiChatSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm working on that for you. This will be wired to the AI model soon." },
      ]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        showCloseButton
        onInteractOutside={(e) => e.preventDefault()}
        className="w-full sm:max-w-[420px] bg-[#0f0f0f] border-l border-sand/8 p-0 flex flex-col gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-sand/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <Image src="/icons/chat-sparkle.svg" alt="Provance Agent" width={20} height={20} />
            <SheetTitle className="text-[13px] font-semibold text-sand">
              Provance Agent
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-5 mt-4">
              <div className="flex flex-col items-center gap-2 py-6">
                <Image src="/icons/chat-sparkle.svg" alt="Provance Agent" width={28} height={28} />
                <p className="text-[13px] text-sand/40 text-center leading-relaxed max-w-[260px]">
                  Ask me to help build, fix, or explain anything in your workflow.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-sand/25 mb-1">
                  Suggestions
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left px-3 py-2.5 text-[12px] text-sand/50 hover:text-sand border border-[#222] hover:border-sand/20 bg-[#0c0c0c] hover:bg-[#161616] transition-colors cursor-pointer leading-relaxed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-orange/10 border border-orange/20 text-sand"
                        : "bg-sand/5 border border-sand/8 text-sand/80"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-sand/20 px-1">
                    {msg.role === "user" ? "You" : "AI"}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-sand/8 p-4">
          <div className="relative flex items-end gap-2 border border-sand/10 bg-sand/4 focus-within:border-sand/25 focus-within:ring-1 focus-within:ring-sand/8 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI anything..."
              rows={3}
              className="flex-1 bg-transparent text-[13px] text-sand placeholder:text-sand/20 px-3 py-3 outline-none resize-none"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="mb-2 mr-2 w-7 h-7 flex items-center justify-center bg-orange hover:bg-orange/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
            >
              <ArrowUp size={13} strokeWidth={2.5} className="text-white" />
            </button>
          </div>
          <p className="text-[10px] text-sand/20 mt-2 font-mono">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
