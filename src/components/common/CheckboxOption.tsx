import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxOptionProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
	disabled?: boolean;
	className?: string;
}

const CheckboxOption: React.FC<CheckboxOptionProps> = ({
	checked,
	onChange,
	label,
	disabled = false,
	className = '',
}) => {
	const handleToggle = () => {
		if (!disabled) {
			onChange(!checked);
		}
	};

	return (
		<div className={cn('flex gap-3 mt-6', className)}>
			<button
				type="button"
				onClick={handleToggle}
				disabled={disabled}
				className={cn(
					'w-6 h-6 rounded-sm flex items-center justify-center transition-colors duration-200',
					checked ? 'bg-blue-500' : 'bg-gray-200 border border-gray-300',
					disabled
						? 'opacity-50 cursor-not-allowed'
						: 'cursor-pointer hover:opacity-80'
				)}
			>
				{checked && <Check className="w-4 h-4 text-white stroke-[3]" />}
			</button>

			<p
				className={cn(
					'text-zinc-500 font-jakarta cursor-pointer select-none w-[90%]',
					disabled && 'opacity-50'
				)}
				onClick={handleToggle}
			>
				{label}
			</p>
		</div>
	);
};

export default CheckboxOption;
