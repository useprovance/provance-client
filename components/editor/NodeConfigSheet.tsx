"use client";

import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import Image from "next/image";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useEditor } from "./EditorContext";
import type { AgentNode } from "./editor.constants";
import { FormInput } from "@/components/ui/form-input";
import { FormSelector } from "@/components/ui/form-selector";
import { agentService, type AgentField } from "@/services/agent.service";
import { NODES } from "./editor.constants";
import { workflowService } from "@/services/workflow.service";

function FormField({ field, value, onChange }: { field: AgentField; value: string; onChange: (v: string) => void }) {
   if (field.type === "select") {
      return (
         <FormSelector
            label={field.label}
            value={value}
            onChange={onChange}
            options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
            placeholder="Select..."
         />
      );
   }

   return (
      <FormInput
         label={field.label}
         value={value}
         onChange={onChange}
         placeholder={field.placeholder}
         type={field.type === "number" ? "number" : field.type === "textarea" ? "textarea" : "text"}
         rows={4}
      />
   );
}

export function NodeConfigSheet({ workflowId }: { workflowId: string }) {
   const { isConfigOpen, closeConfig, configNodeId } = useEditor();
   const { getNode } = useReactFlow();
   const node = configNodeId ? (getNode(configNodeId) as AgentNode | undefined) : undefined;
   const agentId = node?.data.agentId as string | undefined;
   const agent = agentId
      ? (agentService.getById(agentId) ?? NODES.find((n) => n.id === agentId))
      : undefined;

   const savedNode = configNodeId
      ? workflowService.loadCanvas(workflowId).nodes.find((n) => n.id === configNodeId)
      : undefined;

   const [activeTab, setActiveTab] = useState(agent?.config[0]?.key ?? "");
   const [config, setConfig] = useState<Record<string, Record<string, string>>>(savedNode?.config ?? {});

   if (!node || !agent) return null;

   const label = agent.label;
   const icon = agent.icon;
   const activeConfig = agent.config.find((c) => c.key === activeTab);

   return (
      <Sheet open={isConfigOpen} onOpenChange={(o) => { if (!o) closeConfig(); }}>
         <SheetContent
            side="right"
            aria-describedby={undefined}
            className="w-[380px] bg-[#141414] border-l border-[#2a2a2a] p-0 flex flex-col [&>button]:hidden"
         >
            <SheetTitle className="sr-only">Node configuration</SheetTitle>

            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a2a2a]">
               <Image src={icon} alt={label} width={40} height={40} className="object-contain shrink-0" />
               <p className="flex-1 text-[15px] font-semibold text-sand">{label}</p>
               <button
                  onClick={closeConfig}
                  className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
               >
                  <X size={13} strokeWidth={2} className="text-sand/60" />
               </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#2a2a2a]">
               {agent.config.map((c) => (
                  <button
                     key={c.key}
                     onClick={() => setActiveTab(c.key)}
                     className={`px-5 py-3 text-[13px] font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
                        activeTab === c.key
                           ? "text-sand border-orange"
                           : "text-sand/35 border-transparent hover:text-sand/60"
                     }`}
                  >
                     {c.label}
                  </button>
               ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
               {activeConfig?.fields.map((f) => (
                  <FormField
                     key={f.key}
                     field={f}
                     value={config[activeTab]?.[f.key] ?? ""}
                     onChange={(v) => setConfig((prev) => ({
                        ...prev,
                        [activeTab]: { ...prev[activeTab], [f.key]: v },
                     }))}
                  />
               ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#2a2a2a] flex justify-end gap-2">
               <button
                  onClick={closeConfig}
                  className="px-4 py-1.5 text-[13px] text-sand/50 hover:text-sand transition-colors cursor-pointer"
               >
                  Cancel
               </button>
               <button
                  onClick={() => {
                     if (configNodeId) {
                        workflowService.updateNodeConfig(workflowId, configNodeId, config);
                     }
                  }}
                  className="px-4 py-1.5 text-[13px] font-medium bg-orange text-white hover:bg-orange/90 transition-colors cursor-pointer"
                  style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
               >
                  Save
               </button>
            </div>
         </SheetContent>
      </Sheet>
   );
}
