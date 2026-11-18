import { BaseApiService } from "./api.service";
import {
  createPublicClient, createWalletClient, custom, encodeFunctionData, http,
  formatUnits, isAddress, parseUnits, toHex, type Chain, type Hex,
} from "viem";
import {
  abstract, arbitrum, arc, avalanche, base, berachain, bsc, celo, hyperEvm,
  ink, linea, mainnet, mantle, monad, optimism, plasma, polygon,
  robinhood, scroll, sonic, tempo, unichain, worldchain,
} from "viem/chains";

// This list mirrors the networks currently supported by the 0x Swap API.
export const EVM_SWAP_NETWORKS: Chain[] = [
  mainnet, abstract, arbitrum, arc, avalanche, base, berachain, bsc, celo,
  hyperEvm, ink, linea, mantle, monad, optimism, plasma, polygon,
  robinhood, scroll, sonic, tempo, unichain, worldchain,
];
const ERC20_ABI = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
] as const;

export interface EvmSwapQuote {
  provider: "0x" | "uniswap";
  chainId: number;
  address: string;
  sellToken: string;
  buyToken: string;
  sellTokenDecimals: number;
  buyTokenDecimals: number;
  sellAmount: string;
  buyAmount: string;
  minimumBuyAmount: string;
  slippageBps: number;
  transaction: { to: string; data: Hex; value?: string; gas?: string; gasPrice?: string };
  allowanceTarget: string | null;
  quoteProof: string;
  liquidityAvailable: boolean;
  sources: string[];
  expiresInSeconds: number;
}

export interface EvmTokenSearchResult {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

interface Eip1193Provider { request(args: { method: string; params?: unknown[] }): Promise<unknown> }
function getProvider(): Eip1193Provider {
  const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  if (!provider) throw new Error("No EVM wallet found. Install MetaMask or another EIP-1193 wallet.");
  return provider;
}

class EvmSwapService extends BaseApiService {
  async searchTokens(chainId: number, search: string): Promise<EvmTokenSearchResult[]> {
    try {
      const response = await this.api.get<{ tokens: EvmTokenSearchResult[] }>("/wallets/evm/tokens", { params: { chainId, search } });
      return response.data.tokens;
    } catch (error) { throw this.handleError(error); }
  }

  async getTokenMetadata(chainId: number, token: string): Promise<{ name: string; symbol: string; decimals: number }> {
    const chain = EVM_SWAP_NETWORKS.find((item) => item.id === chainId);
    if (!chain) throw new Error("Unsupported EVM swap network");
    if (!isAddress(token)) throw new Error("Enter a valid token contract address");
    try {
      const client = createPublicClient({ chain, transport: http() });
      const [name, symbol, decimals] = await Promise.all([
        client.readContract({ address: token as Hex, abi: ERC20_ABI, functionName: "name" }),
        client.readContract({ address: token as Hex, abi: ERC20_ABI, functionName: "symbol" }),
        client.readContract({ address: token as Hex, abi: ERC20_ABI, functionName: "decimals" }),
      ]);
      return { name, symbol, decimals: Number(decimals) };
    } catch {
      throw new Error("Could not read ERC-20 metadata on this network. Check the contract and network.");
    }
  }

  async quote(input: { address: string; chainId: number; sellToken: string; buyToken: string; sellTokenDecimals: number; buyTokenDecimals: number; sellAmount: string; slippageBps: number }): Promise<EvmSwapQuote> {
    try {
      const response = await this.api.post<EvmSwapQuote>("/wallets/evm/swap/quote", input);
      return response.data;
    } catch (error) { throw this.handleError(error); }
  }

  async allowance(input: { chainId: number; owner: string; token: string; spender: string }): Promise<bigint> {
    const chain = EVM_SWAP_NETWORKS.find((item) => item.id === input.chainId);
    if (!chain) throw new Error("Unsupported EVM swap network");
    const client = createPublicClient({ chain, transport: httpForProvider(getProvider()) });
    return client.readContract({ address: input.token as Hex, abi: ERC20_ABI, functionName: "allowance", args: [input.owner as Hex, input.spender as Hex] });
  }

