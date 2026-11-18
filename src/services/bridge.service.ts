import { createPublicClient, createWalletClient, custom, http, type Chain, type Hex } from "viem";
import { BaseApiService } from "./api.service";
import { EVM_SWAP_NETWORKS, evmSwapService } from "./evm-swap.service";

export const NATIVE_EVM_TOKEN = "0x0000000000000000000000000000000000000000";

export interface BridgeQuote {
   provider: "lifi";
   routeId: string | null;
   tool: string | null;
   fromChainId: number;
   toChainId: number;
   fromToken: string;
   toToken: string;
   fromAmount: string;
   toAmount: string;
   toAmountMin: string;
   fromAmountUsd: string | null;
   toAmountUsd: string | null;
   executionDurationSeconds: number | null;
   transaction: { to: string; data: Hex; value: string; gasLimit: string | null; gasPrice: string | null };
   quoteProof: string;
   expiresInSeconds: number;
}

export interface BridgeStatus {
   status: "submitted" | "confirmed" | "failed";
   amount_in: string;
   amount_out: string | null;
   details: Record<string, unknown>;
   transaction_hash: string;
   created_at: string;
}

interface Eip1193Provider { request(args: { method: string; params?: unknown[] }): Promise<unknown> }
function getProvider(): Eip1193Provider {
   const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
   if (!provider) throw new Error("No EVM wallet found. Install MetaMask or another EIP-1193 wallet.");
   return provider;
}

function chainFor(chainId: number): Chain {
   const chain = EVM_SWAP_NETWORKS.find((item) => item.id === chainId);
   if (!chain) throw new Error("Unsupported EVM bridge network");
   return chain;
}

class BridgeService extends BaseApiService {
   async quote(input: {
      fromChainId: number;
      toChainId: number;
      fromToken: string;
      toToken: string;
      fromAddress: string;
      toAddress?: string;
      fromAmount: string;
      fromTokenDecimals: number;
      toTokenDecimals: number;
      slippage?: number;
   }): Promise<BridgeQuote> {
      try {
         const response = await this.api.post<BridgeQuote>("/wallets/bridge/quote", input);
         return response.data;
      } catch (error) { throw this.handleError(error); }
   }

   async execute(quote: BridgeQuote, address: string): Promise<{ hash: string; historySaved: boolean }> {
      const chain = chainFor(quote.fromChainId);
      const provider = getProvider();
      await evmSwapService.ensureWallet(address, chain, provider);
      const client = createWalletClient({ account: address as Hex, chain, transport: custom(provider as never) });
      const hash = await client.sendTransaction({
         account: address as Hex,
         chain,
         to: quote.transaction.to as Hex,
         data: quote.transaction.data,
         value: BigInt(quote.transaction.value || "0"),
      });
      try {
         await this.api.post("/wallets/bridge/record", { transactionHash: hash, quoteProof: quote.quoteProof });
         return { hash, historySaved: true };
      } catch {
         return { hash, historySaved: false };
      }
   }

   async waitForTransaction(chainId: number, hash: string): Promise<void> {
      const client = createPublicClient({ chain: chainFor(chainId), transport: http() });
      await client.waitForTransactionReceipt({ hash: hash as Hex });
   }

   async status(transactionHash: string): Promise<BridgeStatus> {
      try {
         const response = await this.api.get<{ bridge: BridgeStatus }>("/wallets/bridge/status", { params: { transactionHash } });
         return response.data.bridge;
      } catch (error) { throw this.handleError(error); }
   }
}

export const bridgeService = new BridgeService();
