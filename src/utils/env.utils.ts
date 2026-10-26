import { z } from 'zod';

const envSchema = z.object({
	VITE_API_URL: z.string().default('http://localhost:4000/api/v1'),
});

export const env = envSchema.parse({
	VITE_API_URL: import.meta.env.VITE_API_URL,
});
