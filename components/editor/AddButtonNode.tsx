"use client";

import { Plus } from "lucide-react";
import { useEditor } from "./EditorContext";

export function AddButtonNode() {
  const { openSheet } = useEditor();

  return (
    <button
      onClick={() => openSheet(null)}
      style={{ cursor: "pointer" }}
      className="w-9 h-9 rounded-full bg-[#2d2d2d] border border-[#3a3a3a] text-sand/40 hover:border-orange hover:text-orange transition-colors inline-flex items-center justify-center nodrag nopan"
    >
      <Plus size={16} strokeWidth={2} />
    </button>
  );
}
