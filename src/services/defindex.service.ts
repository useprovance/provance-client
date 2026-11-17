import { getNetwork, signTransaction } from "@stellar/freighter-api";
import { BaseApiService } from "./api.service";

const PASSPHRASES: Record<string, "mainnet" | "testnet"> = {
  "Public Global Stellar Network ; September 2015": "mainnet",
  "Test SDF Network ; September 2015": "testnet",
};
export interface DefindexVault {
  address: string;
  apy?: number;
  totalManagedFunds?: Array<{ asset: string; total_amount: string }>;
}
export interface DefindexVaultInfo {
  name?: string;
  symbol?: string;
  apy?: number;
  assets?: Array<{ address: string; name?: string; symbol?: string }>;
}
export interface DefindexPosition {
  dfTokens: number | string;
  underlyingBalance: Array<number | string>;
}
export interface DefindexActionQuote {
  network: "mainnet" | "testnet";
  address: string;
  vaultAddress: string;
  action: "deposit" | "withdraw";
  amounts: string[];
  invest: boolean;
  slippageBps: number;
  unsignedXdr: string;
  quoteProof: string;
  expiresInSeconds: number;
}

class DefindexService extends BaseApiService {
  private async activeNetwork(): Promise<"mainnet" | "testnet"> {
    const result = await getNetwork();
    if (result.error) throw new Error(result.error.message);
    const network = PASSPHRASES[result.networkPassphrase];
    if (!network) throw new Error(`Unsupported Stellar network: ${result.network}`);
    return network;
  }

  async getVaults(): Promise<{ network: "mainnet" | "testnet"; vaults: DefindexVault[] }> {
    const network = await this.activeNetwork();
    try {
      const response = await this.api.get<{ network: "mainnet" | "testnet"; vaults?: DefindexVault[] }>("/wallets/defindex/vaults", { params: { network } });
      return { network: response.data.network, vaults: response.data.vaults ?? [] };
    } catch (error) { throw this.handleError(error); }
  }

  async getPosition(walletAddress: string, vaultAddress: string): Promise<{ network: "mainnet" | "testnet"; vaultAddress: string; vault: DefindexVaultInfo; position: DefindexPosition }> {
    const network = await this.activeNetwork();
    try {
      const response = await this.api.get<{ network: "mainnet" | "testnet"; vaultAddress: string; vault: DefindexVaultInfo; position: DefindexPosition }>(`/wallets/defindex/vaults/${encodeURIComponent(vaultAddress)}/position`, { params: { network, walletAddress } });
      return response.data;
    } catch (error) { throw this.handleError(error); }
  }

  async prepareAction(input: { address: string; vaultAddress: string; action: "deposit" | "withdraw"; amounts: string[]; invest: boolean; slippageBps: number }): Promise<DefindexActionQuote> {
    const network = await this.activeNetwork();
    try {
      const response = await this.api.post<DefindexActionQuote>(`/wallets/defindex/vaults/${encodeURIComponent(input.vaultAddress)}/prepare`, { ...input, network });
      return response.data;
    } catch (error) { throw this.handleError(error); }
  }

  async signAndSubmit(quote: DefindexActionQuote): Promise<{ transactionHash: string; historySaved: boolean; success: boolean; status?: string }> {
    const result = await getNetwork();
    if (result.error) throw new Error(result.error.message);
    const expectedPassphrase = quote.network === "testnet" ? "Test SDF Network ; September 2015" : "Public Global Stellar Network ; September 2015";
    if (result.networkPassphrase !== expectedPassphrase) throw new Error(`Freighter is connected to ${result.network}; switch it to Stellar ${quote.network} before continuing`);
    const signed = await signTransaction(quote.unsignedXdr, { address: quote.address, networkPassphrase: expectedPassphrase });
    if (signed.error) throw new Error(signed.error.message);
    if (signed.signerAddress !== quote.address) throw new Error("Freighter signed with a different account. Select the linked wallet and retry.");
    try {
      const response = await this.api.post<{ transactionHash: string; historySaved: boolean; success: boolean; status?: string }>(`/wallets/defindex/vaults/${encodeURIComponent(quote.vaultAddress)}/submit`, {
        address: quote.address, network: quote.network, action: quote.action, signedXdr: signed.signedTxXdr, quoteProof: quote.quoteProof,
      });
      return response.data;
    } catch (error) { throw this.handleError(error); }
  }
}

export const defindexService = new DefindexService();
