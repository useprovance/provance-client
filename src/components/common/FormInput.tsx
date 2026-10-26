import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';

interface FormInputProps {
	label: string;
	value: string | number;
	onChange?: (value: string) => void;
	placeholder?: string;
	type?: 'text' | 'email' | 'tel' | 'password' | 'textarea' | 'number';
	required?: boolean;
	error?: string | number;
	touched?: boolean;
	disabled?: boolean;
	className?: string;
	rows?: number;
	maxLength?: number;
	autoComplete?: string;
	id?: string;
	// Prefix and suffix elements
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
	// Optional wrapper className for the input container
	wrapperClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
	label,
	value,
	onChange,
	placeholder = '',
	type = 'text',
	required = false,
	error = '',
	touched = false,
	disabled = false,
	className = '',
	rows = 3,
	maxLength,
	autoComplete,
	id,
	prefix,
	suffix,
	wrapperClassName = '',
}) => {
	// Local display state is used only for number inputs so we can
	// show formatted (comma separated) values while keeping the
	// raw numeric string passed to onChange.
	const [displayValue, setDisplayValue] = useState<string>(() => {
		if (type === 'number') {
			return formatNumberForDisplay(value ?? '');
		}
		return String(value ?? '');
	});

	useEffect(() => {
		// Keep local displayValue in sync when parent changes `value`.
		if (type === 'number') {
			const formatted = formatNumberForDisplay(value ?? '');
			if (formatted !== displayValue) setDisplayValue(formatted);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, type]);

	function formatNumberForDisplay(val: string | number): string {
		if (val === null || val === undefined) return '';
		const str = String(val);
		if (str === '') return '';
		// Keep sign and decimal part
		const isNegative = str.startsWith('-');
		const normalized = isNegative ? str.slice(1) : str;
		const parts = normalized.split('.');
		const intPart = parts[0].replace(/[^0-9]/g, '') || '0';
		const fracPart = parts[1] ?? '';
		const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		return (
			(isNegative ? '-' : '') +
			(fracPart ? `${withCommas}.${fracPart}` : withCommas)
		);
	}

	function sanitizeNumberInput(raw: string): string {
		if (!raw) return '';
		// Remove commas and any non-digit/decimal/minus characters
		let s = raw.replace(/,/g, '');
		// Remove all characters except digits, dot and minus
		s = s.replace(/[^0-9.-]/g, '');
		// Keep only first minus (if at start)
		const hasMinus = s.indexOf('-') !== -1;
		s = s.replace(/-/g, '');
		if (hasMinus) s = '-' + s;
		// Keep only first dot
		const parts = s.split('.');
		if (parts.length <= 1) return s;
		const first = parts.shift();
		const rest = parts.join(''); // remove additional dots
		return `${first}.${rest}`;
	}
	const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
	const hasError = error && touched;

	const baseInputStyles = `
		w-full px-4 py-2 border-none rounded-md transition-colors duration-200 outline-none
		focus:ring-0 focus:ring-blue-500  h-14
		placeholder:text-gray-400 
		disabled:bg-gray-100 disabled:cursor-not-allowed bg-white  selection:bg-blue-500 selection:text-white 
		${
			hasError
				? 'border-red-500 focus:border-red-500 focus:ring-red-500'
				: 'border-gray-300 focus:border-blue-500'
		}
		${className}
	`;

	const containerStyles = `
		relative flex items-center w-full border ring-0  rounded-md transition-colors duration-200  
		${
			hasError
				? 'border-red-500  focus-within:ring-red-200/70 focus-within:ring-[3px]'
				: 'border-gray-300 focus-within:ring-gray-300/70 focus-within:ring-[3px]'
		}
		${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
		${wrapperClassName}
	`;

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		if (type === 'number') {
			const raw = String(e.target.value);
			const sanitized = sanitizeNumberInput(raw);
			// Update local display immediately so user sees commas while typing
			setDisplayValue(formatNumberForDisplay(sanitized));
			// Notify parent with raw (no commas) string
			onChange?.(sanitized);
			return;
		}

		onChange?.(e.target.value);
	};

	const renderInput = () => {
		const commonProps = {
			id: inputId,
			// For number inputs show formatted displayValue, otherwise show raw value
			value: type === 'number' ? displayValue : value ?? '',
			onChange: handleChange,
			placeholder,
			disabled,
			maxLength,
			autoComplete,
			className: cn(
				'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-green-400/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',

				'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive placeholder:text-gray-200',
				baseInputStyles
			),
		};

		if (type === 'textarea') {
			return (
				<Textarea
					{...commonProps}
					rows={rows}
					style={{ resize: 'none', height: '140px' }} // 56px is h-14 (tailwind), adjust as needed
				/>
			);
		}

		// When showing formatted numbers (with commas) we must render
		// the input as text, otherwise the browser will reject values
		// like "5,000" for type="number". Use inputMode to hint
		// numeric keyboards on mobile.
		const inputType = type === 'number' ? 'text' : type;
		const inputMode = type === 'number' ? 'decimal' : undefined;
		return <input {...commonProps} type={inputType} inputMode={inputMode} />;
	};

	const renderInputWithElements = () => {
		// Always use container approach now for consistency
		return (
			<div className={containerStyles}>
				{prefix}
				{renderInput()}
				{suffix}
			</div>
		);
	};

	return (
		<div className="space-y-2">
			<label
				htmlFor={inputId}
				className="block text-sm font-medium text-gray-600"
			>
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>

			{renderInputWithElements()}

			{hasError && (
				<p
					id={`${inputId}-error`}
					className="text-sm text-red-600"
					role="alert"
				>
					{error}
				</p>
			)}
		</div>
	);
};

export default FormInput;
