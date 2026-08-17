const NODES_URL = process.env.NEXT_PUBLIC_NODES_URL ?? "https://nodes.useprovance.xyz";

export interface AgentField {
   key: string;
   label: string;
   type: "text" | "textarea" | "number" | "select";
   placeholder?: string;
   options?: string[];
}

export interface AgentOutput {
   key: string;
   label: string;
}

export interface NodeConfig {
   key: string;
   label: string;
   fields: AgentField[];
}

export interface Agent {
   id: string;
   nodeType: "agent";
   label: string;
   description: string;
   icon: string;
   author: string;
   version: string;
   category: string;
   identifier: string;
   downloads: string;
   rating: number;
   features: string[];
   publishedAt: string;
   lastReleased: string;
   url: string;
   config: NodeConfig[];
   outputs: AgentOutput[];
}

const SETTINGS_CONFIG: NodeConfig = {
   key: "settings",
   label: "Settings",
   fields: [
      { key: "retries", label: "Retry on failure", type: "select", options: ["No retry", "1 retry", "3 retries", "5 retries"] },
      { key: "timeout", label: "Timeout (seconds)", type: "number", placeholder: "30" },
      { key: "notes", label: "Notes", type: "textarea", placeholder: "Add notes about this node..." },
   ],
};

export const AGENTS: Agent[] = [
   {
      id: "dexscreener",
      nodeType: "agent",
      label: "DexScreener",
      description: "Detects newly listed tokens on Base. Filters by liquidity, age, and volume — passes structured token data downstream.",
      author: "Provance",
      downloads: "6.1K",
      rating: 4.5,
      icon: "/icons/agents/dexscreener.svg",
      version: "1.0.0",
      category: "DeFi Data",
      identifier: "provance.dexscreener-agent",
      publishedAt: "2 months ago",
      lastReleased: "1 week ago",
      url: "`${NODES_URL}/dexscreener`",
      outputs: [
         { key: "token_address", label: "Token address" },
         { key: "symbol", label: "Symbol" },
         { key: "name", label: "Name" },
         { key: "chain", label: "Chain" },
         { key: "price_usd", label: "Price (USD)" },
         { key: "liquidity_usd", label: "Liquidity (USD)" },
         { key: "volume_24h", label: "Volume 24h" },
         { key: "age_minutes", label: "Age (minutes)" },
         { key: "dex", label: "DEX" },
         { key: "url", label: "DexScreener URL" },
      ],
      features: [
         "New token detection on Base",
         "Liquidity and volume filtering",
         "Multi-DEX support",
         "Structured token output",
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               { key: "chain", label: "Chain", type: "select", options: ["base", "ethereum", "bsc"] },
               { key: "min_liquidity_usd", label: "Min liquidity (USD)", type: "number", placeholder: "10000" },
               { key: "max_age_minutes", label: "Max token age (minutes)", type: "number", placeholder: "2880" },
               { key: "limit", label: "Max tokens to return", type: "number", placeholder: "10" },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "goplus",
      nodeType: "agent",
      label: "GoPlus",
      description: "Runs on-chain security checks on token contracts and flags risks. Detects honeypots, rug pulls, and other vulnerabilities.",
      author: "Provance",
      downloads: "4.9K",
      rating: 4,
      icon: "/icons/agents/goplus.svg",
      version: "1.0.2",
      category: "Security",
      identifier: "provance.goplus-agent",
      publishedAt: "4 months ago",
      lastReleased: "5 weeks ago",
      url: "`${NODES_URL}/goplus`",
      outputs: [
         { key: "token_address", label: "Token address" },
         { key: "chain", label: "Chain" },
         { key: "is_honeypot", label: "Is honeypot" },
         { key: "passed", label: "Passed security check" },
         { key: "risk_level", label: "Risk level" },
         { key: "risk_flags", label: "Risk flags" },
         { key: "buy_tax", label: "Buy tax (%)" },
         { key: "sell_tax", label: "Sell tax (%)" },
         { key: "owner_renounced", label: "Ownership renounced" },
         { key: "holder_count", label: "Holder count" },
      ],
      features: [
         "Honeypot detection",
         "Rug pull analysis",
         "Multi-chain support",
         "Risk level scoring",
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               { key: "token_address", label: "Token address", type: "text", placeholder: "0x..." },
               { key: "chain", label: "Chain", type: "select", options: ["base", "ethereum", "bsc", "polygon", "arbitrum"] },
               { key: "min_risk_level", label: "Flag at risk level", type: "select", options: ["low", "medium", "high"] },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "honeypot",
      nodeType: "agent",
      label: "Honeypot",
      description: "Simulates a real buy and sell transaction to confirm the token can actually be sold. Second layer of protection beyond static analysis.",
      author: "Provance",
      downloads: "3.8K",
      rating: 4.5,
      icon: "/icons/agents/honeypot.svg",
      version: "1.0.0",
      category: "Security",
      identifier: "provance.honeypot-agent",
      publishedAt: "2 months ago",
      lastReleased: "2 weeks ago",
      url: "`${NODES_URL}/honeypot`",
      outputs: [
         { key: "token_address", label: "Token address" },
         { key: "is_honeypot", label: "Is honeypot" },
         { key: "can_sell", label: "Can sell" },
         { key: "buy_tax", label: "Buy tax (%)" },
         { key: "sell_tax", label: "Sell tax (%)" },
         { key: "gas_estimate", label: "Gas estimate" },
      ],
      features: [
         "Live buy/sell simulation",
         "Tax detection from simulation",
         "Sell failure detection",
         "Gas usage estimation",
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               { key: "token_address", label: "Token address", type: "text", placeholder: "0x..." },
               { key: "chain", label: "Chain", type: "select", options: ["base", "ethereum", "bsc", "polygon", "arbitrum"] },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "ai-decision",
      nodeType: "agent",
      label: "AI Decision",
      description: "Aggregates all security signals and uses GPT-4o to decide whether to buy or ignore the token. Configurable confidence threshold.",
      author: "Provance",
      downloads: "5.2K",
      rating: 5,
      icon: "/icons/agents/openai.svg",
      version: "1.0.0",
      category: "AI",
      identifier: "provance.ai-decision-agent",
      publishedAt: "2 months ago",
      lastReleased: "1 week ago",
      url: "`${NODES_URL}/ai-decision`",
      outputs: [
         { key: "token_address", label: "Token address" },
         { key: "decision", label: "Decision (buy / ignore)" },
         { key: "confidence", label: "Confidence (%)" },
         { key: "reasoning", label: "Reasoning" },
         { key: "security_score", label: "Security score" },
         { key: "liquidity_score", label: "Liquidity score" },
         { key: "risk_score", label: "Risk score" },
         { key: "overall_score", label: "Overall score" },
         { key: "hard_rejected", label: "Hard rejected" },
      ],
      features: [
         "GPT-4o powered analysis",
         "Hard reject rules",
         "Confidence scoring",
         "Explainable decisions",
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               { key: "min_confidence", label: "Min confidence to buy (%)", type: "number", placeholder: "70" },
               { key: "max_sell_tax", label: "Max sell tax (%)", type: "number", placeholder: "10" },
               { key: "min_liquidity_usd", label: "Min liquidity (USD)", type: "number", placeholder: "10000" },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "telegram",
      nodeType: "agent",
      label: "Telegram",
      description: "Sends formatted alerts to a Telegram channel or group when risk is detected. Supports custom message templates with dynamic variables.",
      author: "Provance",
      downloads: "9.1K",
      rating: 4.5,
      icon: "/icons/agents/telegram.svg",
      version: "1.3.0",
      category: "Notifications",
      identifier: "provance.telegram-agent",
      publishedAt: "7 months ago",
      lastReleased: "2 weeks ago",
      url: "`${NODES_URL}/telegram`",
      outputs: [
         { key: "sent", label: "Message sent" },
         { key: "message_id", label: "Message ID" },
         { key: "chat_id", label: "Chat ID" },
      ],
      features: [
         "Channel and group support",
         "Custom message templates",
         "Dynamic variable injection",
         "Markdown formatting",
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               { key: "chat_id", label: "Chat ID", type: "text", placeholder: "1853974406" },
               { key: "message", label: "Message template", type: "textarea", placeholder: "Token {{symbol}} passed all checks." },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "gruff",
      nodeType: "agent",
      label: "Gruff",
      description: "AI-powered trading agent on GOAT Network (Bitcoin L2). Send a plain text message — it checks balances, gets quotes, and executes swaps via OKU.",
      author: "Provance",
      downloads: "1.2K",
      rating: 4.7,
      icon: "/icons/agents/goat.svg",
      version: "1.0.0",
      category: "DeFi",
      identifier: "provance.gruff-agent",
      publishedAt: "1 month ago",
      lastReleased: "1 month ago",
      url: "`${NODES_URL}/gruff`",
      outputs: [
         { key: "action", label: "Action performed" },
         { key: "success", label: "Success" },
         { key: "tx_hash", label: "Transaction hash" },
         { key: "amount_in", label: "Amount in" },
         { key: "amount_out", label: "Amount out" },
         { key: "balance", label: "Wallet balance" },
         { key: "symbol", label: "Token symbol" },
      ],
      features: [
         "Token swaps via OKU (Uniswap V3)",
         "Wallet balance checks",
         "Automatic slippage protection",
         "ERC20 approval handling",
         "WGBTC and GOAT token support",
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               { key: "message", label: "Message", type: "textarea", placeholder: "Swap 0.001 WGBTC for USDCe" },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "stellar-trader",
      nodeType: "agent",
      label: "Blaze",
      description: "AI-powered trading agent on Stellar. Has its own wallet — checks balances, reads order books, executes swaps and limit orders with XLM and USDC via Soroswap.",
      author: "Provance",
      downloads: "892",
      rating: 4.8,
      icon: "/icons/agents/stellar.svg",
      version: "1.0.0",
      category: "DeFi",
      identifier: "provance.stellar-trader-agent",
      publishedAt: "Just now",
      lastReleased: "Just now",
      url: "`${NODES_URL}/blaze`",
      outputs: [
         { key: "action", label: "Action performed" },
         { key: "success", label: "Success" },
         { key: "tx_hash", label: "Transaction hash" },
         { key: "asset_in", label: "Asset in" },
         { key: "asset_out", label: "Asset out" },
         { key: "amount_in", label: "Amount in" },
         { key: "amount_out", label: "Amount out" },
         { key: "price", label: "Price" },
         { key: "offer_id", label: "Offer ID" },
         { key: "balance_xlm", label: "XLM balance" },
         { key: "balance_usdc", label: "USDC balance" },
      ],
      features: [
         "Own Stellar keypair wallet",
         "SDEX swap via path payments",
         "Limit orders (buy/sell offers)",
         "Real-time order book reading",
         "USDC and XLM support",
         "Testnet and mainnet ready",
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               { key: "message", label: "Message", type: "textarea", placeholder: "Swap 100 XLM for USDC" },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
];

class AgentService {
   getById(id: string): Agent | undefined {
      return AGENTS.find((a) => a.id === id);
   }

   getAll(): Agent[] {
      return AGENTS;
   }
}

export const agentService = new AgentService();
