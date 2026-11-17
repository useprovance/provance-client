import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id: string) {
					if (!id.includes('node_modules')) return undefined;
					if (/viem|wagmi|ethers|@privy|@stellar|freighter/i.test(id)) return 'wallet';
					if (/react|scheduler/i.test(id)) return 'react';
					if (/lucide|@radix-ui/i.test(id)) return 'ui';
					if (/recharts|lightweight-charts|chart/i.test(id)) return 'charts';
					return 'vendor';
				},
			},
		},
	},
	server: {
		proxy: {
			'/api': {
				target: 'https://agt-rho.vercel.app/',
				changeOrigin: true,
				secure: false,
			},
		},
	},
});
