"use client";

import { useState, useMemo, useCallback } from "react";
import { useReactFlow, useEdges } from "@xyflow/react";
import Image from "next/image";
import { X, Link2, Unlink } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { FormInput } from "@/components/ui/form-input";
import { FormSelector } from "@/components/ui/form-selector";
import { useEditor } from "./EditorContext";
import { NODES } from "./editor.constants";
import { agentService, type AgentField } from "@/services/agent.service";
import { workflowService } from "@/services/workflow.service";
import type { AgentNode } from "./editor.constants";

const LINKS_KEY = "__links";

function getParentOutputFields(
   configNodeId: string,
   edges: ReturnType<ReturnType<typeof useReactFlow>["getEdges"]>,
   getNode: ReturnType<typeof useReactFlow>["getNode"]
): { value: string; label: string; icon: string }[] {
   return edges
      .filter((e) => e.target === configNodeId)
      .flatMap((e) => {
         const parentNode = getNode(e.source);
         if (!parentNode) return [];
         const agentId = (parentNode.data as { agentId?: string })?.agentId;
         const parentAgent = agentId ? agentService.getById(agentId) : undefined;
         if (!parentAgent?.outputs?.length) return [];
         return parentAgent.outputs.map((o) => ({
            value: o.key,
            label: o.label,
            icon: parentAgent.icon,
         }));
      });
}

interface FieldProps {
  field: AgentField;
  value: string;
  onChange: (v: string) => void;
  linked: boolean;
  hasParents: boolean;
  parentOptions: { value: string; label: string; icon?: string }[];
  linkedParentId: string;
  onToggleLink: () => void;
  onSelectParent: (key: string) => void;
}

function Field({
  field, value, onChange,
  linked, hasParents, parentOptions, linkedParentId,
  onToggleLink, onSelectParent,
}: FieldProps) {
  const linkIcon = hasParents ? (
    <button
      onClick={(e) => { e.stopPropagation(); onToggleLink(); }}
      title={linked ? "Unlink — fill manually" : "Link to parent node output"}
      className={`flex items-center justify-center w-10 h-full shrink-0 transition-colors cursor-pointer ${
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

  if (field.type === "select") {
    return (
      <FormSelector
        label={field.label}
        value={value}
        onChange={onChange}
        options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
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

export function NodeConfigSheet({ workflowId }: { workflowId: string }) {
  const { isConfigOpen, closeConfig, configNodeId } = useEditor();
  const { getNode } = useReactFlow();
  const edges = useEdges();

  const node = configNodeId ? (getNode(configNodeId) as AgentNode | undefined) : undefined;
  const agentId = node?.data.agentId as string | undefined;
  const agent = agentId
    ? (agentService.getById(agentId) ?? NODES.find((n) => n.id === agentId))
    : undefined;

  const savedNode = configNodeId
    ? workflowService.loadCanvas(workflowId).nodes.find((n) => n.id === configNodeId)
    : undefined;

  const hasParentEdges = edges.some((e) => e.target === configNodeId);

  const [activeTab, setActiveTab] = useState(agent?.config[0]?.key ?? "");
  const [config, setConfig] = useState<Record<string, Record<string, string>>>(savedNode?.config ?? {});
  const [linked, setLinked] = useState<Record<string, string>>(
    hasParentEdges ? (savedNode?.config[LINKS_KEY] ?? {}) as Record<string, string> : {}
  );

  const parentOptions = useMemo(
    () => configNodeId ? getParentOutputFields(configNodeId, edges, getNode) : [],
    [configNodeId, edges, getNode]
  );

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
    workflowService.updateNodeConfig(workflowId, configNodeId, {
      ...config,
      [LINKS_KEY]: linked,
    });
  }, [workflowId, configNodeId, config, linked]);

  if (!node || !agent) return null;

  const activeConfig = agent.config.find((c) => c.key === activeTab);

  return (
    <Sheet open={isConfigOpen} onOpenChange={(o) => { if (!o) closeConfig(); }}>
      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="w-[380px] bg-[#141414] border-l border-[#2a2a2a] p-0 flex flex-col [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Node configuration</SheetTitle>

        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a2a2a]">
          <Image src={agent.icon} alt={agent.label} width={40} height={40} className="object-contain shrink-0" />
          <p className="flex-1 text-[15px] font-semibold text-sand">{agent.label}</p>
          <button
            onClick={closeConfig}
            className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={13} strokeWidth={2} className="text-sand/60" />
          </button>
        </div>

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

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {activeConfig?.fields.map((f) => (
            <Field
              key={f.key}
              field={f}
              value={config[activeTab]?.[f.key] ?? ""}
              onChange={(v) => setConfig((prev) => ({
                ...prev,
                [activeTab]: { ...prev[activeTab], [f.key]: v },
              }))}
              linked={linked[f.key] !== undefined}
              hasParents={hasParentEdges && activeTab === "parameters"}
              parentOptions={parentOptions}
              linkedParentId={linked[f.key] ?? ""}
              onToggleLink={() => toggleLink(f.key)}
              onSelectParent={(key) => setLinked((prev) => ({ ...prev, [f.key]: key }))}
            />
          ))}
        </div>

        <div className="px-5 py-4 border-t border-[#2a2a2a] flex justify-end gap-2">
          <button
            onClick={closeConfig}
            className="px-4 py-1.5 text-[13px] text-sand/50 hover:text-sand transition-colors cursor-pointer"
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
      </SheetContent>
    </Sheet>
  );
}
