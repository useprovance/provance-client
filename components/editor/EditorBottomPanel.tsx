"use client";

import { useState } from "react";
import { Bot, EyeOff, Globe, MoreHorizontal, Play, Save, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PublishModal } from "./PublishModal";
import { AiChatSheet } from "./AiChatSheet";

type PanelTab = "logs" | "runs" | "executions";

const TABS: { key: PanelTab; label: string }[] = [
  { key: "logs", label: "Logs" },
  { key: "runs", label: "Runs" },
  { key: "executions", label: "Executions" },
];

function EmptyState({ tab }: { tab: PanelTab }) {
  const messages: Record<PanelTab, string> = {
    logs: "Nothing to display yet. Execute the workflow to see execution logs.",
    runs: "No runs yet. Execute the workflow to see run history.",
    executions: "No executions yet. Trigger the workflow to see execution details.",
  };
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-[13px] text-sand/30 text-center max-w-xs leading-relaxed">
        {messages[tab]}
      </p>
    </div>
  );
}

export function EditorBottomPanel() {
  const [tab, setTab] = useState<PanelTab>("logs");
  const [collapsed, setCollapsed] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <div
        className="shrink-0 border-t border-[#2a2a2a] bg-[#111] flex flex-col transition-all duration-200"
        style={{ height: collapsed ? "36px" : "220px" }}
      >
        {/* Tab bar */}
        <div className="flex items-center h-9 px-3 shrink-0 gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                if (tab === t.key && !collapsed) { setCollapsed(true); }
                else { setTab(t.key); setCollapsed(false); }
              }}
              className={`px-3 h-full text-[12px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                tab === t.key && !collapsed
                  ? "text-sand border-orange"
                  : "text-sand/35 border-transparent hover:text-sand/60"
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="flex items-center gap-1 ml-auto">
            {/* Publish status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium ${published ? "text-orange" : "text-sand/40"}`}>
              {published
                ? <Globe size={12} strokeWidth={1.5} />
                : <EyeOff size={12} strokeWidth={1.5} />}
              {published ? "Published" : "Unpublished"}
            </div>

            <button
              onClick={() => setAiOpen(true)}
              className="p-1.5 text-sand/70 hover:text-sand transition-colors cursor-pointer hover:bg-white/5"
            >
              <Bot size={14} strokeWidth={1.5} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 text-sand/70 hover:text-sand transition-colors cursor-pointer hover:bg-white/5">
                  <MoreHorizontal size={14} strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                className="w-44 bg-[#1c1c1c] border border-[#2a2a2a] p-1 mb-1"
              >
                <DropdownMenuItem
                  onClick={() => setPublishOpen(true)}
                  className="cursor-pointer px-3 py-2 text-[13px] text-orange font-medium focus:text-orange focus:bg-orange/8 gap-2.5 [&_svg]:!size-[13px] [&_svg]:!text-current"
                >
                  <Globe strokeWidth={1.5} />
                  Publish
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/6 my-1" />
                <DropdownMenuItem className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[13px] [&_svg]:!text-current">
                  <Save strokeWidth={1.5} />
                  Save
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[13px] [&_svg]:!text-current">
                  <Play strokeWidth={1.5} />
                  Test run
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/6 my-1" />
                <DropdownMenuItem className="cursor-pointer px-3 py-2 text-[13px] text-sand/70 focus:text-sand focus:bg-white/5 gap-2.5 [&_svg]:!size-[13px] [&_svg]:!text-current">
                  <Share2 strokeWidth={1.5} />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto flex flex-col border-t border-[#1e1e1e]">
            <EmptyState tab={tab} />
          </div>
        )}
      </div>

      <AiChatSheet open={aiOpen} onOpenChange={setAiOpen} />

      <PublishModal
        open={publishOpen}
        onOpenChange={(open) => { setPublishOpen(open); if (!open) setPublished(true); }}
        workflowName="Untitled Workflow"
        nodeCount={0}
      />
    </>
  );
}
