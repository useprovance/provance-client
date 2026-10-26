import React, { useRef, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Upload,
	X,
	AlertCircle,
	UploadCloud,
	Minimize2,
	Maximize2,
	Pause,
	CloudCheck,
	RotateCcw,
} from 'lucide-react';
import { z } from 'zod';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useZodValidation } from '@/hooks/useZodValidation';
import WhipProgress, { type WhipProgressHandle } from './WhipProgress';
import { useVesselFileManager } from '@/hooks/useVessleFileManager';
import { formatFileSize } from '@/utils/file.utils';

// Validation schema
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_IMAGE_TYPES = [
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/webp',
];

const fileSchema = z.object({
	file: z
		.instanceof(File)
		.refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 20MB.`)
		.refine(
			file => ACCEPTED_IMAGE_TYPES.includes(file.type),
			'.jpg, .jpeg, .png and .webp files are accepted.'
		),
});

const formSchema = z.object({
	first: z.instanceof(File).optional(),
	second: z.instanceof(File).optional(),
	third: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type SlotKey = 'first' | 'second' | 'third';

function FileUploader() {
	const fileInputRefs = useRef<Record<SlotKey, HTMLInputElement | null>>({
		first: null,
		second: null,
		third: null,
	});
	const whipRef = useRef<WhipProgressHandle>(null);

	const [isMinimized, setIsMinimized] = useState(false);

	const {
		files,
		isUploading,
		showUploadButton,
		setSlotFile,
		startUpload: startSlotUploads,
		pauseAll,
		isPaused,
		resumeAll,
		deleteOne,
		allFilesCompleted,
		progress,
	} = useVesselFileManager();

	const { errors, validateAndTouch, clearErrors } =
		useZodValidation<FormValues>({
			first: undefined,
			second: undefined,
			third: undefined,
		});

	const handleSlotClick = (slot: SlotKey) => {
		if (isUploading || files[slot]?.status === 'uploading') return;
		fileInputRefs.current[slot]?.click();
	};

	const handleToggleMinimize = () => {
		if (isMinimized) {
			setIsMinimized(false);
			return;
		}
		setIsMinimized(true);
	};

	const handlePauseToggle = () => {
		if (!isPaused) {
			whipRef.current?.pause();
			pauseAll();
			return;
		}
		resumeAll();
		whipRef.current?.play();
	};

	const handleFileSelect = (
		slot: SlotKey,
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		clearErrors();

		const result = fileSchema.safeParse({ file });
		if (!result.success) {
			validateAndTouch(formSchema, { [slot]: file }, slot);
			return;
		}

		setSlotFile(slot, file);

		if (fileInputRefs.current[slot]) {
			fileInputRefs.current[slot]!.value = '';
		}
	};

	const handleUpload = () => {
		whipRef.current?.play();
		startSlotUploads();
	};

	const slots: SlotKey[] = ['first', 'second', 'third'];

	return (
		<Dialog>
			<DialogTrigger asChild>
				<motion.button
					className="px-8 py-3.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg flex justify-center gap-2 mx-auto"
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					Upload Images <UploadCloud />
				</motion.button>
			</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				className="sm:max-w-[560px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl bg-white "
			>
				<div className=" w-full relative">
					<div
						className="bg-gray-100 -z-10 absolute inset-0 h-full w-[30%] transition-transform "
						style={{ width: `${progress}%` }}
					/>
					{/* Header */}
					<DialogHeader
						className={`px-6 py-4 border-b-gray-100  flex flex-row items-center justify-between ${!isMinimized && 'border-b'}`}
					>
						<DialogTitle className="text-lg font-medium text-gray-500 font-inter">
							{isPaused
								? `Paused - ${
										Object.values(files).filter(
											f => f && f.status !== 'completed'
										).length
									} files remaining`
								: isUploading
									? `Uploading ${
											Object.values(files).filter(
												f => f?.status === 'uploading'
											).length
										} files`
									: 'Upload Images'}
							{allFilesCompleted && (
								<CloudCheck className="size-6 text-green-500 inline-block stroke-2 ml-2" />
							)}

							{isMinimized && (isUploading || isPaused) && (
								<p className="text-gray-400 mt-2 text-xs font-manrope font-medium">
									{Math.round(progress)}%{' '}
									<span className="mx-.5 text-gray-300">•</span>{' '}
									{(() => {
										// Calculate total time left from all files
										const totalTimeLeft = Object.values(files)
											.filter(f => f && f.status !== 'completed')
											.reduce(
												(sum, f) => sum + (f?.timeLeft || 0),
												0
											);
										return totalTimeLeft;
									})()}{' '}
									seconds left
								</p>
							)}
						</DialogTitle>
						<AnimatePresence>
							{(isUploading || isPaused) && (
								<div className="flex items-center justify-end gap-3 ml-auto">
									<button
										onClick={handlePauseToggle}
										className="w-8 h-8 hover:bg-gray-200 bg-gray-100 flex items-center justify-center cursor-pointer transition-colors rounded-full"
									>
										{isPaused ? (
											<RotateCcw className="w-5 h-5 text-gray-500" />
										) : (
											<Pause className="w-5 h-5 text-gray-500" />
										)}
									</button>

									<button
										onClick={handleToggleMinimize}
										className="w-8 h-8 hover:bg-gray-200 bg-gray-100 flex items-center justify-center cursor-pointer transition-colors rounded-full"
									>
										{isMinimized ? (
											<Maximize2 className="w-5 h-5 text-gray-500" />
										) : (
											<Minimize2 className="w-5 h-5 text-gray-500" />
										)}
									</button>
								</div>
							)}
						</AnimatePresence>

						<DialogPrimitive.Close
							data-slot="dialog-close"
							className="flex items-center gap-2"
						>
							<button className="w-8 h-8 hover:bg-gray-200 bg-gray-100 flex items-center justify-center cursor-pointer transition-colors rounded-full">
								<X className="w-5 h-5 text-gray-500" />
							</button>
						</DialogPrimitive.Close>
					</DialogHeader>
					<AnimatePresence>
						{isMinimized && (isUploading || isPaused) && (
							<div className=" space-y-1 mb-4">
								<WhipProgress
									height={20}
									progress={progress}
									ref={whipRef}
								/>
							</div>
						)}
					</AnimatePresence>

					<div className="p-6 space-y-6">
						{/* Progress Section - Only show when NOT minimized */}
						<AnimatePresence>
							{!isMinimized &&
								(isUploading || isPaused || allFilesCompleted) && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className="space-y-4"
									>
										{slots.map(slot => {
											const file = files[slot];
											// Show if uploading, paused, OR completed
											if (!file || file.status === 'pending')
												return null;

											// Determine color based on status
											const barColor =
												file.status === 'completed'
													? 'bg-green-500'
													: file.status === 'paused'
														? 'bg-gray-400'
														: 'bg-blue-400';

											return (
												<div key={slot} className="space-y-2">
													<div className="flex justify-between text-sm">
														<span className="font-medium text-gray-700 truncate max-w-[200px] font-inter">
															{file.file.name}
														</span>
														<span className="text-gray-400">
															{file.status === 'completed' ? (
																'Completed'
															) : (
																<>
																	{Math.round(file.progress)}%
																	• {file.timeLeft}s left
																</>
															)}
														</span>
													</div>
													<div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
														<motion.div
															className={`h-full ${barColor}`}
															initial={{ width: 0 }}
															animate={{
																width: `${file.progress}%`,
															}}
														/>
													</div>
												</div>
											);
										})}
									</motion.div>
								)}
						</AnimatePresence>

						{/* Error Alert */}
						<AnimatePresence>
							{Object.values(errors).some(err => err) && (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm"
								>
									<AlertCircle className="w-4 h-4 flex-shrink-0" />
									<span>{Object.values(errors).find(err => err)}</span>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Grid of Upload Slots */}
						{!isUploading && !isPaused && !allFilesCompleted && (
							<div className="grid grid-cols-3 gap-4">
								{slots.map(slot => {
									const file = files[slot];
									const isEmpty = !file;

									return (
										<motion.div
											key={slot}
											layout
											className="relative group aspect-square rounded-xl overflow-hidden"
										>
											{/* Hidden file input */}
											<input
												ref={el => {
													fileInputRefs.current[slot] = el;
												}}
												type="file"
												accept="image/*"
												onChange={e => handleFileSelect(slot, e)}
												disabled={isUploading}
												className="hidden"
											/>

											{isEmpty ? (
												/* Empty Slot - Upload Trigger */
												<motion.button
													onClick={() => handleSlotClick(slot)}
													disabled={isUploading}
													className="w-full group hover:bg-gray-100 hover:border-gray-300  h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<Upload className="w-5 h-5 transition-colors text-gray-400" />
													<span className="text-xs font-medium transition-colors text-gray-400">
														Upload
													</span>
												</motion.button>
											) : (
												/* File Preview */
												<div className="relative w-full h-full bg-gray-100 border border-gray-200 rounded-xl overflow-hidden">
													<img
														src={file.preview}
														alt={file.file.name}
														className={`w-full h-full object-cover transition-opacity ${
															file.status === 'uploading'
																? 'opacity-40'
																: 'opacity-100'
														}`}
													/>

													{/* Remove Button */}
													{file.status !== 'uploading' && (
														<button
															onClick={() => deleteOne(slot)}
															className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 hover:bg-white text-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
														>
															<X className="w-3.5 h-3.5" />
														</button>
													)}

													{/* Size Indicator */}
													<div className="absolute bottom-2 left-2">
														<Kbd className="bg-white/90 border-none shadow-sm text-[10px] px-1.5 py-0.5">
															{formatFileSize(file.file.size)}
														</Kbd>
													</div>
												</div>
											)}
										</motion.div>
									);
								})}
							</div>
						)}

						{/* Start Upload Button - Only shows when all 3 slots are filled */}
						{showUploadButton && (
							<motion.button
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								onClick={handleUpload}
								className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
							>
								Start Uploading
							</motion.button>
						)}

						{!isUploading && !isPaused && !allFilesCompleted && (
							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="text-xs text-gray-400 text-center leading-relaxed"
							>
								Maximum file size is 20MB per image. Accepted formats:
								JPG, PNG, WEBP. Images are stored in order and will
								maintain their positions.
							</motion.p>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default FileUploader;
