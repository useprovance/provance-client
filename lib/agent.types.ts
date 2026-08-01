export type AgentStatus = "online" | "offline" | "busy" | "maintenance";

export type Visibility = "public" | "private" | "unlisted";

export type PricingModel =
  | "free"
  | "fixed"
  | "per_request"
  | "per_second"
  | "per_token"
  | "subscription";

export type AuthenticationType =
  | "none"
  | "api_key"
  | "jwt"
  | "oauth2"
  | "wallet_signature";

export type Protocol = "http" | "https" | "grpc" | "websocket" | "mcp";

export type Network =
  | "stellar"
  | "ethereum"
  | "base"
  | "celo"
  | "solana"
  | "polygon";

export type VerificationLevel = "none" | "verified" | "trusted";

export interface AgentOwner {
  id: string;
  name: string;
  organization?: string;
  wallet: string;
  email?: string;
  website?: string;
  avatar?: string;
}

export interface AgentEndpoint {
  protocol: Protocol;
  url: string;
  authentication: AuthenticationType;
  version: string;
  timeout: number;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputSchema?: object;
  outputSchema?: object;
  examples?: string[];
}

export interface AgentPricing {
  model: PricingModel;
  amount: number;
  currency: string;
  minimumCharge?: number;
}

export interface AgentModel {
  provider: string;
  model: string;
  contextWindow?: number;
}

export interface AgentPayment {
  network: Network;
  contractAddress?: string;
  recipient: string;
  token: string;
}

export interface AgentHealth {
  status: AgentStatus;
  uptime: number;
  lastSeen: string;
  averageLatency: number;
  successRate: number;
}

export interface AgentReputation {
  score: number;
  completedJobs: number;
  failedJobs: number;
  reviews: number;
}

export interface AgentMetadata {
  tags: string[];
  category: string;
  language: string[];
  region?: string;
  icon?: string;
  banner?: string;
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  owner: AgentOwner;
  createdAt: string;
  updatedAt: string;
  visibility: Visibility;
  metadata: AgentMetadata;
  endpoint: AgentEndpoint;
  health: AgentHealth;
  models: AgentModel[];
  capabilities: AgentCapability[];
  pricing: AgentPricing;
  payment: AgentPayment;
  reputation: AgentReputation;
  verification: VerificationLevel;
  publicKey: string;
  signature?: string;
  documentation?: string;
  repository?: string;
  website?: string;
  termsOfService?: string;
  privacyPolicy?: string;
}
