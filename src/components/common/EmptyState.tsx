import { cn } from '@/lib/utils';

const EmptyState: React.FC<{
	image: string;
	title: string;
	description: string;
	className?: string;
}> = props => {
	return (
		<div
			className={cn(
				'flex flex-col items-center py-14 bg-white border rounded-xl px-3.5',
				props.className
			)}
		>
			<img src={props.image} className="size-[12rem]" alt="" />
			<h1 className="font-semibold text-md md:text-xl font-jakarta mt-3 text-gray-700">
				{props.title}
			</h1>
			<p className="font-jakarta text-gray-600 mt-1.5 text-center text-sm">
				{props.description}
			</p>
		</div>
	);
};

export default EmptyState;
