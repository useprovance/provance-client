import { useState, useEffect, useMemo, useCallback } from "react";
import { X, Link2, Unlink, DollarSign } from "lucide-react";
import { agentService, type Agent, type ProvanceField } from "@/services/agent.service";
import { extractActions } from "@/utils/agent.utils";
import { useEditorStore } from "@/stores/editor.store";
import { FormInput } from "@/components/ui/form-input";
import { FormSelector, type SelectOption } from "@/components/ui/form-selector";
import type { WorkflowNode } from "@/services/workflow.service";
import type { Edge, Node } from "@xyflow/react";

const LINKS_KEY = "__links";

function getParentOutputs(
   configNodeId: string,
   edges: Edge[],
   nodes: Node[],
   agentMap: Map<string, Agent>
): SelectOption[] {
   const parentIds = edges.filter((e) => e.target === configNodeId).map((e) => e.source);
   const results: SelectOption[] = [];

   for (const parentId of parentIds) {
      const parentNode = nodes.find((n) => n.id === parentId);
      if (!parentNode || parentNode.type !== "agent") continue;

      const nodeData = parentNode.data as WorkflowNode;
      const agent = agentMap.get(nodeData.nodeId);
      if (!agent) continue;

      const action = extractActions(agent.services).find((a) => a.key === nodeData.action.key);
      if (!action?.result) continue;

      for (const [fieldKey, field] of Object.entries(action.result)) {
         results.push({
            value: `${parentId}::${fieldKey}`,
            label: `${nodeData.label}: ${field.label}`,
            icon: nodeData.image_url ?? undefined,
         });
      }
   }

   return results;
}

interface FieldProps {
   field: ProvanceField;
   value: string;
   onChange: (v: string) => void;
   linked: boolean;
   hasParents: boolean;
   parentOptions: SelectOption[];
   linkedParentId: string;
   onToggleLink: () => void;
   onSelectParent: (key: string) => void;
}

