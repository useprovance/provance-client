import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownMessage({ content }: { content: string }) {
	return (
		<div className="py-0.5">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					p: ({ children }) => <p className="text-[16px] leading-relaxed text-white mb-4 last:mb-0">{children}</p>,
					strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
					ul: ({ children }) => <ul className="text-[16px] text-white mb-4 last:mb-0 pl-5 space-y-1.5 list-disc">{children}</ul>,
					ol: ({ children }) => <ol className="text-[16px] text-white mb-4 last:mb-0 pl-5 space-y-1.5 list-decimal">{children}</ol>,
					li: ({ children }) => <li className="text-[16px] text-white leading-relaxed">{children}</li>,
					code: ({ children, className }) =>
						className?.includes('language-') ? (
							<code className="block text-[13px] font-mono text-white bg-white/6 border border-white/8 rounded-lg px-3 py-2.5 my-2 overflow-x-auto whitespace-pre">
								{children}
							</code>
						) : (
							<code className="text-[13px] font-mono text-white bg-white/8 px-1.5 py-0.5 rounded">{children}</code>
						),
					pre: ({ children }) => <div className="my-2 w-full overflow-hidden">{children}</div>,
					hr: () => <div className="border-t border-white/10 my-3" />,
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
