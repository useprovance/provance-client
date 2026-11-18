import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { goatNetwork } from './chains';

export { goatNetwork };

export const wagmiConfig = createConfig({
	chains: [goatNetwork],
	connectors: [injected()],
	transports: {
		[goatNetwork.id]: http(),
	},
});
