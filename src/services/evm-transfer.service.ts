import { createPublicClient, createWalletClient, custom, encodeFunctionData, http, isAddress, parseEther, parseUnits, toHex, type Chain, type Hex } from "viem";
import { base, bsc, celo, mainnet } from "viem/chains";
import { goatNetwork } from "@/lib/wagmi";
import { walletService, type WalletChain } from "@/services/wallet.service";

export const EVM_SEND_NETWORKS: Chain[] = [mainnet, base, celo, bsc, goatNetwork];
const ERC20_ABI = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
] as const;

export interface EvmTokenMetadata { address: string; symbol: string; decimals: number }

export function getEvmSendNetworks(walletChain: WalletChain): Chain[] {
  if (walletChain === "base") return [base];
  if (walletChain === "goat") return [goatNetwork];
  if (walletChain === "arc") return [];
  return [mainnet, base, celo, bsc];
}

export async function getEvmTokenMetadata(chainId: number, token: string): Promise<EvmTokenMetadata> {
  if (!isAddress(token)) throw new Error("Enter a valid token contract address");
  const chain = EVM_SEND_NETWORKS.find((network) => network.id === chainId);
  if (!chain) throw new Error("Unsupported EVM network");
  const client = createPublicClient({ chain, transport: http() });
  const [symbol, decimals] = await Promise.all([
    client.readContract({ address: token as Hex, abi: ERC20_ABI, functionName: "symbol" }),
    client.readContract({ address: token as Hex, abi: ERC20_ABI, functionName: "decimals" }),
  ]);
  return { address: token, symbol, decimals: Number(decimals) };
}

interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

function getProvider(): Eip1193Provider {
  const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  if (!provider) throw new Error("No EVM wallet found. Install MetaMask or another EIP-1193 wallet.");
  return provider;
}

function toErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") return error.message;
  return "Wallet transaction failed";
}

export async function sendEvmNative(input: {
  source: string;
  destination: string;
  amount: string;
  chainId: number;
}): Promise<{ hash: string; historySaved: boolean }> {
  const { source, destination, amount, chainId } = input;
  if (!isAddress(source) || !isAddress(destination)) throw new Error("Enter a valid EVM wallet address");
  if (!/^\d+(\.\d{1,18})?$/.test(amount) || Number(amount) <= 0) {
    throw new Error("Enter an amount greater than zero with up to 18 decimal places");
  }

  const chain = EVM_SEND_NETWORKS.find((network) => network.id === chainId);
  if (!chain) throw new Error("Unsupported EVM network");
  const provider = getProvider();
  const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
  if (!accounts?.some((account) => account.toLowerCase() === source.toLowerCase())) {
    throw new Error("Select the linked address in your EVM wallet, then try again");
  }

  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: toHex(chain.id) }] });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code !== 4902) throw new Error(toErrorMessage(error));
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: toHex(chain.id),
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls.default.http,
        ...(chain.blockExplorers?.default.url ? { blockExplorerUrls: [chain.blockExplorers.default.url] } : {}),
      }],
    });
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: toHex(chain.id) }] });
  }

  const activeAccounts = await provider.request({ method: "eth_accounts" }) as string[];
  if (!activeAccounts?.some((account) => account.toLowerCase() === source.toLowerCase())) {
    throw new Error("The active wallet address changed. Select the linked address and retry");
  }

  const walletClient = createWalletClient({
    account: source as Hex,
    chain,
    transport: custom(provider),
  });
  try {
    const hash = await walletClient.sendTransaction({
      account: source as Hex,
      chain,
      to: destination as Hex,
      value: parseEther(amount),
    });
    try {
      const activity = await walletService.recordEvmTransfer({ address: source, destination, amount, chainId, transactionHash: hash });
      return { hash, historySaved: activity.historySaved };
    } catch {
      return { hash, historySaved: false };
    }
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function sendEvmToken(input: {
  source: string;
  destination: string;
  token: EvmTokenMetadata;
  amount: string;
  chainId: number;
}): Promise<{ hash: string; historySaved: boolean }> {
  const { source, destination, token, amount, chainId } = input;
  if (!isAddress(source) || !isAddress(destination) || !isAddress(token.address)) throw new Error("Enter valid EVM addresses");
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(amount) || Number(amount) <= 0) throw new Error("Enter an amount greater than zero");
  const chain = EVM_SEND_NETWORKS.find((network) => network.id === chainId);
  if (!chain) throw new Error("Unsupported EVM network");
  const value = parseUnits(amount, token.decimals);
  const provider = getProvider();
  const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
  if (!accounts?.some((account) => account.toLowerCase() === source.toLowerCase())) throw new Error("Select the linked address in your EVM wallet, then try again");
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: toHex(chain.id) }] });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code !== 4902) throw new Error(toErrorMessage(error));
    await provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: toHex(chain.id), chainName: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: chain.rpcUrls.default.http, ...(chain.blockExplorers?.default.url ? { blockExplorerUrls: [chain.blockExplorers.default.url] } : {}) }] });
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: toHex(chain.id) }] });
  }
  const activeAccounts = await provider.request({ method: "eth_accounts" }) as string[];
  const activeChain = Number(await provider.request({ method: "eth_chainId" }));
  if (activeChain !== chainId || !activeAccounts?.some((account) => account.toLowerCase() === source.toLowerCase())) throw new Error("The active wallet or network changed. Select the linked wallet and retry");
  const walletClient = createWalletClient({ account: source as Hex, chain, transport: custom(provider) });
  try {
    const hash = await walletClient.sendTransaction({
      account: source as Hex, chain, to: token.address as Hex,
      data: encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: [destination as Hex, value] }),
    });
    try {
      const activity = await walletService.recordEvmTokenTransfer({ address: source, destination, token: token.address, amount: value.toString(), chainId, transactionHash: hash });
      return { hash, historySaved: activity.historySaved };
    } catch { return { hash, historySaved: false }; }
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}
