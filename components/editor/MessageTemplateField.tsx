"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface TemplateVariable {
  key: string;
  label: string;
  icon: string;
}

interface MessageTemplateFieldProps {
  value: string;
  onChange: (v: string) => void;
  variables: TemplateVariable[];
}

function parseSegments(raw: string): { type: "text" | "var"; content: string }[] {
  const parts = raw.split(/(\{\{[^}]+\}\})/g);
  return parts.filter(Boolean).map((p) => {
    const m = p.match(/^\{\{([^}]+)\}\}$/);
    return m ? { type: "var", content: m[1] } : { type: "text", content: p };
  });
}

function serialize(el: HTMLElement): string {
  let out = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node instanceof HTMLElement && node.dataset.var) {
      out += `{{${node.dataset.var}}}`;
    }
  });
  return out;
}

// Inline styles — Tailwind classes are purged and won't apply to JS-built DOM nodes
const CHIP_STYLE = [
  "display:inline-flex",
  "align-items:center",
  "gap:4px",
  "margin:0 2px",
  "padding:1px 6px",
  "border-radius:3px",
  "font-size:12px",
  "font-family:monospace",
  "background:rgba(255,255,255,0.07)",
  "color:rgba(236,228,210,0.8)",
  "border:1px solid rgba(255,255,255,0.1)",
  "user-select:none",
  "cursor:default",
  "vertical-align:middle",
  "line-height:1.6",
].join(";");

function buildChipEl(key: string, icon: string): HTMLSpanElement {
  const chip = document.createElement("span");
  chip.dataset.var = key;
  chip.contentEditable = "false";
  chip.setAttribute("style", CHIP_STYLE);
  if (icon) {
    const img = document.createElement("img");
    img.src = icon;
    img.setAttribute("style", "width:12px;height:12px;object-fit:contain;opacity:0.7;display:block;flex-shrink:0");
    chip.appendChild(img);
  }
  chip.appendChild(document.createTextNode(`{{${key}}}`));
  return chip;
}

function chipHtml(key: string, icon?: string): string {
  const iconTag = icon
    ? `<img src="${icon}" style="width:12px;height:12px;object-fit:contain;opacity:0.7;display:block;flex-shrink:0">`
    : "";
  return `<span data-var="${key}" contenteditable="false" style="${CHIP_STYLE}">${iconTag}{{${key}}}</span>`;
}

export function MessageTemplateField({ value, onChange, variables }: MessageTemplateFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0 });
  const isInternalUpdate = useRef(false);
  // Saved cursor position RIGHT AFTER @ was typed (@ is at offset-1 in that text node)
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    if (menuOpen) setTimeout(() => searchRef.current?.focus(), 0);
  }, [menuOpen]);

  const toHtml = useCallback(
    (raw: string) =>
      parseSegments(raw)
        .map((seg) => {
          if (seg.type === "text")
            return seg.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
          const v = variables.find((x) => x.key === seg.content);
          return chipHtml(seg.content, v?.icon);
        })
        .join(""),
    [variables]
  );

  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternalUpdate.current) return;
    const current = serialize(el);
    if (current !== value) el.innerHTML = toHtml(value);
  }, [value, toHtml]);

  const emit = (el: HTMLElement) => {
    isInternalUpdate.current = true;
    onChange(serialize(el));
    setTimeout(() => { isInternalUpdate.current = false; }, 0);
  };

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    emit(el);

    // Detect @ after it's already been inserted into the DOM
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      const offset = range.startOffset;

      if (text[offset - 1] === "@") {
        // Save cursor position (right after @) so we can remove @ on select
        savedRange.current = range.cloneRange();
        const rect = range.getBoundingClientRect();
        const DROPDOWN_W = 288; // w-72
        const clampedLeft = Math.min(rect.left, window.innerWidth - DROPDOWN_W - 8);
        setMenuRect({ top: rect.top, left: Math.max(0, clampedLeft) });
        setSearch("");
        setMenuOpen(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") setMenuOpen(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related && containerRef.current?.contains(related)) return;
    setMenuOpen(false);
  };

  const handleSelect = (v: TemplateVariable) => {
    const el = editorRef.current;
    if (!el || !savedRange.current) return;

    el.focus();

    const sel = window.getSelection();
    if (!sel) return;

    // Restore cursor to right after @, then extend back 1 char to cover @
    const range = savedRange.current.cloneRange();
    try {
      const offset = range.startOffset;
      range.setStart(range.startContainer, offset - 1);
      if (range.toString() === "@") {
        range.deleteContents(); // removes the @ character
      } else {
        range.setStart(range.startContainer, offset); // restore if not @
      }
    } catch {
      // text node structure changed, just insert at current cursor
    }

    sel.removeAllRanges();
    sel.addRange(range);

    const chip = buildChipEl(v.key, v.icon);
    range.insertNode(chip);

    // Place cursor directly after chip — no zero-width space so backspace deletes chip in one press
    range.setStartAfter(chip);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    emit(el);
    setMenuOpen(false);
    setSearch("");
    savedRange.current = null;
  };

  const filtered = variables.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <label className="text-[11px] font-mono uppercase tracking-widest text-sand/40">
        Message template
      </label>

      <div className="relative">
        {menuOpen && (
          <div
            className="fixed z-[9999] w-72 bg-[#1a1a1a] border border-[#2a2a2a] rounded-sm shadow-2xl overflow-hidden"
            style={{ top: menuRect.top - 8, left: menuRect.left, transform: "translateY(-100%)" }}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sand/30 shrink-0">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Escape") setMenuOpen(false);
                  if (e.key === "Enter" && filtered.length > 0) handleSelect(filtered[0]);
                }}
                placeholder="Search variables..."
                className="flex-1 bg-transparent text-[12px] text-sand placeholder:text-sand/30 outline-none"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-3 py-3 text-[12px] text-sand/30">No variables found</p>
              )}
              {filtered.map((v) => (
                <button
                  key={v.key}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(v); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-sand/70 hover:text-sand hover:bg-white/5 border-b border-[#1e1e1e] last:border-0 cursor-pointer transition-colors"
                >
                  {v.icon && (
                    <Image src={v.icon} alt="" width={16} height={16} className="object-contain shrink-0 opacity-80" />
                  )}
                  <span className="flex-1 truncate">{v.label}</span>
                  <span className="text-[11px] text-sand/30 font-mono shrink-0">{`{{${v.key}}}`}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          data-placeholder="Type your message... press @ to insert variables"
          className="min-h-[96px] w-full rounded-sm border border-[#2a2a2a] bg-[#0c0c0c] px-3 py-2.5 text-[13px] text-sand outline-none hover:border-sand/20 focus:border-sand/30 leading-relaxed whitespace-pre-wrap break-words [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-sand/20 [&:empty:before]:pointer-events-none"
        />
      </div>

      <p className="text-[11px] text-sand/25">
        Press <kbd className="font-mono bg-white/5 px-1 rounded text-sand/40">@</kbd> to insert a variable — or just keep typing to use it as text
      </p>
    </div>
  );
}
