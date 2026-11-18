import { getNetwork, signTransaction } from "@stellar/freighter-api";
import { BaseApiService } from "./api.service";

export type StellarSwapAsset = "XLM" | "USDC";

export interface StellarSwapQuote {
  network: "mainnet" | "testnet";
  networkPassphrase: string;
  provider: "soroswap" | "stellar-sdex";
  fromAsset: StellarSwapAsset;
  toAsset: StellarSwapAsset;
  amountIn: string;
  amountOut: string;
  minimumReceived: string;
  priceImpactPct: string | null;
  slippageBps: number;
  unsignedXdr: string;
  expiresInSeconds: number;
}

class StellarSwapService extends BaseApiService {
  async quote(input: {
    address: string;
    fromAsset: StellarSwapAsset;
    toAsset: StellarSwapAsset;
    amount: string;
    slippageBps: number;
  }): Promise<StellarSwapQuote> {
    try {
      const response = await this.api.post<StellarSwapQuote>("/wallets/stellar/swap/quote", input);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signAndSubmit(address: string, quote: StellarSwapQuote): Promise<string> {
    const walletNetwork = await getNetwork();
    if (walletNetwork.error) throw new Error(walletNetwork.error.message);
    if (walletNetwork.networkPassphrase !== quote.networkPassphrase) {
      throw new Error(`Freighter is connected to ${walletNetwork.network}; switch it to Stellar ${quote.network} before swapping`);
    }

    const signed = await signTransaction(quote.unsignedXdr, {
      address,
      networkPassphrase: quote.networkPassphrase,
    });
    if (signed.error) throw new Error(signed.error.message);
    if (signed.signerAddress !== address) throw new Error("Freighter signed with a different account. Select the linked wallet and retry.");

    try {
      const response = await this.api.post<{ transactionHash: string; success: boolean }>("/wallets/stellar/swap/submit", {
        address,
        signedXdr: signed.signedTxXdr,
        provider: quote.provider,
        fromAsset: quote.fromAsset,
        toAsset: quote.toAsset,
        amountIn: quote.amountIn,
        amountOut: quote.amountOut,
      });
      if (!response.data.success) throw new Error(`Swap failed on the network. Transaction: ${response.data.transactionHash}`);
      return response.data.transactionHash;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const stellarSwapService = new StellarSwapService();
