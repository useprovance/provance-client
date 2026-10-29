import { useRef, useState, useEffect, useCallback } from "react";

export interface TemplateVariable {
  id: string;    // "nodeId::key"
  key: string;   // just the output key e.g. "token_address"
  label: string; // "GeckoTerminal: Token address"
  icon?: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  variables: TemplateVariable[];
  required?: boolean;
}

// ── Chip inline styles (Tailwind classes are purged on JS-built DOM nodes) ──
const CHIP_STYLE = [
  "display:inline-flex",
  "align-items:center",
  "gap:4px",
  "margin:0 2px",
  "padding:2px 7px",
  "border-radius:2px",
  "font-size:11px",
  "font-family:monospace",
  "background:rgba(255,120,50,0.12)",
  "color:rgba(255,140,70,0.9)",
  "border:1px solid rgba(255,120,50,0.2)",
  "user-select:none",
  "cursor:default",
  "vertical-align:middle",
  "line-height:1.6",
  "white-space:nowrap",
].join(";");

function chipHtml(id: string, key: string, icon?: string): string {
  const img = icon
    ? `<img src="${icon}" style="width:11px;height:11px;object-fit:contain;opacity:0.7;display:block;flex-shrink:0">`
    : "";
  return `<span data-var="${id}" contenteditable="false" style="${CHIP_STYLE}">${img}{{${key}}}</span>`;
}

function buildChip(id: string, key: string, icon?: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.dataset.var = id;
  span.contentEditable = "false";
  span.setAttribute("style", CHIP_STYLE);
  if (icon) {
    const img = document.createElement("img");
    img.src = icon;
    img.setAttribute("style", "width:11px;height:11px;object-fit:contain;opacity:0.7;display:block;flex-shrink:0");
    span.appendChild(img);
  }
  span.appendChild(document.createTextNode(`{{${key}}}`));
  return span;
}

// Walk the contentEditable DOM and produce the raw template string
function serialize(el: HTMLElement): string {
  let out = "";
  function walk(node: Node, isFirst: boolean) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node instanceof HTMLElement) {
      if (node.dataset.var) {
        out += `{{${node.dataset.var}}}`;
      } else if (node.tagName === "BR") {
        out += "\n";
      } else {
        const isBlock = node.tagName === "DIV" || node.tagName === "P";
        if (isBlock && !isFirst) out += "\n";
        node.childNodes.forEach((c, i) => walk(c, i === 0 && isFirst));
      }
    }
  }
  el.childNodes.forEach((n, i) => walk(n, i === 0));
  return out;
}

// Turn a raw template string into innerHTML with chips
function toHtml(raw: string, variables: TemplateVariable[]): string {
  const parts = raw.split(/(\{\{[^}]+\}\})/g).filter(Boolean);
  return parts.map((p) => {
    const m = p.match(/^\{\{([^}]+)\}\}$/);
    if (!m) return p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
    const id = m[1];
    const v = variables.find((x) => x.id === id);
    const key = id.includes("::") ? id.split("::")[1] : id;
    return chipHtml(id, key, v?.icon);
  }).join("");
}

export function MessageTemplateField({ label, value, onChange, placeholder, variables, required }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const isInternalUpdate = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // Focus search input when menu opens
  useEffect(() => {
    if (menuOpen) setTimeout(() => searchRef.current?.focus(), 0);
  }, [menuOpen]);

  // Sync external value → innerHTML (skip if we just emitted)
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternalUpdate.current) return;
    if (serialize(el) !== value) el.innerHTML = toHtml(value, variables);
  }, [value, variables]);

  const emit = useCallback((el: HTMLElement) => {
    isInternalUpdate.current = true;
    onChange(serialize(el));
    setTimeout(() => { isInternalUpdate.current = false; }, 0);
  }, [onChange]);

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    emit(el);

    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text[range.startOffset - 1] === "@") {
        savedRange.current = range.cloneRange();
        const rect = range.getBoundingClientRect();
        setMenuPos({ top: rect.top, left: rect.left });
        setSearch("");
        setMenuOpen(true);
      }
    }
  };

  const handleSelect = (v: TemplateVariable) => {
    const el = editorRef.current;
    if (!el || !savedRange.current) return;
    el.focus();

    const sel = window.getSelection();
    if (!sel) return;

    const range = savedRange.current.cloneRange();
    try {
      range.setStart(range.startContainer, range.startOffset - 1);
      if (range.toString() === "@") range.deleteContents();
      else range.setStart(range.startContainer, range.startOffset + 1);
    } catch { /* text node may have changed */ }

    sel.removeAllRanges();
    sel.addRange(range);

    const chip = buildChip(v.id, v.key, v.icon);
    range.insertNode(chip);
    range.setStartAfter(chip);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    emit(el);
    setMenuOpen(false);
    setSearch("");
    savedRange.current = null;
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related && containerRef.current?.contains(related)) return;
    setMenuOpen(false);
  };

  const filtered = variables.filter(
    (v) =>
      !search ||
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <label className="text-[11px] font-mono uppercase tracking-widest text-white/60">
        {label}
        {required && <span className="text-orange ml-1">*</span>}
      </label>

      <div className="relative border border-[#2a2a2a] bg-[#0c0c0c] focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/10 transition-colors">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={(e) => { if (e.key === "Escape") setMenuOpen(false); }}
          onBlur={handleBlur}
          data-placeholder={placeholder ?? "Type a message... press @ to insert a variable"}
          className="min-h-[96px] w-full px-3 py-3 text-[13px] text-white outline-none leading-relaxed whitespace-pre-wrap break-words [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-white/20 [&:empty:before]:pointer-events-none"
        />
      </div>

      <p className="text-[11px] text-white/70">
        Press <kbd className="font-mono bg-white/5 px-1 text-white/40">@</kbd> to insert output from a connected node
      </p>

      {/* Variable picker dropdown */}
      {menuOpen && (
        <div
          className="fixed z-[9999] w-72 bg-[#1a1a1a] border border-[#2a2a2a] shadow-2xl overflow-hidden"
          style={{ top: menuPos.top - 8, left: menuPos.left, transform: "translateY(-100%)" }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 shrink-0">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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
              className="flex-1 bg-transparent text-[12px] text-white placeholder:text-white/30 outline-none"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-white/30">No variables found</p>
            ) : (
              filtered.map((v) => (
                <button
                  key={v.id}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(v); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/5 border-b border-[#1e1e1e] last:border-0 cursor-pointer transition-colors"
                >
                  {v.icon && (
                    <img src={v.icon} alt="" width={14} height={14} className="object-contain shrink-0 opacity-70" />
                  )}
                  <span className="flex-1 text-[12px] text-white/70 truncate">{v.label}</span>
                  <span className="text-[10px] text-white/30 font-mono shrink-0">{`{{${v.key}}}`}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
