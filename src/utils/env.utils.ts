import { z } from 'zod';

const envSchema = z.object({
	VITE_API_URL: z.string().default('http://localhost:4000/api/v1'),
	VITE_PRIVY_APP_ID: z.string().default(''),
});

export const env = envSchema.parse({
	VITE_API_URL: import.meta.env.VITE_API_URL,
	VITE_PRIVY_APP_ID: import.meta.env.VITE_PRIVY_APP_ID,
});
