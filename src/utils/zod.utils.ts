import { z } from 'zod';

export const extractZodErrors = (error: z.ZodError): Record<string, string> => {
	const fieldErrors: Record<string, string> = {};

	error.issues.forEach(issue => {
		const fieldName = issue.path.join('.');
		fieldErrors[fieldName] = issue.message;
	});

	return fieldErrors;
};
