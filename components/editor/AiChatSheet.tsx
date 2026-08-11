"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUp, Loader2, Mic, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useEditor } from "./EditorContext";
import { workflowService } from "@/services/workflow.service";
import { chatService } from "@/services/chat.service";
import { MarkdownMessage } from "./MarkdownMessage";

const SUGGESTIONS = [
  "What does this workflow do?",
  "Why did the last run fail?",
  "How can I improve this workflow?",
  "What agents should I add next?",
];

interface AiChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
}

const MIN_WIDTH = 320;

function getDefaultWidth() {
  if (typeof window === "undefined") return 560;
  const vw = window.innerWidth;
  if (vw < 640) return vw;
  if (vw < 768) return Math.round(vw * 0.47);
  if (vw < 1024) return Math.round(vw * 0.44);
  if (vw < 1280) return Math.round(vw * 0.40);
  return Math.round(vw * 0.36);
}

export function AiChatSheet({ open, onOpenChange, workflowId }: AiChatSheetProps) {
  const [width, setWidth] = useState(getDefaultWidth);
  const maxWidth = useRef(getDefaultWidth());
  const bottomRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragStartWidth = useRef<number>(0);
  const { logs, canvasActions } = useEditor();

  const { messages, sendMessage, addToolOutput, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: () => ({
        canvas: workflowService.loadCanvas(workflowId),
        logs,
      }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
      if (!canvasActions) return;

      const { toolName, input, toolCallId } = toolCall as {
        toolName: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input: any;
        toolCallId: string;
      };

      if (toolName === "add_node") {
        const nodeId = canvasActions.addNode(input.agentId as string);
        addToolOutput({ tool: "add_node", toolCallId, output: nodeId ?? "done" });
      } else if (toolName === "connect_nodes") {
        canvasActions.connectNodes(input.sourceId as string, input.targetId as string);
        addToolOutput({ tool: "connect_nodes", toolCallId, output: "done" });
      } else if (toolName === "configure_node") {
        const raw = input.params as Record<string, unknown>;
        const staticParams: Record<string, string> = {};
        const links: Record<string, string> = {};
        for (const [key, val] of Object.entries(raw)) {
          const strVal = String(val);
          if (strVal.includes("::") && !strVal.includes("{{")) links[key] = strVal;
          else staticParams[key] = strVal;
        }
        canvasActions.configureNode(input.nodeId as string, staticParams, links);
        addToolOutput({ tool: "configure_node", toolCallId, output: "done" });
      } else if (toolName === "remove_node") {
        canvasActions.removeNode(input.nodeId as string);
        addToolOutput({ tool: "remove_node", toolCallId, output: "done" });
      }
    },
    onFinish({ message }) {
      const textContent = message.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("");
      if (textContent) {
        void chatService.saveMessage(workflowId, { role: "assistant", content: textContent });
      }
    },
  });

  const [input, setInput] = useState("");
  const thinking = status === "streaming" || status === "submitted";

  // Load persisted messages on mount
  useEffect(() => {
    void chatService.loadMessages(workflowId).then((saved) => {
      if (saved.length > 0) {
        setMessages(
          saved.map((m) => ({
            id: crypto.randomUUID(),
            role: m.role,
            parts: [{ type: "text" as const, text: m.content }],
            metadata: {},
          }))
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 80);
  }, [open]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    void chatService.saveMessage(workflowId, { role: "user", content: trimmed });
    setInput("");
    sendMessage({ text: trimmed });
  }, [thinking, workflowId, sendMessage]);

  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = width;

    const onMouseMove = (ev: MouseEvent) => {
      if (dragStartX.current === null) return;
      const delta = dragStartX.current - ev.clientX;
      const next = Math.min(maxWidth.current, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      setWidth(next);
    };

    const onMouseUp = () => {
      dragStartX.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [width]);

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
        className="!max-w-none bg-[#0f0f0f] border-l border-sand/8 p-0 flex flex-col gap-0"
        style={{ width }}
      >
        <div onMouseDown={onDragMouseDown} className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-10" />

        <SheetHeader className="px-5 py-4 border-b border-sand/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <Image src="/icons/chat-sparkle.svg" alt="Provance Agent" width={20} height={20} />
            <SheetTitle className="text-[13px] font-semibold text-sand">Provance Agent</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 flex flex-col gap-8">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-5 mt-4">
              <div className="flex flex-col items-center gap-2 py-6">
                <Image src="/icons/chat-sparkle.svg" alt="Provance Agent" width={28} height={28} />
                <p className="text-[13px] text-sand text-center leading-relaxed max-w-[260px]">
                  Ask me anything about your workflow. I can see your canvas and recent runs.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-sand/60 mb-1">Suggestions</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left px-3 py-2.5 text-[12px] text-sand hover:text-white border border-[#2a2a2a] hover:border-sand/40 bg-[#161616] hover:bg-[#1e1e1e] transition-colors cursor-pointer leading-relaxed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const textParts = msg.parts.filter((p) => p.type === "text");
                const text = textParts.map((p) => (p as { type: "text"; text: string }).text).join("");

                if (!text && msg.role === "assistant") {
                  return (
                    <div key={msg.id} className="flex flex-col items-start">
                      {thinking && (
                        <span className="shimmer text-[13px] text-sand/60">Thinking...</span>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    {msg.role === "user" ? (
                      <div className="max-w-[78%] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap bg-[#2f2f2f] rounded-lg text-[#f5ede0]">
                        {text}
                      </div>
                    ) : (
                      <MarkdownMessage content={text} />
                    )}
                  </div>
                );
              })}

              {thinking && (
                <div className="flex flex-col items-start">
                  <span className="shimmer text-[13px] text-sand/60">Thinking...</span>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-sand/12 p-4">
          <div className="flex flex-col border border-white/10 bg-[#141414] focus-within:border-white/20 transition-colors rounded-lg overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your workflow..."
              rows={2}
              disabled={thinking}
              className="w-full bg-transparent text-[13px] text-sand placeholder:text-sand/40 px-3 pt-2.5 pb-0 outline-none resize-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-1.5 pb-1.5 pt-0">
              <button className="w-9 h-9 flex items-center justify-center text-sand hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5">
                <Plus size={20} strokeWidth={2} />
              </button>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 flex items-center justify-center text-sand hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5">
                  <Mic size={19} strokeWidth={2} />
                </button>
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || thinking}
                  className="w-9 h-9 flex items-center justify-center bg-orange hover:bg-orange/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-full"
                >
                  {thinking
                    ? <Loader2 size={12} className="animate-spin text-white" />
                    : <ArrowUp size={16} strokeWidth={2.5} className="text-white" />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
