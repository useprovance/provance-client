"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";

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

  return (
    <div
      className="shrink-0 border-t border-[#2a2a2a] bg-[#111] flex flex-col transition-all duration-200"
      style={{ height: collapsed ? "36px" : "220px" }}
    >
      {/* Tab bar */}
      <div className="flex items-center h-9 px-3 shrink-0 gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (collapsed) setCollapsed(false); }}
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
          <button className="p-1 text-sand/30 hover:text-sand/60 transition-colors cursor-pointer">
            <MoreHorizontal size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 text-sand/30 hover:text-sand/60 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto flex flex-col border-t border-[#1e1e1e]">
          <EmptyState tab={tab} />
        </div>
      )}
    </div>
  );
}
