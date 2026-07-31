"use client";

import { useState, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import Image from "next/image";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useEditor } from "./EditorContext";
import type { AgentNode } from "./editor.constants";

type Tab = "parameters" | "settings";

interface Field {
   key: string;
   label: string;
   type: "text" | "textarea" | "select" | "number";
   placeholder?: string;
   options?: string[];
}

function getFields(label: string): Field[] {
   const l = label.toLowerCase();

   if (l.includes("trigger"))
      return [
         { key: "schedule", label: "Schedule", type: "select", options: ["Every minute", "Every 5 minutes", "Every hour", "Every day", "Custom cron"] },
         { key: "cron", label: "Cron expression", type: "text", placeholder: "0 * * * *" },
         { key: "webhook", label: "Webhook URL", type: "text", placeholder: "https://..." },
      ];

   if (l.includes("openai"))
      return [
         { key: "model", label: "Model", type: "select", options: ["gpt-4o", "gpt-4o-mini", "o3", "o4-mini"] },
         { key: "prompt", label: "System prompt", type: "textarea", placeholder: "You are a DeFi analyst..." },
         { key: "temperature", label: "Temperature", type: "number", placeholder: "0.7" },
         { key: "max_tokens", label: "Max tokens", type: "number", placeholder: "1024" },
      ];

   if (l.includes("telegram"))
      return [
         { key: "bot_token", label: "Bot token", type: "text", placeholder: "123456:ABC-DEF..." },
         { key: "chat_id", label: "Chat ID", type: "text", placeholder: "-100123456789" },
         { key: "message_template", label: "Message template", type: "textarea", placeholder: "⚠️ Alert: {{message}}" },
      ];

   if (l.includes("defillama"))
      return [
         { key: "protocols", label: "Protocols", type: "text", placeholder: "aave, uniswap, lido" },
         { key: "chains", label: "Chains", type: "text", placeholder: "ethereum, arbitrum" },
         { key: "metric", label: "Metric", type: "select", options: ["TVL", "Volume 24h", "Fees 24h", "Revenue 24h"] },
         { key: "threshold", label: "Change threshold (%)", type: "number", placeholder: "10" },
      ];

   if (l.includes("dune"))
      return [
         { key: "query_id", label: "Query ID", type: "text", placeholder: "1234567" },
         { key: "api_key", label: "API key", type: "text", placeholder: "••••••••" },
         { key: "refresh", label: "Refresh interval", type: "select", options: ["On trigger", "Every hour", "Every 6 hours", "Every day"] },
      ];

   if (l.includes("goplus"))
      return [
         { key: "token_address", label: "Token address", type: "text", placeholder: "0x..." },
         { key: "chain_id", label: "Chain", type: "select", options: ["Ethereum", "BSC", "Polygon", "Arbitrum", "Base"] },
         { key: "risk_level", label: "Min risk level to flag", type: "select", options: ["Low", "Medium", "High"] },
      ];

   return [
      { key: "config", label: "Configuration", type: "textarea", placeholder: "Enter configuration..." },
   ];
}

function FormField({ field }: { field: Field }) {
   const [value, setValue] = useState("");
   const base = "w-full bg-[#1a1a1a] border border-[#333] rounded-md text-[13px] text-sand placeholder:text-sand/25 outline-none focus:border-orange/60 transition-colors";

   return (
      <div className="flex flex-col gap-1.5">
         <label className="text-[11px] font-medium text-sand/50 uppercase tracking-wider">{field.label}</label>
         {field.type === "textarea" ? (
            <textarea
               value={value}
               onChange={(e) => setValue(e.target.value)}
               placeholder={field.placeholder}
               rows={4}
               className={`${base} px-3 py-2 resize-none`}
            />
         ) : field.type === "select" ? (
            <select
               value={value}
               onChange={(e) => setValue(e.target.value)}
               className={`${base} px-3 py-2`}
            >
               <option value="" disabled>Select...</option>
               {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
         ) : (
            <input
               type={field.type === "number" ? "number" : "text"}
               value={value}
               onChange={(e) => setValue(e.target.value)}
               placeholder={field.placeholder}
               className={`${base} px-3 py-2`}
            />
         )}
      </div>
   );
}

export function NodeConfigSheet() {
   const { isConfigOpen, closeConfig, configNodeId } = useEditor();
   const { getNode, setNodes } = useReactFlow();
   const [tab, setTab] = useState<Tab>("parameters");
   const [name, setName] = useState("");

   const node = configNodeId ? (getNode(configNodeId) as AgentNode | undefined) : undefined;

   useEffect(() => {
      if (node) setName(node.data.label);
   }, [node?.id]);

   const handleNameBlur = () => {
      if (!configNodeId || !name.trim()) return;
      setNodes((nds) =>
         nds.map((n) =>
            n.id === configNodeId ? { ...n, data: { ...n.data, label: name } } : n
         )
      );
   };

   if (!node) return null;

   const fields = getFields(node.data.label);

   return (
      <Sheet open={isConfigOpen} onOpenChange={(o) => { if (!o) closeConfig(); }}>
         <SheetContent
            side="right"
            className="w-[380px] bg-[#1c1c1c] border-l border-[#2a2a2a] p-0 flex flex-col"
         >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2a2a]">
               <div className="w-9 h-9 rounded-lg bg-[#2d2d2d] flex items-center justify-center shrink-0">
                  <Image src={node.data.icon} alt={node.data.label} width={22} height={22} className="object-contain" />
               </div>
               <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  className="flex-1 bg-transparent text-[15px] font-semibold text-sand outline-none border-b border-transparent focus:border-sand/20 transition-colors pb-0.5"
               />
               <button
                  onClick={closeConfig}
                  className="text-sand/30 hover:text-sand transition-colors cursor-pointer"
               >
                  <X size={15} strokeWidth={1.5} />
               </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#2a2a2a]">
               {(["parameters", "settings"] as Tab[]).map((t) => (
                  <button
                     key={t}
                     onClick={() => setTab(t)}
                     className={`px-5 py-3 text-[13px] font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
                        tab === t
                           ? "text-sand border-orange"
                           : "text-sand/35 border-transparent hover:text-sand/60"
                     }`}
                  >
                     {t}
                  </button>
               ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
               {tab === "parameters" ? (
                  fields.map((f) => <FormField key={f.key} field={f} />)
               ) : (
                  <>
                     <FormField field={{ key: "retries", label: "Retry on failure", type: "select", options: ["No retry", "1 retry", "3 retries", "5 retries"] }} />
                     <FormField field={{ key: "timeout", label: "Timeout (seconds)", type: "number", placeholder: "30" }} />
                     <FormField field={{ key: "notes", label: "Notes", type: "textarea", placeholder: "Add notes about this node..." }} />
                  </>
               )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#2a2a2a] flex justify-end gap-2">
               <button
                  onClick={closeConfig}
                  className="px-4 py-1.5 text-[13px] text-sand/50 hover:text-sand transition-colors cursor-pointer"
               >
                  Cancel
               </button>
               <button className="px-4 py-1.5 text-[13px] font-medium bg-orange text-white rounded-md hover:bg-orange/90 transition-colors cursor-pointer">
                  Save
               </button>
            </div>
         </SheetContent>
      </Sheet>
   );
}