function Field({ field, value, onChange, linked, hasParents, parentOptions, linkedParentId, onToggleLink, onSelectParent }: FieldProps) {
   const linkIcon = hasParents ? (
      <button
         onClick={(e) => { e.stopPropagation(); onToggleLink(); }}
         title={linked ? "Unlink — fill manually" : "Link to parent node output"}
         className={`flex items-center justify-center w-10 self-stretch shrink-0 transition-colors cursor-pointer ${
            linked ? "bg-orange/10 text-orange hover:bg-orange/15" : "bg-white/4 text-sand/40 hover:bg-white/8 hover:text-sand/70"
         }`}
      >
         {linked ? <Link2 size={22} strokeWidth={1.6} /> : <Unlink size={22} strokeWidth={1.6} />}
      </button>
   ) : null;

   if (linked && hasParents) {
      return (
         <FormSelector
            label={field.label}
            value={linkedParentId}
            onChange={onSelectParent}
            options={parentOptions}
            placeholder="Select output field..."
            prefix={linkIcon}
         />
      );
   }

   if (field.type === "select" && field.options) {
      return (
         <FormSelector
            label={field.label}
            value={value}
            onChange={onChange}
            options={field.options.map((o) => ({ value: o, label: o }))}
            placeholder="Select..."
            prefix={linkIcon}
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
         prefix={linkIcon}
      />
   );
}

export function NodeConfigSheet() {
   const { workflowId, isConfigOpen, configNodeId, closeConfig, nodes, edges, updateNodeConfig } = useEditorStore();

   const [agent, setAgent] = useState<Agent | null>(null);
   const [activeTab, setActiveTab] = useState("");
   const [config, setConfig] = useState<Record<string, Record<string, string>>>({});
   const [linked, setLinked] = useState<Record<string, string>>({});

   const node = configNodeId ? nodes.find((n) => n.id === configNodeId) : null;
   const nodeData = node?.data as WorkflowNode | undefined;

   const hasParentEdges = edges.some((e) => e.target === configNodeId);

   useEffect(() => {
      if (!isConfigOpen || !nodeData) return;
      const savedConfig = nodeData.config as Record<string, Record<string, string>> ?? {};
      setConfig(savedConfig);
      setLinked(hasParentEdges ? (savedConfig[LINKS_KEY] ?? {}) : {});
      agentService.getById(nodeData.nodeId)
         .then((a) => {
            setAgent(a);
            const actions = extractActions(a.services);
            const action = actions.find((ac) => ac.key === nodeData.action.key);
            setActiveTab(action?.config[0]?.key ?? "");
         })
         .catch(() => setAgent(null));
   }, [isConfigOpen, configNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

   const action = useMemo(() => {
      if (!agent || !nodeData) return null;
      return extractActions(agent.services).find((a) => a.key === nodeData.action.key) ?? null;
   }, [agent, nodeData]);

   const agentMap = useMemo(() => new Map(agent ? [[agent.id, agent]] : []), [agent]);

   const parentOptions = useMemo(() => {
      if (!configNodeId) return [];
      return getParentOutputs(configNodeId, edges, nodes, agentMap);
   }, [configNodeId, edges, nodes, agentMap]);

   const toggleLink = useCallback((fieldKey: string) => {
      setLinked((prev) => {
         if (prev[fieldKey] !== undefined) {
            const next = { ...prev };
            delete next[fieldKey];
            return next;
         }
         return { ...prev, [fieldKey]: parentOptions[0]?.value ?? "" };
      });
   }, [parentOptions]);

   const handleSave = useCallback(() => {
      if (!configNodeId) return;
      updateNodeConfig(configNodeId, { ...config, [LINKS_KEY]: linked });
      closeConfig();
   }, [configNodeId, config, linked, updateNodeConfig, closeConfig]);

   const activeTabData = action?.config.find((c) => c.key === activeTab);

   if (!isConfigOpen || !nodeData) return null;

   return (
      <div className="absolute top-0 right-0 h-full w-[380px] bg-[#141414] border-l border-[#2a2a2a] flex flex-col z-20">

         {/* Header */}
         <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a2a2a]">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden">
               {nodeData.image_url ? (
                  <img src={nodeData.image_url} alt={nodeData.label} width={40} height={40} className="object-contain" />
               ) : (
                  <span className="text-white/30 text-xl">◈</span>
               )}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[15px] font-semibold text-white truncate">{nodeData.label}</p>
               <p className="text-[11px] text-white/40 truncate">{nodeData.action.label}</p>
            </div>
            <button
               onClick={closeConfig}
               className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
               <X size={13} strokeWidth={2} className="text-white/60" />
            </button>
         </div>

         {/* Tabs */}
         {action && action.config.length > 0 && (
            <div className="flex border-b border-[#2a2a2a]">
               {action.config.map((c) => (
                  <button
                     key={c.key}
                     onClick={() => setActiveTab(c.key)}
                     className={`px-5 py-3 text-[13px] font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
                        activeTab === c.key
                           ? "text-white border-orange"
                           : "text-white/35 border-transparent hover:text-white/60"
                     }`}
                  >
                     {c.label}
                  </button>
               ))}
            </div>
         )}

         {/* Fields */}
         <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
            {!agent ? (
               <div className="flex items-center justify-center h-full">
                  <p className="text-[12px] text-white/30">Loading...</p>
               </div>
            ) : !activeTabData || activeTabData.fields.length === 0 ? (
               <div className="flex items-center justify-center h-full">
                  <p className="text-[12px] text-white/30">No fields to configure</p>
               </div>
            ) : (<>
               {action.price !== undefined && (
                  <div className="flex items-center justify-between py-3 px-4" style={{ background: "oklch(18% 0 0)", border: "1px solid oklch(28% 0 0)" }}>
                     <div className="flex items-center gap-2 text-white/50 text-[13px]">
                        <DollarSign size={13} strokeWidth={2} />
                        <span>Price per call</span>
                     </div>
                     <span className="text-[13px] font-medium text-white/80">${action.price.amount} / {action.price.unit}</span>
                  </div>
               )}
               {activeTabData.fields.map((f) => (
                  <Field
                     key={f.key}
                     field={f}
                     value={config[activeTab]?.[f.key] ?? ""}
                     onChange={(v) => setConfig((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], [f.key]: v } }))}
                     linked={linked[f.key] !== undefined}
                     hasParents={hasParentEdges && activeTab === "parameters"}
                     parentOptions={parentOptions}
                     linkedParentId={linked[f.key] ?? ""}
                     onToggleLink={() => toggleLink(f.key)}
                     onSelectParent={(key) => setLinked((prev) => ({ ...prev, [f.key]: key }))}
                  />
               ))}
            </>)}
         </div>

         {/* Footer */}
         <div className="px-5 py-4 border-t border-[#2a2a2a] flex justify-end gap-2">
            <button
               onClick={closeConfig}
               className="px-4 py-1.5 text-[13px] text-white/50 hover:text-white transition-colors cursor-pointer"
            >
               Cancel
            </button>
            <button
               onClick={handleSave}
               className="px-4 py-1.5 text-[13px] font-medium bg-orange text-white hover:bg-orange/90 transition-colors cursor-pointer"
               style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
            >
               Save
            </button>
         </div>
      </div>
   );
}
