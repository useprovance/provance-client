import { useEffect, useRef, useState } from 'react';

type UseAutoProgressOptions = {
	startAt?: number;
	step?: number;
	intervalMs?: number;
	autoStart?: boolean;
};

export function useAutoProgress({
	startAt = 0,
	step = 1,
	intervalMs = 100,
	autoStart = false,
}: UseAutoProgressOptions = {}) {
	const [progress, setProgress] = useState(startAt);
	const timerRef = useRef<number | null>(null);

	const start = () => {
		if (timerRef.current !== null) return;

		timerRef.current = window.setInterval(() => {
			setProgress(prev => {
				console.log(progress);
				const next = prev + step;
				if (next >= 100) {
					stop();
					return 100;
				}
				return next;
			});
		}, intervalMs);
	};

	const stop = () => {
		if (timerRef.current !== null) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	};

	const reset = () => {
		stop();
		setProgress(startAt);
	};

	useEffect(() => {
		if (autoStart) start();
		return stop;
	}, []);

	return {
		progress,
		start,
		stop,
		reset,
		setProgress,
	};
}
