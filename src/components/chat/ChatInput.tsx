import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type KeyboardEvent,
	type MouseEvent,
} from 'react';
import { Plus, Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
	onSend: (text: string) => void;
	/** True while the AI is responding. You can still type, but sending waits */
	disabled?: boolean;
	placeholder?: string;
	/** Runs when the plus button is clicked */
	onAddClick?: () => void;
}

const LINE_HEIGHT = 24; // matches leading-6
const MAX_HEIGHT = 180;

/**
 * How tall the text would be at a given width.
 * Changes the textarea's size for a moment and puts it back
 * before the browser paints, so nothing flickers.
 */
function contentHeightAt(el: HTMLTextAreaElement, width: number) {
	const {
		width: oldWidth,
		height: oldHeight,
		overflowY: oldOverflow,
	} = el.style;
	el.style.width = `${width}px`;
	el.style.height = 'auto';
	el.style.overflowY = 'hidden'; // a scrollbar would steal width and cause extra wrapping
	const height = el.scrollHeight;
	el.style.width = oldWidth;
	el.style.height = oldHeight;
	el.style.overflowY = oldOverflow;
	return height;
}

/**
 * Once the text passes the max height, fade the top or bottom edge
 * when there is more text hidden there, so it's clear you can scroll.
 */
function updateEdgeFade(el: HTMLTextAreaElement) {
	const hiddenAbove = el.scrollTop > 4;
	const hiddenBelow = el.scrollHeight - el.clientHeight - el.scrollTop > 4;
	const mask =
		hiddenAbove || hiddenBelow
			? `linear-gradient(to bottom, ${hiddenAbove ? 'transparent' : '#000'} 0, #000 16px, #000 calc(100% - 16px), ${hiddenBelow ? 'transparent' : '#000'} 100%)`
			: '';
	el.style.maskImage = mask;
	el.style.setProperty('-webkit-mask-image', mask);
}

/**
 * Width of the text area in pill mode: the middle grid column.
 * It is the same in both layouts, so we can read it even in box mode.
 */
function pillTextWidth(wrapper: HTMLElement, el: HTMLTextAreaElement) {
	const columns = getComputedStyle(wrapper)
		.gridTemplateColumns.split(' ')
		.map(parseFloat);
	return columns.length === 3 && !Number.isNaN(columns[1])
		? columns[1]
		: el.clientWidth;
}

export function ChatInput({
	onSend,
	disabled = false,
	placeholder = 'Message Provance...',
	onAddClick,
}: ChatInputProps) {
	const [input, setInput] = useState('');
	const [multiline, setMultiline] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const multilineRef = useRef(multiline);
	multilineRef.current = multiline;

	const canSend = input.trim().length > 0 && !disabled;

	const resize = useCallback(() => {
		const el = textareaRef.current;
		const wrapper = wrapperRef.current;
		if (!el || !wrapper) return;

		// 1. Pick the layout. We always ask "would this fit on one line in the pill?",
		//    even while in box mode. Measuring in the current layout would make it flip
		//    back and forth, because the box is wider than the pill.
		const needsBox =
			el.value.length > 0 &&
			(el.value.includes('\n') ||
				contentHeightAt(el, pillTextWidth(wrapper, el)) >
					LINE_HEIGHT * 1.5);

		if (needsBox !== multilineRef.current) {
			setMultiline(needsBox);
			return; // the layout changes, and this runs again right after, before paint
		}

		// 2. Set the height for the current layout
		el.style.overflowY = 'hidden';
		el.style.height = 'auto';
		const contentHeight = el.scrollHeight;

		if (needsBox) {
			const overflowing = contentHeight > MAX_HEIGHT;
			el.style.height = `${Math.min(contentHeight, MAX_HEIGHT)}px`;
			el.style.overflowY = overflowing ? 'auto' : 'hidden';
			// Typing at the end: keep the last line fully in view
			if (overflowing && el.selectionStart === el.value.length) {
				el.scrollTop = el.scrollHeight;
			}
		} else {
			el.style.height = `${LINE_HEIGHT}px`;
		}

		updateEdgeFade(el);
	}, []);

	// Runs after every change, before the browser paints
	useLayoutEffect(() => {
		resize();
	}, [input, multiline, resize]);

	// Re-measure when the input gets wider or narrower, and once fonts finish loading
	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		let frame = 0;
		let lastWidth = wrapper.clientWidth;
		const observer = new ResizeObserver(([entry]) => {
			const width = entry.contentRect.width;
			if (width === lastWidth) return;
			lastWidth = width;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(resize);
		});

		observer.observe(wrapper);
		document.fonts?.ready.then(resize);

		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [resize]);

	const send = () => {
		const text = input.trim();
		if (!text || disabled) return;
		onSend(text);
		setInput('');

		const el = textareaRef.current;
		if (el) {
			el.scrollTop = 0;
			el.focus(); // clicking the button moves focus away, bring it back
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key !== 'Enter' || e.shiftKey) return;
		// Enter also confirms words while typing in Chinese, Japanese and on some
		// phone keyboards. Don't send in the middle of that.
		if (e.nativeEvent.isComposing || e.keyCode === 229) return;
		e.preventDefault();
		send();
	};

	// Clicking the empty space around the text still puts the cursor in the input
	const focusFromPadding = (e: MouseEvent<HTMLDivElement>) => {
		if (e.target !== e.currentTarget) return;
		e.preventDefault();
		textareaRef.current?.focus();
	};

	return (
		<div
			ref={wrapperRef}
			onMouseDown={focusFromPadding}
			data-multiline={multiline || undefined}
			className={`grid w-full cursor-text grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-1 rounded-3xl border border-white/8 bg-[#1a1a1a] px-2 transition-colors duration-200 focus-within:border-white/15 ${
				multiline ? 'gap-y-2 pb-[7px] pt-3' : 'py-[7px]'
			}`}
		>
			<textarea
				ref={textareaRef}
				value={input}
				onChange={e => setInput(e.target.value)}
				onKeyDown={handleKeyDown}
				onScroll={e => updateEdgeFade(e.currentTarget)}
				placeholder={placeholder}
				aria-label={placeholder}
				enterKeyHint="send"
				rows={1}
				className={`${
					multiline
						? 'col-span-full row-start-1'
						: 'col-start-2 row-start-1'
				} block h-6 w-full min-w-0 resize-none overflow-hidden bg-transparent px-2 py-0 text-[15px] leading-6 text-white outline-none placeholder:text-white/30 [scrollbar-width:thin]`}
			/>

			<button
				type="button"
				onClick={onAddClick}
				aria-label="Add attachment"
				className={`col-start-1 ${
					multiline ? 'row-start-2' : 'row-start-1'
				} flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/5 hover:text-white`}
			>
				<Plus size={18} strokeWidth={2} />
			</button>

			<button
				type="button"
				onClick={send}
				disabled={!canSend}
				aria-label={disabled ? 'Waiting for the response' : 'Send message'}
				className={`col-start-3 ${
					multiline ? 'row-start-2' : 'row-start-1'
				} flex size-8 shrink-0 items-center justify-center rounded-full bg-white transition-[opacity,background-color] enabled:cursor-pointer enabled:hover:bg-white/90 disabled:cursor-not-allowed ${
					!canSend && !disabled ? 'opacity-30' : ''
				}`}
			>
				{disabled ? (
					<Loader2 size={14} className="animate-spin text-[#141414]" />
				) : (
					<Send
						size={13}
						strokeWidth={2.5}
						className="translate-x-px text-[#141414]"
					/>
				)}
			</button>
		</div>
	);
}
