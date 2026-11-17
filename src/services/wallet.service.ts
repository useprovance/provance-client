import { BaseApiService } from './api.service';

export type WalletChain = 'evm' | 'base' | 'goat' | 'arc' | 'stellar';

export interface WalletRecord {
  id: string;
  address: string;
  chain: WalletChain;
  label: string | null;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_address: string;
  chain: string;
  network: string;
  kind: "transfer" | "swap" | "vault" | "order";
  provider: string;
  from_asset: string;
  to_asset: string | null;
  amount_in: string;
  amount_out: string | null;
  status: "submitted" | "confirmed" | "failed";
  transaction_hash: string;
  fee: string | null;
  ledger: number | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface IncomingStellarPayment {
  id: string;
  transactionHash: string;
  createdAt: string;
  amount: string;
  asset: string;
  from: string;
  status: "confirmed";
}

export interface IncomingEvmTransaction {
  id: string;
  transactionHash: string;
  createdAt: string;
  amount: string;
  asset: string;
  tokenAddress?: string;
  from: string;
  status: "confirmed";
  type: "native" | "token";
}

export interface EvmTokenRisk {
  token_address: string;
  chain: string;
  is_honeypot: boolean;
  owner_renounced: boolean;
  is_open_source: boolean;
  is_mintable: boolean;
  can_take_back_ownership: boolean;
  fake_token: boolean;
  buy_tax: number;
  sell_tax: number;
  risk_level: "low" | "medium" | "high" | "critical";
  risk_flags: string[];
  passed: boolean;
}

export interface EvmTokenVerification {
  source: "geckoterminal";
  chainId: number;
  network: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number | null;
  verified: boolean;
  gtVerified: boolean;
  gtScore: number | null;
  liquidityUsd: number;
  volume24hUsd: number;
  holders: number | null;
  honeypot: boolean | null;
  policy: {
    requiresGtVerified: boolean;
    minGtScore: number;
    minLiquidityUsd: number;
    minVolume24hUsd: number;
  };
  signals: string[];
  checkedAt: string;
}

export interface StellarTokenRisk {
  network: "mainnet" | "testnet";
  asset: { code: string; issuer: string };
  exists: boolean;
  issuerExists: boolean;
  flags: { authRequired: boolean; authRevocable: boolean; authClawbackEnabled: boolean; authImmutable: boolean } | null;
  stats: { supply: string; trustlines: number; authorizedTrustlines: number; unauthorizedTrustlines: number; liquidityPools: number; claimableBalances: number } | null;
  homeDomain: string | null;
  tomlVerified: boolean | null;
  riskLevel: "low" | "caution" | "high";
  passed: boolean;
  signals: Array<{ level: "info" | "caution" | "high"; message: string }>;
}

export interface EvmTransferRecordResult {
  historySaved: boolean;
  status?: "submitted" | "confirmed" | "failed";
}

export type AutomationPolicyToken =
  | { network: string; address: string }
  | { network: string; code: string; issuer: string };

export interface AutomationPolicyRecipient {
  network: string;
  address: string;
}

export interface AutomationPolicy {
  walletAddress: string;
  enabled: boolean;
  approvalThresholdUsd: number;
  dailyLimitUsd: number;
  maxTransactionUsd: number;
  allowedNetworks: string[];
  allowedTokens: AutomationPolicyToken[];
  allowExternalRecipients: boolean;
  allowedRecipients: AutomationPolicyRecipient[];
  policyHash: string | null;
  signedAt: string | null;
  updatedAt: string | null;
  persisted: boolean;
}

export interface AutomationPolicyUpdateInput {
  walletAddress: string;
  enabled: boolean;
  approvalThresholdUsd: number;
  dailyLimitUsd: number;
  maxTransactionUsd: number;
  allowedNetworks: string[];
  allowedTokens: AutomationPolicyToken[];
  allowExternalRecipients: boolean;
  allowedRecipients: AutomationPolicyRecipient[];
  challengeId: string;
  signature: string;
}

class WalletService extends BaseApiService {
  async createOwnershipChallenge(address: string, chain: "evm" | "stellar"): Promise<{ challengeId: string; message: string; expiresAt: string }> {
    try {
      const res = await this.api.post<{ challengeId: string; message: string; expiresAt: string }>("/wallets/ownership/challenge", { address, chain });
      return res.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAutomationPolicyChallenge(
    input: Omit<AutomationPolicyUpdateInput, "challengeId" | "signature">,
  ): Promise<{ challengeId: string; message: string; expiresAt: string; policyHash: string }> {
    try {
      const res = await this.api.post<{ challengeId: string; message: string; expiresAt: string; policyHash: string }>(
        "/wallets/automation-policy/challenge",
        input,
      );
      return res.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAutomationPolicy(walletAddress: string): Promise<AutomationPolicy> {
    try {
      const res = await this.api.get<{ policy: AutomationPolicy }>("/wallets/automation-policy", { params: { walletAddress } });
      return res.data.policy;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAutomationPolicy(input: AutomationPolicyUpdateInput): Promise<AutomationPolicy> {
    try {
      const res = await this.api.put<{ policy: AutomationPolicy }>("/wallets/automation-policy", input);
      return res.data.policy;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAll(): Promise<WalletRecord[]> {
    try {
      const res = await this.api.get<{ wallets: WalletRecord[] }>('/wallets');
      return res.data.wallets;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTransactions(): Promise<WalletTransaction[]> {
    try {
      const res = await this.api.get<{ transactions: WalletTransaction[] }>("/wallets/transactions");
      return res.data.transactions;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getStellarIncoming(address: string, network: "mainnet" | "testnet"): Promise<IncomingStellarPayment[]> {
    try {
      const res = await this.api.get<{ payments: IncomingStellarPayment[] }>(`/wallets/stellar/${encodeURIComponent(address)}/incoming`, { params: { network } });
      return res.data.payments;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getEvmIncoming(address: string, chainId: number): Promise<IncomingEvmTransaction[]> {
    try {
      const res = await this.api.get<{ transactions: IncomingEvmTransaction[] }>(`/wallets/evm/${encodeURIComponent(address)}/incoming`, { params: { chainId } });
      return res.data.transactions;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async scanEvmTokenRisk(tokenAddress: string, chainId: number): Promise<EvmTokenRisk> {
    try {
      const res = await this.api.post<{ risk: EvmTokenRisk }>("/wallets/evm/token/risk", { tokenAddress, chainId });
      return res.data.risk;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyEvmToken(tokenAddress: string, chainId: number): Promise<EvmTokenVerification> {
    try {
      const res = await this.api.post<{ verification: EvmTokenVerification }>("/wallets/evm/token/verification", { tokenAddress, chainId });
      return res.data.verification;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async scanStellarTokenRisk(code: string, issuer: string): Promise<StellarTokenRisk> {
    try {
      const res = await this.api.post<{ risk: StellarTokenRisk }>("/wallets/stellar/token/risk", { code, issuer });
      return res.data.risk;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async recordEvmTransfer(input: { address: string; destination: string; amount: string; chainId: number; transactionHash: string }): Promise<EvmTransferRecordResult> {
    try {
      const res = await this.api.post<EvmTransferRecordResult>("/wallets/evm/transfer/record", input);
      return res.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async recordEvmTokenTransfer(input: { address: string; destination: string; token: string; amount: string; chainId: number; transactionHash: string }): Promise<EvmTransferRecordResult> {
    try {
      const res = await this.api.post<EvmTransferRecordResult>("/wallets/evm/transfer/token/record", input);
      return res.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async add(input: { address: string; chain: WalletChain; label?: string; challengeId: string; signature: string }): Promise<WalletRecord> {
    try {
      const res = await this.api.post<{ wallet: WalletRecord }>('/wallets', input);
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
