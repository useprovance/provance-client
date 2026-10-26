import FileUploader from '@/components/vessel/FileUploader';
import type { FileSlots, SlotKey } from '@/hooks/useVessleFileManager';
import { motion, type Variants } from 'framer-motion';
import { Package } from 'lucide-react';
import { openEmail } from '@/utils/email.utils';
import { Fragment, useState } from 'react';

function VesselHomePage() {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const [images, setImages] = useState([
		{
			id: 'first',
			url: '/images/vessel-1.jpeg',
			alt: 'Upload preview 1',
		},
		{
			id: 'second',
			url: '/images/vessel-2.jpeg',
			alt: 'Upload preview 2',
		},
		{
			id: 'third',
			url: '/images/vessel-3.jpeg',
			alt: 'Upload preview 3',
		},
	]);

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.15,
				delayChildren: 0.2,
			},
		},
	};

	const imageVariants: Variants = {
		hidden: {
			opacity: 0,
			y: 60,
			rotate: -5,
		},
		visible: {
			opacity: 1,
			y: 0,
			rotate: 0,
			transition: {
				duration: 0.6,
				ease: [0.22, 1, 0.36, 1],
			},
		},
	};

	const handleModalClose = (upLoadedfiles: FileSlots) => {
		const newImages: typeof images = [];

		// Define order to ensure correct positioning: first, second, third
		const slotOrder: SlotKey[] = ['first', 'second', 'third'];

		slotOrder.forEach(slotKey => {
			const uploadedFile = upLoadedfiles[slotKey];

			if (uploadedFile) {
				newImages.push({
					id: slotKey,
					url: uploadedFile.preview,
					alt: uploadedFile.file.name,
				});
			}
		});

		setImages(newImages);
	};

	return (
		<Fragment>
			<section className=" relative bg-white min-h-screen">
				<div className="noise absolute inset-0 w-full h-full" />
				<div className=" flex items-center justify-center px-6  min-h-[90vh]">
					<div className="max-w-2xl w-full z-20 py-18 ">
						{/* Image Stack */}
						<motion.div
							className="relative h-80 mb-12 flex items-center justify-center"
							variants={containerVariants}
							initial="hidden"
							animate="visible"
						>
							{images.map((img, index) => {
								const rotations = [-12, 2, 10];
								const offsets = [
									{ x: -40, y: 10 },
									{ x: 0, y: -5 },
									{ x: 40, y: 8 },
								];

								console.log(img);

								return (
									<motion.div
										key={img.id}
										variants={imageVariants}
										className="absolute"
										style={{
											zIndex:
												hoveredIndex === index
													? 10
													: 3 - Math.abs(index - 1),
											x: offsets[index].x,
											y: offsets[index].y,
										}}
										onHoverStart={() => setHoveredIndex(index)}
										onHoverEnd={() => setHoveredIndex(null)}
										whileHover={{
											y: offsets[index].y - 25,
											x: offsets[index].x,
											rotate: 0,
											scale: 1.08,
											transition: {
												duration: 0.3,
												ease: [0.22, 1, 0.36, 1],
											},
										}}
									>
										<motion.div
											initial={{ rotate: rotations[index] }}
											animate={{
												rotate:
													hoveredIndex === index
														? 0
														: rotations[index],
											}}
											className="bg-white rounded-2xl shadow-xl overflow-hidden border-[10px] border-white"
											style={{
												width: '260px',
												height: '260px',
											}}
										>
											<img
												src={img.url}
												alt={img.alt}
												className="w-full h-full object-cover"
											/>
										</motion.div>
									</motion.div>
								);
							})}
						</motion.div>

						{/* Text Content */}
						<motion.div
							className="text-center"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.8, duration: 0.6 }}
						>
							<motion.div
								className="mb-4 flex justify-center "
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.6 }}
							>
								<p className="text-xs font-medium flex items-center gap-1 tracking-wide text-gray-500 bg-gray-300 font-grotesque px-5 py-1.5 rounded-3xl">
									<Package className="w-3 h-3" />
									VESSEL-FRAG-2025
								</p>
							</motion.div>
							<h1 className="text-3xl font-semibold text-gray-800 mb-3 font-manrope">
								Compress images before upload
							</h1>

							<p className="text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed text-sm md:text-md ">
								Reduce your image file sizes by up to 70% without losing
								clarity. Upload 3 images at once and watch them compress
								in real-time.
							</p>

							<FileUploader onClose={handleModalClose} />
						</motion.div>
					</div>
				</div>

				<footer className="border-t border-gray-200">
					<div className="max-w-6xl mx-auto px-4 py-8 flex  items-start md:items-center justify-between gap-4 text-sm text-gray-600">
						<p>© {new Date().getFullYear()} Sebastian</p>

						<div className="flex gap-4">
							<a
								href="https://linkedin.com/in/sebastian-anioke"
								target="_blank"
								rel="noreferrer"
								className="hover:text-black"
							>
								LinkedIn
							</a>
							<button className="hover:text-black" onClick={openEmail}>
								Email
							</button>
						</div>
					</div>
				</footer>
			</section>
		</Fragment>
	);
}

export default VesselHomePage;