  async approve(input: { source: string; chainId: number; token: string; spender: string; amount: bigint }): Promise<string> {
    const chain = EVM_SWAP_NETWORKS.find((item) => item.id === input.chainId);
    if (!chain) throw new Error("Unsupported EVM swap network");
    const provider = getProvider();
    await this.ensureWallet(input.source, chain, provider);
    const client = createWalletClient({ account: input.source as Hex, chain, transport: custom(provider as never) });
    return client.sendTransaction({
      account: input.source as Hex, chain, to: input.token as Hex,
      data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [input.spender as Hex, input.amount] }),
    });
  }

  async waitForTransaction(chainId: number, hash: string): Promise<void> {
    const chain = EVM_SWAP_NETWORKS.find((item) => item.id === chainId);
    if (!chain) throw new Error("Unsupported EVM swap network");
    const client = createPublicClient({ chain, transport: httpForProvider(getProvider()) });
    const receipt = await client.waitForTransactionReceipt({ hash: hash as Hex });
    if (receipt.status !== "success") throw new Error("Token approval failed on-chain");
  }

  async execute(quote: EvmSwapQuote): Promise<{ hash: string; historySaved: boolean }> {
    const chain = EVM_SWAP_NETWORKS.find((item) => item.id === quote.chainId);
    if (!chain) throw new Error("Unsupported EVM swap network");
    const provider = getProvider();
    await this.ensureWallet(quote.address, chain, provider);
    const client = createWalletClient({ account: quote.address as Hex, chain, transport: custom(provider as never) });
    const hash = await client.sendTransaction({
      account: quote.address as Hex, chain, to: quote.transaction.to as Hex,
      data: quote.transaction.data, value: BigInt(quote.transaction.value ?? "0"),
    });
    try {
      const response = await this.api.post<{ historySaved: boolean }>("/wallets/evm/swap/record", { transactionHash: hash, quoteProof: quote.quoteProof });
      return { hash, historySaved: response.data.historySaved };
    } catch {
      return { hash, historySaved: false };
    }
  }

  async ensureWallet(address: string, chain: Chain, provider = getProvider()): Promise<void> {
    if (!isAddress(address)) throw new Error("Invalid EVM wallet address");
    const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
    if (!accounts?.some((account) => account.toLowerCase() === address.toLowerCase())) throw new Error("Select the linked address in your EVM wallet, then try again");
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: toHex(chain.id) }] });
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
      if (code !== 4902) throw error;
      await provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: toHex(chain.id), chainName: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: chain.rpcUrls.default.http, ...(chain.blockExplorers?.default.url ? { blockExplorerUrls: [chain.blockExplorers.default.url] } : {}) }] });
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: toHex(chain.id) }] });
    }
    const activeChain = Number(await provider.request({ method: "eth_chainId" }));
    const activeAccounts = await provider.request({ method: "eth_accounts" }) as string[];
    if (activeChain !== chain.id || !activeAccounts?.some((account) => account.toLowerCase() === address.toLowerCase())) throw new Error("The active wallet or network changed. Select the linked wallet and retry");
  }
}

function httpForProvider(provider: Eip1193Provider) {
  return custom(provider as never);
}

export function parseEvmSwapAmount(amount: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new Error("Token decimals must be between 0 and 36");
  try {
    const parsed = parseUnits(amount, decimals);
    if (parsed <= 0n) throw new Error("Amount must be greater than zero");
    return parsed;
  } catch { throw new Error(`Enter an amount greater than zero with up to ${decimals} decimal places`); }
}

export function formatEvmSwapAmount(amount: string, decimals: number): string {
  return formatUnits(BigInt(amount), decimals);
}

export const evmSwapService = new EvmSwapService();
