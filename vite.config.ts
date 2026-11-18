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
					if (id.includes('/@solana/') || id.includes('/@solana-program/') || id.includes('/tweetnacl/') || id.includes('/bs58/')) return 'solana';
					if (id.includes('/@noble/') || id.includes('/@scure/') || id.includes('/@stablelib/')) return 'crypto';
					if (id.includes('/@simplewebauthn/') || id.includes('/@hcaptcha/') || id.includes('/@headlessui/') || id.includes('/@base-ui/')) return 'privy-ui';
					if (id.includes('/framer-motion/') || id.includes('/motion-dom/') || id.includes('/motion-utils/')) return 'motion';
					if (id.includes('/gsap/')) return 'gsap';
					if (id.includes('/react-markdown/') || id.includes('/remark-') || id.includes('/rehype-') || id.includes('/unified/') || id.includes('/micromark/') || id.includes('/mdast-') || id.includes('/hast-') || id.includes('/syntax-highlighter/') || id.includes('/refractor/') || id.includes('/prismjs/')) return 'markdown';
					if (id.includes('/@radix-ui/') || id.includes('/radix-ui/') || id.includes('/cmdk/') || id.includes('/react-day-picker/')) return 'ui';
					if (id.includes('/@tanstack/')) return 'query';
					if (id.includes('/axios/')) return 'axios';
					if (id.includes('/date-fns/') || id.includes('/@date-fns/')) return 'date';
					if (id.includes('/viem/') || id.includes('/ox/') || id.includes('/abitype/')) return 'viem';
					if (id.includes('/wagmi/') || id.includes('/@wagmi/')) return 'wagmi';
					if (id.includes('/@walletconnect/') || id.includes('/@reown/')) return 'walletconnect';
					if (id.includes('/@coinbase/')) return 'coinbase';
					if (id.includes('/@stellar/') || id.includes('/@freighter/')) return 'stellar';
					if (id.includes('/@privy-io/react-auth/') || id.includes('/.pnpm/@privy-io+react-auth@')) return 'privy-react';
					if (id.includes('/@privy-io/')) return 'privy-core';
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
