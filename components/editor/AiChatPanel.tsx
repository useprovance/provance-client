"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Send, Loader2, Plus, PanelLeftClose } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import {
   DefaultChatTransport,
   lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
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

const DEFAULT_WIDTH = 340;
const MIN_WIDTH = 260;
const MAX_WIDTH = 560;

export function AiChatPanel({
   workflowId,
   onCollapse,
}: {
   workflowId: string;
   onCollapse: () => void;
}) {
   const [width, setWidth] = useState(DEFAULT_WIDTH);
   const bottomRef = useRef<HTMLDivElement>(null);
   const dragStartX = useRef<number | null>(null);
   const dragStartWidth = useRef<number>(DEFAULT_WIDTH);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
   const { logs, canvasActions } = useEditor();

   const { messages, sendMessage, addToolOutput, status, setMessages } =
      useChat({
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
               const nodeId = canvasActions.addNode(
                  input.agentId as string,
                  input.actionKey as string | undefined,
               );
               addToolOutput({
                  tool: "add_node",
                  toolCallId,
                  output: nodeId ?? "done",
               });
            } else if (toolName === "connect_nodes") {
               canvasActions.connectNodes(
                  input.sourceId as string,
                  input.targetId as string,
               );
               addToolOutput({
                  tool: "connect_nodes",
                  toolCallId,
                  output: "done",
               });
            } else if (toolName === "configure_node") {
               const raw = input.params as Record<string, unknown>;
               const staticParams: Record<string, string> = {};
               const links: Record<string, string> = {};
               for (const [key, val] of Object.entries(raw)) {
                  const strVal = String(val);
                  if (strVal.includes("::") && !strVal.includes("{{"))
                     links[key] = strVal;
                  else staticParams[key] = strVal;
               }
               canvasActions.configureNode(
                  input.nodeId as string,
                  staticParams,
                  links,
               );
               addToolOutput({
                  tool: "configure_node",
                  toolCallId,
                  output: "done",
               });
            } else if (toolName === "remove_node") {
               canvasActions.removeNode(input.nodeId as string);
               addToolOutput({
                  tool: "remove_node",
                  toolCallId,
                  output: "done",
               });
            }
         },
         onFinish({ message }) {
            const textContent = message.parts
               .filter((p) => p.type === "text")
               .map((p) => (p as { type: "text"; text: string }).text)
               .join("");
            if (textContent) {
               void chatService.saveMessage(workflowId, {
                  role: "assistant",
                  content: textContent,
               });
            }
         },
      });

   const [input, setInput] = useState("");
   const thinking = status === "streaming" || status === "submitted";

   const autoResize = (el: HTMLTextAreaElement) => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
   };

   useEffect(() => {
      void chatService.loadMessages(workflowId).then((saved) => {
         if (saved.length > 0) {
            setMessages(
               saved.map((m) => ({
                  id: crypto.randomUUID(),
                  role: m.role,
                  parts: [{ type: "text" as const, text: m.content }],
                  metadata: {},
               })),
            );
         }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [workflowId]);

   useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   const send = useCallback(
      (text: string) => {
         const trimmed = text.trim();
         if (!trimmed || thinking) return;
         void chatService.saveMessage(workflowId, {
            role: "user",
            content: trimmed,
         });
         setInput("");
         sendMessage({ text: trimmed });
         if (textareaRef.current) textareaRef.current.style.height = "auto";
      },
      [thinking, workflowId, sendMessage],
   );

   const onDragMouseDown = useCallback(
      (e: React.MouseEvent) => {
         e.preventDefault();
         dragStartX.current = e.clientX;
         dragStartWidth.current = width;

         const onMouseMove = (ev: MouseEvent) => {
            if (dragStartX.current === null) return;
            const delta = ev.clientX - dragStartX.current;
            setWidth(
               Math.min(
                  MAX_WIDTH,
                  Math.max(MIN_WIDTH, dragStartWidth.current + delta),
               ),
            );
         };

         const onMouseUp = () => {
            dragStartX.current = null;
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
         };

         window.addEventListener("mousemove", onMouseMove);
         window.addEventListener("mouseup", onMouseUp);
      },
      [width],
   );

   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
         e.preventDefault();
         send(input);
      }
   };

   return (
      <div
         className="relative shrink-0 flex flex-col border-r border-white/8 bg-[#0f0f0f]"
         style={{ width }}
      >
         {/* Drag handle on right edge */}
         <div
            onMouseDown={onDragMouseDown}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize z-10 hover:bg-white/10 transition-colors"
         />

         {/* Header */}
         <div className="px-4 py-2 border-b border-white/8 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
               <Image
                  src="/icons/chat-sparkle.svg"
                  alt="Provance Agent"
                  width={18}
                  height={18}
                  className="brightness-0 invert"
               />
               <span className="text-[13px] font-semibold text-white">
                  Provance Agent
               </span>
            </div>
            <button
               onClick={onCollapse}
               className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer rounded-md hover:bg-white/8"
               title="Collapse"
            >
               <PanelLeftClose size={17} strokeWidth={1.5} />
            </button>
         </div>

         {/* Messages */}
         <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 flex flex-col gap-7">
            {messages.length === 0 ? (
               <div className="flex flex-col flex-1 justify-center gap-8">
                  <div className="flex flex-col items-center gap-3">
                     <Image
                        src="/icons/chat-sparkle.svg"
                        alt="Provance Agent"
                        width={32}
                        height={32}
                        className="brightness-0 invert opacity-80"
                     />
                     <div className="flex flex-col items-center gap-1">
                        <p className="text-[15px] font-semibold text-white">
                           Provance Agent
                        </p>
                        <p className="text-[12px] text-white/50 text-center leading-relaxed max-w-[200px]">
                           Ask me anything. I can see your canvas and recent
                           runs.
                        </p>
                     </div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-0.5 px-0.5">
                        Try asking
                     </p>
                     {SUGGESTIONS.map((s) => (
                        <button
                           key={s}
                           onClick={() => send(s)}
                           className="text-left px-3 py-2.5 text-[12px] text-white/70 hover:text-white border border-white/6 hover:border-white/14 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer leading-snug"
                        >
                           {s}
                        </button>
                     ))}
                  </div>
               </div>
            ) : (
               <>
                  {messages.map((msg) => {
                     const textParts = msg.parts.filter(
                        (p) => p.type === "text",
                     );
                     const text = textParts
                        .map((p) => (p as { type: "text"; text: string }).text)
                        .join("");
                     if (!text && msg.role === "assistant") return null;
                     return (
                        <div
                           key={msg.id}
                           className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                        >
                           {msg.role === "user" ? (
                              <div className="max-w-[85%] px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap bg-[#2f2f2f] rounded-lg text-white">
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
                        <span className="shimmer text-[13px] text-white/60">
                           Thinking...
                        </span>
                     </div>
                  )}
                  <div ref={bottomRef} />
               </>
            )}
         </div>

         {/* Input */}
         <div className="shrink-0 p-2">
            <div className="flex flex-col border border-white/15 rounded-lg overflow-hidden">
               <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                     setInput(e.target.value);
                     autoResize(e.target);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your workflow..."
                  rows={1}
                  disabled={thinking}
                  className="w-full bg-transparent text-[15px] font-medium text-white placeholder:text-white/30 px-3 pt-3 pb-2 outline-none resize-none disabled:opacity-50"
               />
               <div className="flex items-center justify-between px-1.5 pb-1.5 pt-0">
                  <button className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5">
                     <Plus size={20} strokeWidth={2.5} />
                  </button>
                  <button
                     onClick={() => send(input)}
                     disabled={!input.trim() || thinking}
                     className="w-8 h-8 flex items-center justify-center bg-white hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-full"
                  >
                     {thinking ? (
                        <Loader2
                           size={13}
                           className="animate-spin text-[#141414]"
                        />
                     ) : (
                        <Send
                           size={15}
                           strokeWidth={2}
                           className="text-[#141414]"
                        />
                     )}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}
