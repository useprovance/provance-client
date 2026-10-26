import { useState } from 'react';
import { z } from 'zod';
import { extractZodErrors } from '@/utils/zod.utils';

const validateWithZod = <T>(
	schema: z.ZodSchema<T>,
	data: unknown
):
	| { success: true; data: T }
	| { success: false; errors: Record<string, string> } => {
	const result = schema.safeParse(data);

	if (result.success) {
		return { success: true, data: result.data };
	}

	return { success: false, errors: extractZodErrors(result.error) };
};

export const useZodValidation = <T extends Record<string, unknown>>(
	initialFormData: T
) => {
	const [errors, setErrors] = useState<Record<keyof T, string>>(
		{} as Record<keyof T, string>
	);
	const [touched, setTouched] = useState<Record<keyof T, boolean>>(
		Object.keys(initialFormData).reduce((acc, key) => {
			acc[key as keyof T] = false;
			return acc;
		}, {} as Record<keyof T, boolean>)
	);

	const validate = (schema: z.ZodSchema<T>, data: unknown): T | null => {
		const result = validateWithZod(schema, data);

		if (result.success) {
			setErrors({} as Record<keyof T, string>);
			return result.data;
		} else {
			// Convert string keys back to T keys
			const typedErrors = Object.keys(initialFormData).reduce((acc, key) => {
				const fieldKey = key as keyof T;
				acc[fieldKey] = result.errors[key] || '';
				return acc;
			}, {} as Record<keyof T, string>);

			setErrors(typedErrors);
			return null;
		}
	};

	const clearErrors = () => setErrors({} as Record<keyof T, string>);

	const markAllTouched = () => {
		setTouched(
			Object.keys(initialFormData).reduce((acc, key) => {
				acc[key as keyof T] = true;
				return acc;
			}, {} as Record<keyof T, boolean>)
		);
	};

	// NEW: Validate and mark specific field as touched
	const validateAndTouch = (
		schema: z.ZodSchema<T>,
		data: unknown,
		touchedField: keyof T
	): T | null => {
		// Mark the specific field as touched
		setTouched(prev => ({
			...prev,
			[touchedField]: true,
		}));

		// Then validate
		return validate(schema, data);
	};

	const getFieldError = (fieldName: keyof T) => errors[fieldName] || '';

	return {
		validate,
		errors,
		touched,
		clearErrors,
		markAllTouched,
		getFieldError,
		validateAndTouch,
	};
};
