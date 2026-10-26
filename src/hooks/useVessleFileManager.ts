import { useEffect, useMemo, useRef, useState } from 'react';

export type SlotKey = 'first' | 'second' | 'third';
export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed';

export type UploadingFile = {
	file: File;
	preview: string;
	progress: number;
	status: UploadStatus;
	timeLeft: number;
};

export type FileSlots = Record<SlotKey, UploadingFile | null>;

type Args = {
	tickMs?: number;
	minSeconds?: number;
	maxSeconds?: number;
};

const safeRevoke = (url?: string) => {
	if (!url) return;
	if (!url.startsWith('blob:')) return;

	try {
		URL.revokeObjectURL(url);
	} catch (err) {
		console.warn('Failed to revoke object URL', err);
	}
};

export function useVesselFileManager({
	tickMs = 120,
	minSeconds = 10,
	maxSeconds = 15,
}: Args = {}) {
	const [files, setFiles] = useState<FileSlots>({
		first: null,
		second: null,
		third: null,
	});

	const [isUploading, setIsUploading] = useState(false);

	const [isPaused, setIsPaused] = useState(false);

	const slots = useMemo(() => ['first', 'second', 'third'] as SlotKey[], []);

	const timerRef = useRef<number | null>(null);

	const metaRef = useRef<
		Record<SlotKey, { durationMs: number; paused: boolean }>
	>({
		first: { durationMs: 0, paused: false },
		second: { durationMs: 0, paused: false },
		third: { durationMs: 0, paused: false },
	});

	const stopTimer = () => {
		if (timerRef.current == null) return;
		clearInterval(timerRef.current);
		timerRef.current = null;
	};

	const setSlotFile = (slot: SlotKey, file: File) => {
		const preview = URL.createObjectURL(file);
		setFiles(prev => ({
			...prev,
			[slot]: { file, preview, progress: 0, status: 'pending', timeLeft: 0 },
		}));
	};

	const deleteOne = (slot: SlotKey) => {
		setFiles(prev => {
			safeRevoke(prev[slot]?.preview);
			return { ...prev, [slot]: null };
		});
	};

	const deleteAll = () => {
		stopTimer();
		setIsUploading(false);
		setIsPaused(false);

		setFiles(prev => {
			slots.forEach(s => safeRevoke(prev[s]?.preview));
			return { first: null, second: null, third: null };
		});
	};

	const resetUpload = () => {
		stopTimer();
		setIsUploading(false);
		setIsPaused(false);

		setFiles(prev => {
			const next: FileSlots = { ...prev };
			slots.forEach(slot => {
				const f = next[slot];
				if (!f) return;
				next[slot] = { ...f, progress: 0, timeLeft: 0, status: 'pending' };
			});
			return next;
		});
		setFiles({
			first: null,
			second: null,
			third: null,
		});
	};

	const pauseAll = () => {
		slots.forEach(slot => {
			metaRef.current[slot].paused = true;
		});

		setFiles(prev => {
			const next: FileSlots = { ...prev };
			slots.forEach(slot => {
				const f = next[slot];
				if (f?.status === 'uploading')
					next[slot] = { ...f, status: 'paused' };
			});
			return next;
		});

		// setIsUploading(false);
		setIsPaused(true);
	};

	const ensureTimerRunning = () => {
		if (timerRef.current != null) return;

		timerRef.current = window.setInterval(() => {
			setFiles(prev => {
				const next: FileSlots = { ...prev };

				slots.forEach(slot => {
					const f = next[slot];
					if (!f) return;

					const meta = metaRef.current[slot];
					if (meta.paused) return;
					if (f.status !== 'uploading') return;
					if (f.progress >= 100) return;

					const steps = Math.max(1, Math.floor(meta.durationMs / tickMs));
					const inc = 100 / steps;

					const newProgress = Math.min(100, f.progress + inc);
					const remainingMs =
						meta.durationMs - (newProgress / 100) * meta.durationMs;
					const timeLeft = Math.max(0, Math.ceil(remainingMs / 1000));

					next[slot] = {
						...f,
						progress: newProgress,
						timeLeft: newProgress >= 100 ? 0 : timeLeft,
						status: newProgress >= 100 ? 'completed' : 'uploading',
					};
				});

				const stillUploading = slots.some(
					s => next[s]?.status === 'uploading'
				);
				if (!stillUploading) {
					stopTimer();
					setIsUploading(false);
				}

				return next;
			});
		}, tickMs);
	};

	const resumeAll = () => {
		slots.forEach(slot => {
			metaRef.current[slot].paused = false;
		});

		let shouldResume = false;

		setFiles(prev => {
			const next: FileSlots = { ...prev };
			slots.forEach(slot => {
				const f = next[slot];
				if (f?.status === 'paused')
					next[slot] = { ...f, status: 'uploading' };
			});

			// Check if there's work using the updated state
			shouldResume = slots.some(slot => {
				const f = next[slot];
				return f && f.progress < 100 && f.status === 'uploading';
			});

			return next;
		});

		if (shouldResume) {
			setIsUploading(true);
			setIsPaused(false);
			ensureTimerRunning();
		}
	};

	const startUpload = () => {
		const pending = slots.filter(slot => files[slot]?.status === 'pending');
		if (pending.length === 0) return;

		pending.forEach(slot => {
			const sec = minSeconds + Math.random() * (maxSeconds - minSeconds);
			metaRef.current[slot] = { durationMs: sec * 1000, paused: false };
		});

		setFiles(prev => {
			const next: FileSlots = { ...prev };
			pending.forEach(slot => {
				const f = next[slot];
				if (!f) return;
				next[slot] = { ...f, status: 'uploading' };
			});
			return next;
		});

		setIsUploading(true);
		setIsPaused(false);
		ensureTimerRunning();
	};

	useEffect(() => {
		return () => stopTimer();
	}, []);

	useEffect(() => {
		const saved = localStorage.getItem('uploaded_images');
		if (!saved) return;

		try {
			const parsed = JSON.parse(saved);

			(Object.keys(parsed) as SlotKey[]).forEach(slot => {
				const savedSlot = parsed[slot];
				if (!savedSlot) return;

				// reconstruct a lightweight File placeholder
				const blob = new Blob([], { type: 'image/jpeg' });
				const file = new File([blob], savedSlot.name ?? `${slot}.jpeg`, {
					type: 'image/jpeg',
				});
				Object.defineProperty(file, 'size', {
					value: savedSlot.size ?? 2500000,
				});

				setSlotFile(slot, file);

				// mark it completed immediately
				// we do this by setting state directly through the hook setter
				// without changing UI
			});
		} catch (e) {
			console.error('Failed to load images', e);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const allSlotsHaveFiles = slots.every(slot => files[slot] !== null);
	const allFilesCompleted = slots.every(
		slot => files[slot]?.status === 'completed'
	);
	const showUploadButton =
		allSlotsHaveFiles && !allFilesCompleted && !isUploading;

	// Calculate overall progress (average of all files)
	const progress = useMemo(() => {
		const filesWithProgress = slots
			.map(slot => files[slot])
			.filter((f): f is UploadingFile => f !== null);

		if (filesWithProgress.length === 0) return 0;

		const totalProgress = filesWithProgress.reduce(
			(sum, f) => sum + f.progress,
			0
		);

		return Math.round(totalProgress / filesWithProgress.length);
	}, [files, slots]);

	return {
		files,
		setFiles,
		slots,
		isUploading,
		isPaused,
		progress,
		showUploadButton,
		allSlotsHaveFiles,
		allFilesCompleted,

		setSlotFile,

		startUpload,
		pauseAll,
		resumeAll,
		resetUpload,

		deleteOne,
		deleteAll,
	};
}
