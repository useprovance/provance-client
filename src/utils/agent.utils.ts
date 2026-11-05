import type { Agent, ProvanceAction, ProvanceServices } from "@/services/agent.service";

const RESERVED = new Set(["web", "mcp", "a2a", "oasf"]);

export function extractActions(services: ProvanceServices): ProvanceAction[] {
   const webActions = (services.web as { actions?: ProvanceAction[] } | undefined)?.actions;
   if (Array.isArray(webActions)) return webActions;
   return Object.entries(services)
      .filter(([key, val]) =>
         !RESERVED.has(key) &&
         typeof val === "object" && val !== null &&
         "endpoint" in val && "config" in val
      )
      .map(([key, val]) => ({ key, ...(val as object) })) as ProvanceAction[];
}

export const CHAIN_NAMES: Record<number, string> = {
   0: "External service",
   1: "Ethereum", 8453: "Base", 42220: "Celo", 137: "Polygon",
   10: "Optimism", 42161: "Arbitrum", 56: "BSC", 100: "Gnosis",
   2345: "GOAT",
};

export function getChainName(chainId: number): string {
   return CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
}

export function truncateAddress(address: string): string {
   if (address.length < 10) return address;
   return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatAgentWallet(agent: Agent): string | null {
   return agent.agent_wallet ?? null;
}
