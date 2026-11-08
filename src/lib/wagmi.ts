import { createConfig, http } from 'wagmi';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { defineChain } from 'viem';
import { base, mainnet } from 'viem/chains';

export const goatNetwork = defineChain({
	id: 2345,
	name: 'GOAT Network',
	nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 },
	rpcUrls: { default: { http: ['https://rpc.goat.network'] } },
	blockExplorers: { default: { name: 'GOAT Explorer', url: 'https://explorer.goat.network' } },
});

export const arcNetwork = defineChain({
	id: 5042,
	name: 'Arc',
	nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
	rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
	blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } },
});

export const CHAIN_ID_TO_WALLET_CHAIN: Record<number, string> = {
	1: 'evm',
	8453: 'base',
	2345: 'goat',
	5042: 'arc',
};

export const wagmiConfig = createConfig({
	chains: [goatNetwork, arcNetwork, base, mainnet],
	connectors: [
		injected(),
		metaMask(),
		coinbaseWallet({ appName: 'Provance' }),
	],
	transports: {
		[goatNetwork.id]: http(),
		[arcNetwork.id]: http(),
		[base.id]: http(),
		[mainnet.id]: http(),
	},
});
