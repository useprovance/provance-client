import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const goatNetwork = defineChain({
	id: 2345,
	name: 'GOAT Network',
	nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 },
	rpcUrls: {
		default: { http: ['https://rpc.goat.network'] },
	},
	blockExplorers: {
		default: { name: 'GOAT Explorer', url: 'https://explorer.goat.network' },
	},
});

export const wagmiConfig = createConfig({
	chains: [goatNetwork],
	connectors: [injected()],
	transports: {
		[goatNetwork.id]: http(),
	},
});
