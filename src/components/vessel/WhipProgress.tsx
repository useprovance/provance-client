import showToast from '@/utils/toast.util';
import gsap from 'gsap';
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';

type Mode = 'playing' | 'paused' | 'done';
type Pt = { x: number; y: number };
type WhipState = { y: number[]; color: string };

export type WhipProgressHandle = {
	play: () => void;
	pause: () => void;
	reset: () => void;
	currentMode: Mode;
	setMode: (isPaused: boolean) => void;
};

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}
function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}
function lerpColor(color1: string, color2: string, t: number): string {
	const hex1 = color1.replace('#', '');
	const hex2 = color2.replace('#', '');

	const r1 = parseInt(hex1.substring(0, 2), 16);
	const g1 = parseInt(hex1.substring(2, 4), 16);
	const b1 = parseInt(hex1.substring(4, 6), 16);

	const r2 = parseInt(hex2.substring(0, 2), 16);
	const g2 = parseInt(hex2.substring(2, 4), 16);
	const b2 = parseInt(hex2.substring(4, 6), 16);

	const r = Math.round(lerp(r1, r2, t));
	const g = Math.round(lerp(g1, g2, t));
	const b = Math.round(lerp(b1, b2, t));

	return `#${r.toString(16).padStart(2, '0')}${g
		.toString(16)
		.padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function buildSmoothCubicPath(points: Pt[], tension = 0.58) {
	if (points.length < 2) return '';
	const t = clamp(tension, 0, 1);

	let d = `M ${points[0].x} ${points[0].y}`;

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i - 1] ?? points[i];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[i + 2] ?? p2;

		const dx1 = (p2.x - p0.x) * t;
		const dy1 = (p2.y - p0.y) * t;

		const dx2 = (p3.x - p1.x) * t;
		const dy2 = (p3.y - p1.y) * t;

		const c1x = p1.x + dx1 / 3;
		const c1y = p1.y + dy1 / 3;

		const c2x = p2.x - dx2 / 3;
		const c2y = p2.y - dy2 / 3;

		d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
	}

	return d;
}

const makeAnchorsX = (count: number, width: number) => {
	const step = width / (count - 1);
	return Array.from({ length: count }, (_, i) => i * step);
};

type WhipProgressProps = {
	height: number;
	className?: string;
	progress: number; // 0 to 100 comes from parent
	initialMode?: Mode; // Start with playing, paused, or done
};

const WhipProgress = forwardRef<WhipProgressHandle, WhipProgressProps>(
	function WhipProgress(props, ref) {
		const wrapRef = useRef<HTMLDivElement | null>(null);
		const [containerW, setContainerW] = useState(0);

		useEffect(() => {
			const el = wrapRef.current;
			if (!el) return;

			const ro = new ResizeObserver(entries => {
				const cr = entries[0]?.contentRect;
				if (!cr) return;
				const next = Math.max(0, Math.floor(cr.width));
				setContainerW(prev => (prev === next ? prev : next));
			});

			ro.observe(el);
			return () => ro.disconnect();
		}, []);

		const W = containerW;
		const H = props.height;

		const baseYPlay = props.height * 0.25;
		const baseYPause = baseYPlay + H * 0.25;

		const POINTS = 28;

		const purple = '#7c3aed';
		const gray = '#9ca3af';
		const green = '#22c55e';

		const whipDuration = 0.9;
		const whipTension = 0.65;
		const whipBend = 18;
		const whipSharpness = 2.0;

		const anchorsX = useMemo(() => {
			if (!W) return [];
			return makeAnchorsX(POINTS, W);
		}, [W]);

		const pathRef = useRef<SVGPathElement | null>(null);
		const modeRef = useRef<Mode>(props.initialMode || 'playing');
		const progressRef = useRef(0);

		const stateRef = useRef<WhipState>({
			y: Array.from({ length: POINTS }, () => baseYPlay),
			color: purple,
		});

		// Helper function to get color and Y position based on mode
		const getModeSettings = (mode: Mode) => {
			switch (mode) {
				case 'done':
					return { color: green, y: baseYPlay };
				case 'paused':
					return { color: gray, y: baseYPause };
				case 'playing':
				default:
					return { color: purple, y: baseYPlay };
			}
		};

		// Helper function to apply mode settings to path and state
		const applyModeSettings = (mode: Mode) => {
			const settings = getModeSettings(mode);
			const path = pathRef.current;

			if (path) {
				path.setAttribute('stroke', settings.color);
			}

			stateRef.current.color = settings.color;
			stateRef.current.y = Array.from({ length: POINTS }, () => settings.y);
		};

		const renderPath = () => {
			if (!anchorsX.length) return;
			const pts: Pt[] = anchorsX.map((x, i) => ({
				x,
				y: stateRef.current.y[i],
			}));
			const d = buildSmoothCubicPath(pts, whipTension);
			pathRef.current?.setAttribute('d', d);
		};

		const renderProgressReveal = () => {
			if (!W) return;

			const p = clamp(progressRef.current, 0, 100);
			const length = W;
			const visible = (p / 100) * length;

			const path = pathRef.current;
			if (!path) return;

			path.style.strokeDasharray = `${length}`;
			path.style.strokeDashoffset = `${length - visible}`;
		};

		const setFlat = (y: number) => {
			stateRef.current.y = Array.from({ length: POINTS }, () => y);
			renderPath();
		};

		const runWhip = (opts: {
			fromY: number;
			toY: number;
			fromColor: string;
			toColor: string;
			direction: 'rtl' | 'ltr';
			onDone: () => void;
		}) => {
			const { fromY, toY, fromColor, toColor, direction, onDone } = opts;

			const path = pathRef.current;
			if (!path) return;

			renderProgressReveal();

			const proxy = { p: 0 };
			const sign = toY > fromY ? 1 : -1;

			gsap.to(proxy, {
				p: 1,
				duration: whipDuration,
				ease: 'power1.inOut',
				onUpdate() {
					const p = proxy.p;

					const currentColor = lerpColor(fromColor, toColor, p);
					stateRef.current.color = currentColor;
					path.setAttribute('stroke', currentColor);

					const yArr = stateRef.current.y;
					for (let i = 0; i < POINTS; i++) {
						const t = i / (POINTS - 1);
						const local = direction === 'rtl' ? 1 - t : t;

						const rawInfluence = (p - local) * whipSharpness;
						const influence = clamp(rawInfluence, 0, 1);

						let smoothInfluence =
							influence * influence * (3 - 2 * influence);
						smoothInfluence =
							smoothInfluence *
							smoothInfluence *
							(3 - 2 * smoothInfluence);

						const y = lerp(fromY, toY, smoothInfluence);

						const bendIntensity = Math.sin(influence * Math.PI);
						const tailSoftness = 1 - Math.pow(smoothInfluence, 1.5);
						const bend =
							sign * whipBend * bendIntensity * tailSoftness * 0.6;

						yArr[i] = y + bend;
					}

					renderPath();
				},
				onComplete() {
					stateRef.current.y = Array.from({ length: POINTS }, () => toY);
					stateRef.current.color = toColor;
					path.setAttribute('stroke', toColor);
					renderPath();
					renderProgressReveal();
					onDone();
				},
			});
		};

		const pause = () => {
			if (modeRef.current !== 'playing') return;
			modeRef.current = 'paused';

			runWhip({
				fromY: baseYPlay,
				toY: baseYPause,
				fromColor: stateRef.current.color,
				toColor: gray,
				direction: 'ltr',
				onDone: () => {},
			});
		};

		const play = () => {
			if (modeRef.current !== 'paused') return;
			runWhip({
				fromY: baseYPause,
				toY: baseYPlay,
				fromColor: stateRef.current.color,
				toColor: purple,
				direction: 'ltr',
				onDone: () => {
					modeRef.current = 'playing';
				},
			});
		};

		const reset = () => {
			gsap.killTweensOf('*');

			modeRef.current = 'playing';
			progressRef.current = 0;

			applyModeSettings('playing');
			renderPath();
			renderProgressReveal();
		};

		useImperativeHandle(ref, () => ({
			play,
			pause,
			reset,
			currentMode: modeRef.current,
			setMode: (isPaused: boolean) => {
				if (isPaused) {
					pause();
					return;
				}
				play();
			},
		}));

		// initial svg setup
		useEffect(() => {
			if (!W) return;

			const path = pathRef.current;
			if (path) {
				path.setAttribute('stroke-width', '2.5');
				path.setAttribute('fill', 'none');
				path.setAttribute('stroke-linecap', 'round');
				path.setAttribute('stroke-linejoin', 'round');
			}

			// Use initialMode to set starting state
			const initialMode = props.initialMode || 'playing';
			modeRef.current = initialMode;
			applyModeSettings(initialMode);

			renderPath();
			renderProgressReveal();
		}, [W]);

		// progress comes from parent now
		useEffect(() => {
			if (!W) return;
			showToast.message(props.progress.toString());

			const next = clamp(props.progress, 0, 100);
			progressRef.current = next;

			const path = pathRef.current;
			if (!path) return;

			// Determine mode based on progress
			if (next >= 100) {
				modeRef.current = 'done';
				applyModeSettings('done');
			} else {
				// Keep current mode if not done
				applyModeSettings(modeRef.current);
			}

			setFlat(getModeSettings(modeRef.current).y);
			renderProgressReveal();
		}, [props.progress, W]);

		return (
			<div ref={wrapRef} className={props.className}>
				{W > 0 && (
					<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
						<path ref={pathRef} />
					</svg>
				)}
			</div>
		);
	}
);

export default WhipProgress;
