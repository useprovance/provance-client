import React, { Fragment, useEffect, useState } from 'react';
import { Trash2, RefreshCw, CloudUpload, X, Check } from 'lucide-react';
import { Alert } from '../common/Alert';

type FileUploadStatus =
	| 'initial'
	| 'uploading'
	| 'success'
	| 'error'
	| 'too-large'
	| 'failed';

// Configuration props for the component
interface FileUploadProps {
	id: string;
	label: string;
	description?: string;
	acceptedFormats: string;
	required?: boolean;
	maxSize?: number; // in MB
	onChange?: (file: File | null) => void;
	initialStatus?: FileUploadStatus;
	value?: File | null;
}

// Internal state for uploaded file
interface UploadedFile {
	id: string;
	name: string;
	size: number;
	progress: number;
	status: FileUploadStatus;
	errorMessage?: string;
	uploadDate?: string;
}

const FormFileUpload: React.FC<FileUploadProps> = ({
	id,
	label,
	description,
	acceptedFormats,
	required = false,
	maxSize = 5,
	onChange,
	initialStatus = 'initial',
	value,
}) => {
	const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>();

	useEffect(() => {
		if (value) {
			setUploadedFile({
				id,
				name: value.name,
				size: value.size,
				progress: 100,
				status: 'success',
				uploadDate: new Date().toLocaleDateString('en-US', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
				}),
			});
		}
	}, [value]);

	const simulateUpload = (file: File) => {
		// Check file size
		if (file.size > maxSize * 1024 * 1024) {
			setUploadedFile({
				id,
				name: file.name,
				size: file.size,
				progress: 0,
				status: 'too-large',
				errorMessage: 'The file is too large to upload.',
			});
			onChange?.(null);
			return;
		}

		// Start upload simulation
		setUploadedFile({
			id,
			name: file.name,
			size: file.size,
			progress: 0,
			status: 'uploading',
		});

		// Simulate progress
		let progress = 0;
		const interval = setInterval(() => {
			progress += Math.random() * 30;

			if (progress >= 100) {
				clearInterval(interval);

				// Randomly simulate success or failure (90% success rate)
				const isSuccess = Math.random() > 0.1;

				const finalFile: UploadedFile = {
					id,
					name: file.name,
					size: file.size,
					progress: 100,
					status: isSuccess ? 'success' : 'failed',
					errorMessage: !isSuccess ? 'Error message' : undefined,
					uploadDate: isSuccess
						? new Date().toLocaleDateString('en-US', {
								day: '2-digit',
								month: 'short',
								year: 'numeric',
							})
						: undefined,
				};

				setUploadedFile(finalFile);
				onChange?.(isSuccess ? file : null);
			} else {
				setUploadedFile(prev =>
					prev
						? {
								...prev,
								progress: Math.min(progress, 100),
							}
						: null
				);
			}
		}, 200);
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			simulateUpload(file);
		}
	};

	const handleRetry = () => {
		if (uploadedFile) {
			// Create a mock file for retry
			const mockFile = new File([''], uploadedFile.name, {
				type: 'application/pdf',
			});
			simulateUpload(mockFile);
		}
	};

	const handleRemove = () => {
		setUploadedFile(null);
		onChange?.(null);
	};

	const renderUploadState = () => {
		const status = uploadedFile?.status || initialStatus;

		switch (status) {
			case 'initial':
				return (
					<div className="relative bg-white hover:bg-zinc-50">
						<input
							type="file"
							accept={acceptedFormats}
							onChange={handleFileSelect}
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
							id={id}
						/>
						<div className="border-2 border-dashed border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:bg-blue-50 transition-colors">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="p-3 bg-gray-100 rounded-full flex items-center justify-center border">
										<CloudUpload className="w-6 h-6 text-gray-500" />
									</div>
									<div>
										<p className="text-md font-medium text-gray-600 font-manrope mb-1">
											Tap to Upload
										</p>
										<p className="text-xs text-gray-400">
											{acceptedFormats
												.replace(/\./g, ' ')
												.toUpperCase()}
											<span className="mx-1">|</span>
											{maxSize}MB max
										</p>
									</div>
								</div>
								<button className="px-8 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors font-inter">
									Upload
								</button>
							</div>
						</div>
					</div>
				);

			case 'uploading':
				return (
					<div className="border-2 border-dashed border-gray-200 rounded-lg p-5  transition-colors bg-white">
						<div className="flex items-center justify-between space-x-3">
							<div className="  rounded-full flex items-center justify-center ">
								<img
									className="w-10 h-10"
									src="/icons/pdf.svg"
									alt=""
								/>
							</div>
							<div className=" flex-1">
								<p className="text-md font-medium font-jakarta text-gray-600  ">
									Uploading Document
								</p>
								<div className="w-full bg-gray-200 rounded-full h-[.45rem] mt-[.4rem] mb-[.4rem]">
									<div
										className="bg-green-500 h-[.4rem] rounded-full transition-all duration-300"
										style={{
											width: `${uploadedFile?.progress || 0}%`,
										}}
									></div>
								</div>
								<p className="text-xs text-gray-400 font-inter">
									{uploadedFile?.name || 'File Title.PDF'} |{' '}
									<span className="font-bold">
										{Math.round(uploadedFile?.progress || 0)}%
										Completed
									</span>
								</p>
							</div>
							<button className="p-2 bg-zinc-100 text-zinc-500 text-sm font-medium rounded-full  transition-colors font-inter flex items-center justify-center border hover:bg-zinc-200 hover:text-zinc-500">
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>
				);

			case 'success':
				return (
					<Fragment>
						<div className="border-2 border-dashed border-gray-200 rounded-lg p-5  transition-colors bg-white ">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="p-3 bg-green-100 rounded-full flex items-center justify-center ">
										<div className="p-1 bg-green-500 rounded-full flex items-center justify-center">
											<Check className="w-3 h-3 text-white stroke-3   " />
										</div>
									</div>
									<div>
										<p className="text-md font-medium text-gray-600 font-manrope mb-1">
											Upload Successful
										</p>
										<p className="text-xs text-gray-400">
											{uploadedFile?.name || 'File Title.pdf'} |{' '}
											{uploadedFile?.size
												? (
														uploadedFile.size /
														(1024 * 1024)
													).toFixed(1) + ' MB'
												: '1.1 KB'}{' '}
											• {uploadedFile?.uploadDate}
										</p>
									</div>
								</div>
								<button
									className="p-2 bg-zinc-100 text-zinc-400 text-sm font-medium rounded-sm hover:bg-zinc-200 hover:text-zinc-500 transition-colors font-inter flex items-center justify-center border cursor-pointer"
									onClick={handleRemove}
								>
									<Trash2 className="w-5 h-5" />
								</button>
							</div>
						</div>
					</Fragment>
				);

			case 'too-large':
				return (
					<Fragment>
						<div
							className="border-2 border-dashed border-gray-200 rounded-lg p-5  transition-colors bg-white hover:bg-gray-50 cursor-pointer"
							onClick={handleRemove}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="p-3 bg-yellow-100 rounded-full flex items-center justify-center ">
										<div className="p-1 bg-yellow-400 rounded-full flex items-center justify-center">
											<Alert className="w-3 h-3 text-white stroke-3  " />
										</div>
									</div>
									<div>
										<p className="text-md font-medium text-gray-600 font-manrope mb-1">
											{uploadedFile?.name || 'File Title.pdf'}
										</p>
										<p className="text-xs text-red-500">
											{uploadedFile?.errorMessage ||
												'The file is too large to upload.'}
										</p>
									</div>
								</div>
								<button className="p-2 bg-zinc-100 text-zinc-400 text-sm font-medium rounded-sm hover:bg-zinc-200 hover:text-zinc-500 transition-colors font-inter flex items-center justify-center border cursor-pointer ">
									<CloudUpload className="w-5 h-5" />
								</button>
							</div>
						</div>
					</Fragment>
				);

			case 'failed':
			case 'error':
				return (
					<Fragment>
						<div className="border-2 border-dashed border-gray-200 rounded-lg p-5  transition-colors bg-white hover:bg-gray-50 cursor-pointer">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="p-3 bg-red-100 rounded-full flex items-center justify-center ">
										<div className="p-1 bg-red-500 rounded-full flex items-center justify-center">
											<Alert className="w-3 h-3 text-white stroke-3  " />
										</div>
									</div>
									<div>
										<p className="text-md font-medium text-gray-600 font-manrope mb-1">
											Failed to Upload
										</p>
										<p className="text-xs text-red-500">
											{uploadedFile?.errorMessage || 'Error message'}
										</p>
									</div>
								</div>
								<button
									className="p-2 bg-blue-100 text-blue-600 border-blue-400 text-sm font-medium rounded-sm hover:bg-zinc-200 hover:text-zinc-500 transition-colors font-inter flex items-center justify-center border cursor-pointer gap-1 ml-auto mr-3"
									onClick={handleRetry}
								>
									<RefreshCw className="w-4 h-4" />
									<span>Try Again</span>
								</button>
								<button className="p-2 bg-zinc-100 text-zinc-400 text-sm font-medium rounded-sm hover:bg-zinc-200 hover:text-zinc-500 transition-colors font-inter flex items-center justify-center border cursor-pointer ">
									<CloudUpload className="w-5 h-5" />
								</button>
							</div>
						</div>
					</Fragment>
				);

			default:
				return (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4">
						<p className="text-sm text-red-600">
							Unknown upload state: {status}
						</p>
					</div>
				);
		}
	};

	return (
		<div className="">
			<div className="mb-2">
				<span className="text-sm font-medium text-gray-700">
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</span>
				<p className="text-sm text-gray-400 mt-3 ">{description}</p>
			</div>

			{renderUploadState()}
		</div>
	);
};

export default FormFileUpload;
