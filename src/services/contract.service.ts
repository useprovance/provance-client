import { createPublicClient, createWalletClient, custom, http, type Abi, type Chain, type Hex } from "viem";
import { BaseApiService } from "./api.service";
import { EVM_SWAP_NETWORKS, evmSwapService } from "./evm-swap.service";

export interface ContractFunctionInput {
   name?: string;
   type: string;
   components?: ContractFunctionInput[];
}

export interface ContractFunction {
   name: string;
   stateMutability: string;
   inputs: ContractFunctionInput[];
   outputs: ContractFunctionInput[];
}

export interface ContractInspection {
   address: string;
   chainId: number;
   contractName: string | null;
   source: "uploaded" | "etherscan";
   verified: boolean;
   abi: Abi;
   functions: ContractFunction[];
}

export interface ContractSimulation {
   chainId: number;
   address: string;
   from: string;
   functionName: string;
   stateMutability: string;
   data: Hex;
   value: string;
   gas: string | null;
   result: unknown;
   callProof: string;
   expiresInSeconds: number;
}

interface Eip1193Provider { request(args: { method: string; params?: unknown[] }): Promise<unknown> }
function getProvider(): Eip1193Provider {
   const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
   if (!provider) throw new Error("No EVM wallet found. Install MetaMask or another EIP-1193 wallet.");
   return provider;
}

function chainFor(chainId: number): Chain {
   const chain = EVM_SWAP_NETWORKS.find((item) => item.id === chainId);
   if (!chain) throw new Error("Unsupported EVM contract network");
   return chain;
}

export function parseContractArgument(type: string, raw: string): unknown {
   const value = raw.trim();
   if (type === "bool") {
      if (value !== "true" && value !== "false") throw new Error("Boolean values must be true or false");
      return value === "true";
   }
   if (/^u?int\d*$/.test(type)) {
      if (!/^\d+$/.test(value)) throw new Error(`Enter a non-negative integer for ${type}`);
      return BigInt(value);
   }
   if (type.endsWith("]") || type.startsWith("tuple")) {
      try { return JSON.parse(value) as unknown; }
      catch { throw new Error(`Enter valid JSON for ${type}`); }
   }
   if (type === "bytes" && value && !/^0x[0-9a-fA-F]*$/.test(value)) throw new Error("Bytes values must start with 0x");
   return value;
}

class ContractService extends BaseApiService {
   async inspect(chainId: number, address: string, abi?: Abi): Promise<ContractInspection> {
      try {
         const response = await this.api.post<ContractInspection>("/wallets/evm/contract/inspect", { chainId, address, abi });
         return response.data;
      } catch (error) { throw this.handleError(error); }
   }

   async simulate(input: {
      chainId: number;
      address: string;
      from: string;
      abi: Abi;
      functionName: string;
      args: unknown[];
      value: string;
   }): Promise<ContractSimulation> {
      try {
         const response = await this.api.post<ContractSimulation>("/wallets/evm/contract/simulate", input);
         return response.data;
      } catch (error) { throw this.handleError(error); }
   }

   async execute(simulation: ContractSimulation): Promise<{ hash: string; historySaved: boolean; status: string }> {
      const chain = chainFor(simulation.chainId);
      const provider = getProvider();
      await evmSwapService.ensureWallet(simulation.from, chain, provider);
      const client = createWalletClient({ account: simulation.from as Hex, chain, transport: custom(provider as never) });
      const hash = await client.sendTransaction({
         account: simulation.from as Hex,
         chain,
         to: simulation.address as Hex,
         data: simulation.data,
         value: BigInt(simulation.value || "0"),
      });
      try {
         const response = await this.api.post<{ historySaved: boolean; status: string }>("/wallets/evm/contract/record", {
            transactionHash: hash,
            callProof: simulation.callProof,
         });
         return { hash, historySaved: true, status: response.data.status };
      } catch {
         return { hash, historySaved: false, status: "submitted" };
      }
   }

   async waitForTransaction(chainId: number, hash: string): Promise<void> {
      const client = createPublicClient({ chain: chainFor(chainId), transport: http() });
      await client.waitForTransactionReceipt({ hash: hash as Hex });
   }
}

export const contractService = new ContractService();
