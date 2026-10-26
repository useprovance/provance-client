import showToast from '@/utils/toast.util';
import gsap from 'gsap';
import { useEffect, useMemo, useRef, useState } from 'react';

type WaveState = { y1: number; y2: number };

export default function TwoCurveStudy() {
	const pathRef = useRef<SVGPathElement | null>(null);
	const c1Ref = useRef<SVGCircleElement | null>(null);
	const c2Ref = useRef<SVGCircleElement | null>(null);

	const tlRef = useRef<gsap.core.Timeline | null>(null);
	const stateRef = useRef<WaveState>({ y1: 70, y2: 70 });

	const [isRunning, setIsRunning] = useState(false);

	const pointY = useMemo(
		() => ({
			base: 70,
			top: 0,
			bottom: 140,
		}),
		[]
	);

	const buildPath = (y1: number, y2: number) =>
		`M 0 70 Q 100 ${y1}, 200 70 Q 300 ${y2}, 400 70`;

	const render = () => {
		const { y1, y2 } = stateRef.current;
		const path = pathRef.current;
		const c1 = c1Ref.current;
		const c2 = c2Ref.current;
		if (!path || !c1 || !c2) return;

		path.setAttribute('d', buildPath(y1, y2));
		c1.setAttribute('cy', String(y1));
		c2.setAttribute('cy', String(y2));
	};

	useEffect(() => {
		// initial render
		render();

		// build timeline once
		const tl = gsap.timeline({
			paused: true,
			repeat: -1,
			defaults: { duration: 0.5, ease: 'power2.inOut' },
			onUpdate: render,
		});

		// animate the SAME object with keyframes
		tl.to(stateRef.current, { y1: pointY.top, y2: pointY.bottom })
			.to(stateRef.current, { y1: pointY.base, y2: pointY.base })
			.to(stateRef.current, { y1: pointY.bottom, y2: pointY.top })
			.to(stateRef.current, { y1: pointY.base, y2: pointY.base });

		tlRef.current = tl;

		return () => {
			tl.kill();
			tlRef.current = null;
		};
		// pointY is stable because of useMemo
	}, [pointY]);

	const toggle = () => {
		const tl = tlRef.current;
		if (!tl) return;

		if (tl.isActive() || isRunning) {
			tl.pause();
			setIsRunning(false);
			showToast.success('Paused');
			return;
		}

		tl.play();
		setIsRunning(true);
		showToast.success('Playing');
	};

	const reset = () => {
		const tl = tlRef.current;
		if (!tl) return;

		tl.pause(0);
		stateRef.current.y1 = pointY.base;
		stateRef.current.y2 = pointY.base;
		render();
		setIsRunning(false);
		showToast.success('Reset');
	};

	useEffect(() => {
		const fetchSeason = async () => {
			const resp = await fetch('/api/seasons');
			const data = await resp.json();
			console.log(data);
		};
		fetchSeason();
	}, []);

	return (
		<div className="mb-6">
			<svg
				width={400}
				height={140}
				viewBox="0 0 400 140"
				style={{ border: '1px solid #ddd' }}
			>
				<path
					ref={pathRef}
					d={buildPath(70, 70)}
					stroke="black"
					strokeWidth={4}
					fill="none"
				/>

				<circle fill="red" cx={0} cy={70} r={4} />
				<circle fill="red" cx={200} cy={70} r={4} />
				<circle fill="red" cx={400} cy={70} r={4} />

				<circle ref={c1Ref} cx={100} cy={70} r={5} fill="blue" />
				<circle ref={c2Ref} cx={300} cy={70} r={5} fill="blue" />
			</svg>

			<div className="flex gap-3 mt-5">
				<button
					className="px-8 py-3.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg"
					onClick={toggle}
				>
					{isRunning ? 'Stop' : 'Play'}
				</button>

				<button
					className="px-6 py-3.5 bg-white text-gray-900 rounded-lg font-medium border hover:bg-gray-50 transition-colors"
					onClick={reset}
				>
					Reset
				</button>
			</div>
		</div>
	);
}
