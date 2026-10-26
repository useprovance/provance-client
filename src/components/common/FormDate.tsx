import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

// DatePickerWithPresets Props Interface
interface DatePickerWithPresetsProps {
	date: string; // ISO string format
	setDate: (newDate: Date) => void;
	disabled?: boolean;
	className?: string;
	hasError?: boolean; // Changed from error to hasError for clarity
	minDate?: Date;
	maxDate?: Date;
	trigger: React.ReactNode;
}

// DatePickerWithPresets Component
export function DatePickerWithPresets({
	date,
	setDate,
	disabled = false,
	minDate,
	maxDate,
	trigger,
}: DatePickerWithPresetsProps) {
	// Parse the ISO string to a Date object for internal use
	const parsedDate = date ? parseISO(date) : undefined;

	// Function to handle date selection from calendar
	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

	// Create hidden dates matcher for the new Calendar API
	const getHiddenDates = () => {
		const hiddenMatchers = [];

		if (minDate) {
			hiddenMatchers.push({ before: minDate });
		}

		if (maxDate) {
			hiddenMatchers.push({ after: maxDate });
		}

		return hiddenMatchers.length > 0 ? hiddenMatchers : undefined;
	};

	return (
		<Popover>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent
				align="start"
				className="flex w-auto flex-col space-y-2 p-2"
			>
				<div className="rounded-md border">
					<Calendar
						mode="single"
						selected={parsedDate}
						onSelect={handleDateSelect}
						captionLayout="dropdown"
						disabled={disabled}
						hidden={getHiddenDates()}
						className="data-[selected-single=true]:bg-blue-300"
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}

interface FormDateProps {
	label: string;
	value: string; // ISO string format
	onChange: (value: string) => void;
	id?: string;
	required?: boolean;
	placeholder?: string;
	disabled?: boolean;
	error?: string;
	touched?: boolean;
	className?: string;
	minDate?: Date;
	maxDate?: Date;
}

const FormDate: React.FC<FormDateProps> = ({
	label,
	value,
	onChange,
	id,
	required = false,
	placeholder = 'Select date',
	disabled = false,
	error = '',
	touched = false,
	className = '',
	minDate,
	maxDate,
}) => {
	const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
	const hasError = error && touched;

	// Handle date change from DatePicker (Date object) to string for parent component
	const handleDateChange = (newDate: Date) => {
		const isoString = newDate.toISOString();
		onChange(isoString);
	};

	const parsedDate = value ? parseISO(value) : undefined;

	return (
		<div className={`space-y-2 ${className}`}>
			<label
				htmlFor={inputId}
				className="block text-sm font-medium text-gray-700"
			>
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>

			<DatePickerWithPresets
				date={value}
				setDate={handleDateChange}
				disabled={disabled}
				hasError={!!hasError} // Convert to boolean
				minDate={minDate}
				maxDate={maxDate}
				trigger={
					<button
						type="button"
						disabled={disabled}
						className={cn(
							'w-full justify-start text-left flex items-center gap-4 px-4 py-3 h-14 rounded-md bg-white border transition-all duration-200',
							'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500',
							'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400',
							hasError
								? 'border-red-500 focus:border-red-500 focus:ring-red-500'
								: 'border-gray-300 focus:border-gray-200',
							!value && 'text-gray-500',
							className
						)}
						aria-label={placeholder}
					>
						<CalendarIcon className="h-5 w-5 text-gray-400" />
						<span className="text-gray-600 text-sm">
							{parsedDate ? format(parsedDate, 'PPP') : placeholder}
						</span>
					</button>
				}
			/>

			{hasError && (
				<p
					id={`${inputId}-error`}
					className="text-sm text-red-500"
					role="alert"
				>
					{error}
				</p>
			)}
		</div>
	);
};

export default FormDate;
