"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="w-full py-0.5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-[15px] leading-relaxed text-[#ffffff] mb-4 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-[#ffffff]">{children}</strong>,
          em: ({ children }) => <em className="italic text-[#ffffff]">{children}</em>,
          h1: ({ children }) => <p className="text-[17px] font-semibold text-[#ffffff] mt-5 mb-2">{children}</p>,
          h2: ({ children }) => <p className="text-[16px] font-semibold text-[#ffffff] mt-5 mb-2">{children}</p>,
          h3: ({ children }) => <p className="text-[15px] font-semibold text-[#ffffff] mt-4 mb-1.5">{children}</p>,
          ul: ({ children }) => <ul className="text-[15px] text-[#ffffff] mb-4 last:mb-0 pl-5 space-y-2 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="text-[15px] text-[#ffffff] mb-4 last:mb-0 pl-5 space-y-2 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="text-[15px] text-[#ffffff] leading-relaxed">{children}</li>,
          code: ({ children, className }) =>
            className?.includes("language-")
              ? <code className="block text-[13px] font-mono text-[#ffffff] bg-white/6 border border-white/8 rounded px-2.5 py-2 my-1.5 overflow-x-auto whitespace-pre break-all">{children}</code>
              : <code className="text-[13px] font-mono text-[#ffffff] bg-white/8 px-1 py-0.5 rounded break-all">{children}</code>,
          pre: ({ children }) => <div className="my-1.5 w-full overflow-hidden">{children}</div>,
          hr: () => <div className="border-t border-white/10 my-2" />,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-orange underline underline-offset-2 hover:text-orange/80">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
