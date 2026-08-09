"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUp, Loader2 } from "lucide-react";
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

      const { toolName, input } = toolCall as {
        toolName: string;
        input: Record<string, string>;
        toolCallId: string;
      };

      if (toolName === "add_node") {
        const nodeId = canvasActions.addNode(input.agentId);
        addToolOutput({ tool: "add_node", toolCallId: toolCall.toolCallId, output: nodeId ?? "done" });
      } else if (toolName === "connect_nodes") {
        canvasActions.connectNodes(input.sourceId, input.targetId);
        addToolOutput({ tool: "connect_nodes", toolCallId: toolCall.toolCallId, output: "done" });
      } else if (toolName === "configure_node") {
        canvasActions.configureNode(input.nodeId, input as Record<string, string>);
        addToolOutput({ tool: "configure_node", toolCallId: toolCall.toolCallId, output: "done" });
      } else if (toolName === "remove_node") {
        canvasActions.removeNode(input.nodeId);
        addToolOutput({ tool: "remove_node", toolCallId: toolCall.toolCallId, output: "done" });
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

        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-8">
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
                        <div className="flex items-center gap-2 py-1">
                          <Loader2 size={12} className="animate-spin text-sand/40" />
                          <span className="text-[13px] text-sand/40">Thinking...</span>
                        </div>
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

              {thinking && messages[messages.length - 1]?.role === "user" && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 size={12} className="animate-spin text-sand/40" />
                    <span className="text-[13px] text-sand/40">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-sand/12 p-4">
          <div className="relative flex items-end gap-2 border border-sand/20 bg-[#161616] focus-within:border-sand/40 focus-within:ring-1 focus-within:ring-sand/10 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your workflow..."
              rows={3}
              disabled={thinking}
              className="flex-1 bg-transparent text-[13px] text-sand placeholder:text-sand/40 px-3 py-3 outline-none resize-none disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || thinking}
              className="mb-2 mr-2 w-7 h-7 flex items-center justify-center bg-orange hover:bg-orange/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
            >
              {thinking
                ? <Loader2 size={12} className="animate-spin text-white" />
                : <ArrowUp size={13} strokeWidth={2.5} className="text-white" />
              }
            </button>
          </div>
          <p className="text-[10px] text-sand/50 mt-2 font-mono">Enter to send · Shift+Enter for new line</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
