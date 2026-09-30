"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ComponentPropsWithoutRef, ReactNode, JSX } from "react";

type El<T extends keyof JSX.IntrinsicElements> = { children?: ReactNode } & ComponentPropsWithoutRef<T>;
type CodeProps = { inline?: boolean; className?: string; children?: ReactNode } & ComponentPropsWithoutRef<"code">;

const components = {
  h1: ({ children, ...p }: El<"h1">) => (
    <h1 className="text-[36px] font-semibold text-white mb-6 leading-tight" {...p}>{children}</h1>
  ),
  h2: ({ children, ...p }: El<"h2">) => (
    <h2 className="text-[22px] font-semibold text-white mt-12 mb-4 leading-snug" {...p}>{children}</h2>
  ),
  h3: ({ children, ...p }: El<"h3">) => (
    <h3 className="text-[18px] font-semibold text-white mt-8 mb-3" {...p}>{children}</h3>
  ),
  p: ({ children, ...p }: El<"p">) => (
    <p className="text-[16px] text-white/70 leading-relaxed mb-5" {...p}>{children}</p>
  ),
  ul: ({ children, ...p }: El<"ul">) => (
    <ul className="mb-5 flex flex-col gap-2 list-none" {...p}>{children}</ul>
  ),
  ol: ({ children, ...p }: El<"ol">) => (
    <ol className="mb-5 flex flex-col gap-2 list-decimal list-outside ml-5" {...p}>{children}</ol>
  ),
  li: ({ children, ...p }: El<"li">) => (
    <li className="text-[16px] text-white/70 leading-relaxed flex gap-2 items-start before:content-['—'] before:text-orange before:shrink-0 before:mt-0.5" {...p}>{children}</li>
  ),
  a: ({ children, ...p }: El<"a">) => (
    <a className="text-orange hover:opacity-80 underline underline-offset-2 transition-opacity" {...p}>{children}</a>
  ),
  strong: ({ children, ...p }: El<"strong">) => (
    <strong className="text-white font-semibold" {...p}>{children}</strong>
  ),
  blockquote: ({ children, ...p }: El<"blockquote">) => (
    <blockquote className="border-l-2 border-orange pl-4 my-6 text-white/70 italic" {...p}>{children}</blockquote>
  ),
  hr: ({ ...p }: El<"hr">) => (
    <hr className="my-10 border-sand-faint" {...p} />
  ),
  table: ({ children, ...p }: El<"table">) => (
    <div className="overflow-x-auto my-8">
      <table className="w-full border-collapse text-[15px]" {...p}>{children}</table>
    </div>
  ),
  thead: ({ children, ...p }: El<"thead">) => (
    <thead className="border-b border-sand-faint" {...p}>{children}</thead>
  ),
  tr: ({ children, ...p }: El<"tr">) => (
    <tr className="border-b border-sand-faint" {...p}>{children}</tr>
  ),
  th: ({ children, ...p }: El<"th">) => (
    <th className="py-2 px-4 text-left text-[11px] font-mono uppercase tracking-widest text-white/70" {...p}>{children}</th>
  ),
  td: ({ children, ...p }: El<"td">) => (
    <td className="py-2.5 px-4 text-white/70" {...p}>{children}</td>
  ),
  code: ({ inline, className, children, ...p }: CodeProps) => {
    const match = /language-(\w+)/.exec(className ?? "");
    if (!inline && match) {
      return (
        <div className="my-6 overflow-hidden border border-sand-faint">
          <SyntaxHighlighter
            // @ts-expect-error style type mismatch
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, background: "#151515", fontSize: "13px", padding: "16px" }}
            {...p}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      );
    }
    return (
      <code className="bg-ink-heavy border border-sand-faint rounded px-1.5 py-0.5 text-[12px] font-mono text-orange" {...p}>
        {children}
      </code>
    );
  },
};

export function DocsContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
