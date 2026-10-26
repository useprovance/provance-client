import React, { useEffect, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';

// Option interface for select items
export interface SelectOption {
	value: string;
	label: string;
	description?: string;
	disabled?: boolean;
}

// FormSelector Props Interface
interface FormSelectorProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	id?: string;
	required?: boolean;
	placeholder?: string;
	disabled?: boolean;
	error?: string;
	touched?: boolean;
	className?: string;
	searchable?: boolean;
	searchThreshold?: number; // Number of options before search becomes available
	emptyMessage?: string;
	maxHeight?: string;
}

// Searchable Combobox Component (using shadcn Command)
const SearchableSelect: React.FC<{
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	placeholder?: string;
	disabled?: boolean;
	hasError?: boolean;
	id: string;
	searchable: boolean;
	emptyMessage?: string;
}> = ({
	value,
	onChange,
	options,
	placeholder,
	disabled,
	hasError,
	id,
	emptyMessage,
	searchable = true,
}) => {
	const [open, setOpen] = React.useState(false);
	const [selectedOption, setSelectedOption] = useState<SelectOption | null>(
		null
	);

	useEffect(() => {
		if (value) {
			const match = options.find(
				opt => opt.value === value || opt.label === value
			);
			setSelectedOption(match || null);
		} else {
			setSelectedOption(null);
		}
	}, [value, options]);

	const handleSelect = (index: string) => {
		onChange(index);
		const newOption = options[Number(index)];
		setSelectedOption(newOption);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild className="w-full">
				<button
					id={id}
					type="button"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className={cn(
						'flex h-14 w-full items-center justify-between rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
						hasError &&
							'border-red-500 focus:border-red-500 focus:ring-red-500',
						!value && 'text-muted-foreground'
					)}
					aria-describedby={hasError ? `${id}-error` : undefined}
					aria-invalid={hasError}
				>
					<span className="truncate">
						{selectedOption
							? selectedOption.label
							: placeholder || 'Select an option...'}
					</span>
					<ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[var(--radix-popover-trigger-width)] p-0 border border-blue-300"
				align="start"
			>
				<Command
					className={cn(
						'w-full command-input:border command-input:rounded-md command-input:w-full command-input:border-none'
					)}
				>
					<div
						className={cn(
							'hidden items-center border-b px-3',
							searchable && 'flex'
						)}
					>
						<CommandInput
							placeholder="Search options..."
							className="flex w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 "
						/>
					</div>
					<CommandList className="w-full">
						<CommandEmpty>
							{emptyMessage || 'No option found.'}
						</CommandEmpty>
						<CommandGroup className="px-0">
							{options.map((option, i) => {
								const isDisabled = option.disabled;
								// console.log(option);
								const isSelected =
									selectedOption?.value === option.value;

								return (
									<CommandItem
										key={i}
										value={option.label}
										id={option.value}
										disabled={option.disabled}
										onSelect={() =>
											!isDisabled && handleSelect(i.toString())
										}
										className={cn(
											'flex items-center justify-between py-4 border-b border-b-gray-100 rounded-none px-6 cursor-pointer',
											option.disabled &&
												'opacity-50 cursor-not-allowed',
											isSelected && 'bg-blue-100'
										)}
									>
										<div className="flex flex-col">
											<span
												className={cn(
													'text-gray-500',
													isSelected && 'text-blue-500'
												)}
											>
												{option.label}
											</span>
											{option.description && (
												<span className="text-xs italic text-gray-400 ">
													{option.description}
												</span>
											)}
										</div>
										<Check
											className={cn(
												'ml-auto h-4 w-4 stroke-blue-600',
												isSelected ? 'opacity-100' : 'opacity-0'
											)}
										/>
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

// Main FormSelector Component
const FormSelector: React.FC<FormSelectorProps> = ({
	label,
	value,
	onChange,
	options,
	id,
	required = false,
	placeholder,
	disabled = false,
	error = '',
	touched = false,
	className = '',
	searchable = false,
	searchThreshold = 5,
	emptyMessage,
}) => {
	const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
	const hasError = error && touched;

	// Automatically enable search if options exceed threshold
	const shouldUseSearch = searchable || options.length >= searchThreshold;

	return (
		<div className={`space-y-2 ${className}`}>
			<label
				htmlFor={inputId}
				className="block text-sm font-medium text-gray-700"
			>
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>

			<SearchableSelect
				id={inputId}
				value={value}
				onChange={onChange}
				options={options}
				placeholder={placeholder}
				disabled={disabled}
				hasError={!!hasError}
				emptyMessage={emptyMessage}
				searchable={shouldUseSearch}
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

export default FormSelector;
