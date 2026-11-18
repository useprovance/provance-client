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
		chunkSizeWarningLimit: 1500,
		rollupOptions: {
			output: {
				manualChunks(id: string) {
					if (!id.includes('/node_modules/')) return undefined;
					if (id.includes('/viem/') || id.includes('/ox/') || id.includes('/abitype/')) return 'viem';
					if (id.includes('/wagmi/') || id.includes('/@wagmi/')) return 'wagmi';
					if (id.includes('/@walletconnect/') || id.includes('/@reown/')) return 'walletconnect';
					if (id.includes('/@coinbase/')) return 'coinbase';
					if (id.includes('/@stellar/') || id.includes('/@freighter/')) return 'stellar';
					if (id.includes('/@privy-io/')) return 'privy';
					if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) return 'react';
					return undefined;
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
