import { motion } from 'framer-motion';
import { X, Minimize2, MoreVertical } from 'lucide-react';

interface FileProgress {
	name: string;
	progress: number;
	timeLeft: number;
}

interface ExpandedUploadViewProps {
	files: FileProgress[];
	onMinimize: () => void;
	onCancel: () => void;
}

function ExpandedUploadView({
	files,
	onMinimize,
	onCancel,
}: ExpandedUploadViewProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
		>
			<div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-[600px]">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
					<h3 className="text-lg font-medium text-gray-900">
						Uploading {files.length} files
					</h3>
					<div className="flex items-center gap-2">
						{/* Minimize */}
						<button
							onClick={onMinimize}
							className="w-8 h-8 hover:bg-gray-100 bg-gray-50 flex items-center justify-center rounded-full transition-colors"
						>
							<Minimize2 className="w-4 h-4 text-gray-600" />
						</button>

						{/* More options */}
						<button className="w-8 h-8 hover:bg-gray-100 bg-gray-50 flex items-center justify-center rounded-full transition-colors">
							<MoreVertical className="w-4 h-4 text-gray-600" />
						</button>

						{/* Cancel */}
						<button
							onClick={onCancel}
							className="w-8 h-8 hover:bg-gray-100 bg-gray-50 flex items-center justify-center rounded-full transition-colors"
						>
							<X className="w-4 h-4 text-gray-600" />
						</button>
					</div>
				</div>

				{/* File list */}
				<div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
					{files.map((file, index) => (
						<div key={index} className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium text-gray-700 truncate max-w-[300px]">
									{file.name}
								</span>
								<span className="text-gray-400">
									{Math.round(file.progress)}% • {file.timeLeft}{' '}
									seconds left
								</span>
							</div>
							<div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
								<motion.div
									className="h-full bg-blue-500"
									initial={{ width: 0 }}
									animate={{ width: `${file.progress}%` }}
									transition={{ duration: 0.3 }}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</motion.div>
	);
}

export default ExpandedUploadView;
