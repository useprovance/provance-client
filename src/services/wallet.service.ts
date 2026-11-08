import { BaseApiService } from './api.service';

export type WalletChain = 'evm' | 'base' | 'goat' | 'arc' | 'stellar';

export interface SavedWallet {
	id: string;
	address: string;
	chain: WalletChain;
	label: string | null;
	created_at: string;
}

class WalletService extends BaseApiService {
	async list(): Promise<SavedWallet[]> {
		try {
			const res = await this.api.get<{ wallets: SavedWallet[] }>('/wallets');
			return res.data.wallets;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async add(address: string, chain: WalletChain, label?: string): Promise<SavedWallet> {
		try {
			const res = await this.api.post<{ wallet: SavedWallet }>('/wallets', { address, chain, label });
			return res.data.wallet;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	async remove(id: string): Promise<void> {
		try {
			await this.api.delete(`/wallets/${id}`);
		} catch (error) {
			throw this.handleError(error);
		}
	}
}

export const walletService = new WalletService();
