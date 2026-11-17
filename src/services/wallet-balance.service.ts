import { createPublicClient, formatUnits, http, type Chain } from "viem";
import { base, bsc, celo, mainnet } from "viem/chains";
import { goatNetwork } from "@/lib/wagmi";
import { EVM_SWAP_NETWORKS } from "@/services/evm-swap.service";
import type { WalletRecord } from "@/services/wallet.service";

export interface WalletBalance {
  network: string;
  symbol: string;
  amount: string;
  asset?: string;
}

export interface WalletBalanceResult {
  balances: WalletBalance[];
  errors: string[];
}

const CORE_EVM_NETWORKS: Chain[] = [mainnet, base, celo, bsc];
const STELLAR_NETWORKS = [
  { name: "Stellar", horizon: "https://horizon.stellar.org" },
  { name: "Stellar Testnet", horizon: "https://horizon-testnet.stellar.org" },
];

function compactAmount(value: string): string {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

async function getEvmBalances(address: `0x${string}`, networks: Chain[]): Promise<WalletBalanceResult> {
  const results: PromiseSettledResult<WalletBalance>[] = [];
  for (let index = 0; index < networks.length; index += 4) {
    const batch = networks.slice(index, index + 4);
    results.push(...await Promise.allSettled(batch.map(async (chain) => {
      const client = createPublicClient({ chain, transport: http() });
      const amount = await client.getBalance({ address });
      return {
        network: chain.name,
        symbol: chain.nativeCurrency.symbol,
        amount: compactAmount(formatUnits(amount, chain.nativeCurrency.decimals)),
      } satisfies WalletBalance;
    })));
  }

  return {
    balances: results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []),
    errors: results.flatMap((result, index) => result.status === "rejected" ? [`${networks[index].name}: ${result.reason instanceof Error ? result.reason.message : "balance unavailable"}`] : []),
  };
}

async function getStellarBalances(address: string): Promise<WalletBalanceResult> {
  const results = await Promise.allSettled(STELLAR_NETWORKS.map(async ({ name, horizon }) => {
    const response = await fetch(`${horizon}/accounts/${encodeURIComponent(address)}`);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`${name}: Horizon returned ${response.status}`);
    const account = await response.json() as { balances?: Array<{ asset_type: string; asset_code?: string; balance: string }> };
    return (account.balances ?? []).map((balance) => ({
      network: name,
      symbol: balance.asset_type === "native" ? "XLM" : balance.asset_code ?? "Asset",
      amount: compactAmount(balance.balance),
      ...(balance.asset_type === "native" ? {} : { asset: "issued" }),
    } satisfies WalletBalance));
  }));

  return {
    balances: results.flatMap((result) => result.status === "fulfilled" ? result.value : []),
    errors: results.flatMap((result, index) => result.status === "rejected" ? [`${STELLAR_NETWORKS[index].name}: ${result.reason instanceof Error ? result.reason.message : "balance unavailable"}`] : []),
  };
}

export async function getWalletBalances(wallet: WalletRecord): Promise<WalletBalanceResult> {
  if (wallet.chain === "stellar") return getStellarBalances(wallet.address);
  if (!wallet.address.startsWith("0x")) return { balances: [], errors: ["Invalid EVM address"] };

  const address = wallet.address as `0x${string}`;
  if (wallet.chain === "goat") return getEvmBalances(address, [goatNetwork]);
  if (wallet.chain === "base") return getEvmBalances(address, [base]);
  if (wallet.chain === "arc") {
    const arcChain = EVM_SWAP_NETWORKS.find((chain) => chain.name.toLowerCase().includes("arc"));
    return arcChain ? getEvmBalances(address, [arcChain]) : { balances: [], errors: ["Arc balance reader is not configured yet"] };
  }
  return getEvmBalances(address, EVM_SWAP_NETWORKS.length ? EVM_SWAP_NETWORKS : CORE_EVM_NETWORKS);
}
