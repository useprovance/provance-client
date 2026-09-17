const NODES_URL =
   process.env.NEXT_PUBLIC_NODES_URL ?? "https://nodes.useprovance.xyz";

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

export interface AgentPayment {
   token: string;           // token symbol e.g. "USDCe"
   address: string;         // token contract address
   chainId: number;         // network chain ID
   walletAddress?: string;  // agent's receiving wallet (where payment is sent)
}

export interface AgentAction {
   key: string;
   label: string;
   description: string;
   price?: number;        // USD price per call — undefined means free
   config: NodeConfig[];
}

export interface Agent {
   payment?: AgentPayment;
   id: string;
   nodeType: "agent" | "trigger" | "flow";
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
   actions?: AgentAction[];
   outputs: AgentOutput[];
}

const SETTINGS_CONFIG: NodeConfig = {
   key: "settings",
   label: "Settings",
   fields: [
      {
         key: "retries",
         label: "Retry on failure",
         type: "select",
         options: ["No retry", "1 retry", "3 retries", "5 retries"],
      },
      {
         key: "timeout",
         label: "Timeout (seconds)",
         type: "number",
         placeholder: "30",
      },
      {
         key: "notes",
         label: "Notes",
         type: "textarea",
         placeholder: "Add notes about this node...",
      },
   ],
};

export const AGENTS: Agent[] = [
   {
      id: "dexscreener",
      nodeType: "agent",
      label: "DexScreener",
      description:
         "Detects newly listed tokens on Base. Filters by liquidity, age, and volume — passes structured token data downstream.",
      author: "Provance",
      downloads: "6.1K",
      rating: 4.5,
      icon: "/icons/agents/dexscreener.svg",
      version: "1.0.0",
      category: "DeFi Data",
      identifier: "provance.dexscreener-agent",
      publishedAt: "2 months ago",
      lastReleased: "1 week ago",
      url: `${NODES_URL}/dexscreener`,
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
      actions: [
         {
            key: "scan_new_tokens",
            label: "Scan New Tokens",
            description:
               "Scan newly listed tokens filtered by liquidity, age, and volume.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "chain",
                        label: "Chain",
                        type: "select",
                        options: ["base", "ethereum", "bsc"],
                     },
                     {
                        key: "min_liquidity_usd",
                        label: "Min liquidity (USD)",
                        type: "number",
                        placeholder: "10000",
                     },
                     {
                        key: "max_age_minutes",
                        label: "Max token age (minutes)",
                        type: "number",
                        placeholder: "2880",
                     },
                     {
                        key: "limit",
                        label: "Max tokens to return",
                        type: "number",
                        placeholder: "10",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               {
                  key: "chain",
                  label: "Chain",
                  type: "select",
                  options: ["base", "ethereum", "bsc"],
               },
               {
                  key: "min_liquidity_usd",
                  label: "Min liquidity (USD)",
                  type: "number",
                  placeholder: "10000",
               },
               {
                  key: "max_age_minutes",
                  label: "Max token age (minutes)",
                  type: "number",
                  placeholder: "2880",
               },
               {
                  key: "limit",
                  label: "Max tokens to return",
                  type: "number",
                  placeholder: "10",
               },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "goplus",
      nodeType: "agent",
      label: "GoPlus",
      description:
         "Runs on-chain security checks on token contracts and flags risks. Detects honeypots, rug pulls, and other vulnerabilities.",
      author: "Provance",
      downloads: "4.9K",
      rating: 4,
      icon: "/icons/agents/goplus.svg",
      version: "1.0.2",
      category: "Security",
      identifier: "provance.goplus-agent",
      publishedAt: "4 months ago",
      lastReleased: "5 weeks ago",
      url: `${NODES_URL}/goplus`,
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
      actions: [
         {
            key: "security_scan",
            label: "Security Scan",
            description:
               "Run on-chain security checks on a token contract and flag risks.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "token_address",
                        label: "Token address",
                        type: "text",
                        placeholder: "0x...",
                     },
                     {
                        key: "chain",
                        label: "Chain",
                        type: "select",
                        options: [
                           "base",
                           "ethereum",
                           "bsc",
                           "polygon",
                           "arbitrum",
                        ],
                     },
                     {
                        key: "min_risk_level",
                        label: "Flag at risk level",
                        type: "select",
                        options: ["low", "medium", "high"],
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               {
                  key: "token_address",
                  label: "Token address",
                  type: "text",
                  placeholder: "0x...",
               },
               {
                  key: "chain",
                  label: "Chain",
                  type: "select",
                  options: ["base", "ethereum", "bsc", "polygon", "arbitrum"],
               },
               {
                  key: "min_risk_level",
                  label: "Flag at risk level",
                  type: "select",
                  options: ["low", "medium", "high"],
               },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "honeypot",
      nodeType: "agent",
      label: "Honeypot",
      description:
         "Simulates a real buy and sell transaction to confirm the token can actually be sold. Second layer of protection beyond static analysis.",
      author: "Provance",
      downloads: "3.8K",
      rating: 4.5,
      icon: "/icons/agents/honeypot.svg",
      version: "1.0.0",
      category: "Security",
      identifier: "provance.honeypot-agent",
      publishedAt: "2 months ago",
      lastReleased: "2 weeks ago",
      url: `${NODES_URL}/honeypot`,
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
      actions: [
         {
            key: "honeypot_check",
            label: "Honeypot Check",
            description:
               "Simulate a buy and sell to confirm the token can actually be sold.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "token_address",
                        label: "Token address",
                        type: "text",
                        placeholder: "0x...",
                     },
                     {
                        key: "chain",
                        label: "Chain",
                        type: "select",
                        options: [
                           "base",
                           "ethereum",
                           "bsc",
                           "polygon",
                           "arbitrum",
                        ],
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               {
                  key: "token_address",
                  label: "Token address",
                  type: "text",
                  placeholder: "0x...",
               },
               {
                  key: "chain",
                  label: "Chain",
                  type: "select",
                  options: ["base", "ethereum", "bsc", "polygon", "arbitrum"],
               },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "openai",
      nodeType: "agent",
      label: "OpenAI",
      description:
         "Runs a prompt through OpenAI's GPT models and returns the response. Connect to any node to add AI reasoning to your workflow.",
      author: "Provance",
      downloads: "5.2K",
      rating: 5,
      icon: "/icons/agents/openai.svg",
      version: "1.0.0",
      category: "AI",
      identifier: "provance.openai-agent",
      publishedAt: "2 months ago",
      lastReleased: "1 week ago",
      url: `${NODES_URL}/openai`,
      outputs: [
         { key: "response", label: "Response" },
         { key: "model", label: "Model used" },
         { key: "tokens_used", label: "Tokens used" },
      ],
      features: [
         "GPT-4o and GPT-4o-mini support",
         "Custom system prompt",
         "Temperature control",
         "Structured output",
      ],
      actions: [
         {
            key: "run_prompt",
            label: "Run Prompt",
            description:
               "Send a prompt to a GPT model and get a response back.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "model",
                        label: "Model",
                        type: "select",
                        options: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
                     },
                     {
                        key: "system_prompt",
                        label: "System prompt",
                        type: "textarea",
                        placeholder: "You are a helpful assistant.",
                     },
                     {
                        key: "message",
                        label: "User message",
                        type: "textarea",
                        placeholder: "Write your message here. Use @ to insert variables from previous nodes.",
                     },
                     {
                        key: "temperature",
                        label: "Temperature",
                        type: "number",
                        placeholder: "0.7",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               {
                  key: "model",
                  label: "Model",
                  type: "select",
                  options: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
               },
               {
                  key: "system_prompt",
                  label: "System prompt",
                  type: "textarea",
                  placeholder: "You are a helpful assistant.",
               },
               {
                  key: "message",
                  label: "User message",
                  type: "textarea",
                  placeholder: "Write your message here. Use @ to insert variables from previous nodes.",
               },
               {
                  key: "temperature",
                  label: "Temperature",
                  type: "number",
                  placeholder: "0.7",
               },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "telegram",
      nodeType: "agent",
      label: "Telegram",
      description:
         "Sends formatted alerts to a Telegram channel or group when risk is detected. Supports custom message templates with dynamic variables.",
      author: "Provance",
      downloads: "9.1K",
      rating: 4.5,
      icon: "/icons/agents/telegram.svg",
      version: "1.3.0",
      category: "Notifications",
      identifier: "provance.telegram-agent",
      publishedAt: "7 months ago",
      lastReleased: "2 weeks ago",
      url: `${NODES_URL}/telegram`,
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
      actions: [
         {
            key: "send_message",
            label: "Send Message",
            description:
               "Send a formatted message to a Telegram channel or group.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "chat_id",
                        label: "Chat ID",
                        type: "text",
                        placeholder: "1853974406",
                     },
                     {
                        key: "message",
                        label: "Message template",
                        type: "textarea",
                        placeholder: "Token {{symbol}} passed all checks.",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               {
                  key: "chat_id",
                  label: "Chat ID",
                  type: "text",
                  placeholder: "1853974406",
               },
               {
                  key: "message",
                  label: "Message template",
                  type: "textarea",
                  placeholder: "Token {{symbol}} passed all checks.",
               },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "gruff",
      nodeType: "agent",
      label: "Gruff",
      description:
         "AI-powered trading agent on GOAT Network (Bitcoin L2). Send a plain text message — it checks balances, gets quotes, and executes swaps via OKU.",
      author: "Provance",
      downloads: "1.2K",
      rating: 4.7,
      icon: "/icons/agents/gruff.svg",
      version: "1.0.0",
      category: "DeFi",
      identifier: "provance.gruff-agent",
      publishedAt: "1 month ago",
      lastReleased: "1 month ago",
      url: `${NODES_URL}/gruff`,
      payment: {
         token: "USDCe",
         address: "0x3022b87ac063DE95b1570F46f5e470F8B53112D8",
         chainId: 2345,
         walletAddress: "0x6B844ac411B68D6C6fB9A9B1efdd816777317928",
      },
      outputs: [
         { key: "action", label: "Action performed" },
         { key: "success", label: "Success" },
         { key: "tx_hash", label: "Transaction hash" },
         { key: "sold", label: "Amount sold" },
         { key: "received", label: "Amount received" },
         { key: "balance", label: "Native BTC balance" },
         { key: "wallet_address", label: "Wallet address" },
         { key: "tokens", label: "Portfolio tokens" },
         { key: "tokens_with_balance", label: "Tokens with balance" },
         { key: "explorer", label: "Explorer link" },
      ],
      features: [
         "Token swaps via OKU (Uniswap V3)",
         "Wallet balance checks",
         "Automatic slippage protection",
         "ERC20 approval handling",
         "WGBTC and GOAT token support",
      ],
      actions: [
         {
            key: "execute_trade",
            label: "Execute Trade",
            description:
               "Check balances, get a quote, and execute a swap on GOAT Network via OKU.",
            price: 0.001,
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "message",
                        label: "Message",
                        type: "textarea",
                        placeholder: "Swap 0.001 WGBTC for USDCe",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
         {
            key: "get_portfolio",
            label: "Get Portfolio",
            description:
               "Read the current wallet balance for all known tokens and any extra token addresses.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "extra_tokens",
                        label: "Extra token addresses",
                        type: "textarea",
                        placeholder: "0xabc...\n0xdef...",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
         {
            key: "sell_position",
            label: "Sell Position",
            description:
               "Sell a token position on OKU. Omit amount to sell full balance.",
            price: 0.001,
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "token",
                        label: "Token to sell",
                        type: "text",
                        placeholder: "BILLY",
                     },
                     {
                        key: "to_token",
                        label: "Receive token",
                        type: "text",
                        placeholder: "USDCe",
                     },
                     {
                        key: "amount",
                        label: "Amount (leave empty for full balance)",
                        type: "text",
                        placeholder: "",
                     },
                     {
                        key: "slippage_bps",
                        label: "Slippage (bps)",
                        type: "text",
                        placeholder: "50",
                     },
                     {
                        key: "fee_tier",
                        label: "Fee tier",
                        type: "text",
                        placeholder: "500",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               {
                  key: "message",
                  label: "Message",
                  type: "textarea",
                  placeholder: "Swap 0.001 WGBTC for USDCe",
               },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "blaze",
      nodeType: "agent",
      label: "Blaze",
      description:
         "AI-powered trading agent on Stellar. Has its own wallet — checks balances, reads order books, executes swaps and limit orders with XLM and USDC via Soroswap.",
      author: "Provance",
      downloads: "892",
      rating: 4.8,
      icon: "/icons/agents/blaze.png",
      version: "1.0.0",
      category: "DeFi",
      identifier: "provance.stellar-trader-agent",
      publishedAt: "Just now",
      lastReleased: "Just now",
      url: `${NODES_URL}/blaze`,
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
      actions: [
         {
            key: "execute_trade",
            label: "Execute Trade",
            description:
               "Check balances, read the order book, and execute a swap or limit order on Stellar.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "message",
                        label: "Message",
                        type: "textarea",
                        placeholder: "Swap 100 XLM for USDC",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               {
                  key: "message",
                  label: "Message",
                  type: "textarea",
                  placeholder: "Swap 100 XLM for USDC",
               },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "coingecko",
      nodeType: "agent",
      label: "CoinGecko",
      description:
         "Fetches token price, market cap, volume, and metadata from CoinGecko. Use it to enrich workflow data with live market information.",
      author: "Provance",
      downloads: "3.4K",
      rating: 4.8,
      icon: "/icons/agents/coingecko.svg",
      version: "1.0.0",
      category: "Market Data",
      identifier: "provance.coingecko-agent",
      publishedAt: "1 month ago",
      lastReleased: "3 days ago",
      url: `${NODES_URL}/coingecko`,
      outputs: [
         { key: "id", label: "CoinGecko ID" },
         { key: "name", label: "Name" },
         { key: "symbol", label: "Symbol" },
         { key: "price_usd", label: "Price (USD)" },
         { key: "market_cap_usd", label: "Market cap (USD)" },
         { key: "volume_24h", label: "Volume 24h" },
         { key: "price_change_24h", label: "Price change 24h (%)" },
         { key: "ath", label: "All-time high" },
         { key: "atl", label: "All-time low" },
      ],
      features: [
         "Live price and market cap",
         "24h volume and price change",
         "ATH and ATL data",
         "Token metadata lookup",
      ],
      actions: [
         {
            key: "get_market_data",
            label: "Get Market Data",
            description:
               "Fetch price, market cap, volume, and ATH for a coin by its CoinGecko ID.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "coin_id",
                        label: "CoinGecko coin ID",
                        type: "text",
                        placeholder: "bitcoin",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
         {
            key: "get_by_contract",
            label: "Get by Contract Address",
            description:
               "Look up a token by its contract address on a specific chain.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "token_address",
                        label: "Contract address",
                        type: "text",
                        placeholder: "0x...",
                     },
                     {
                        key: "chain",
                        label: "Chain",
                        type: "select",
                        options: [
                           "ethereum",
                           "base",
                           "bsc",
                           "arbitrum",
                           "polygon",
                        ],
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               {
                  key: "coin_id",
                  label: "CoinGecko coin ID",
                  type: "text",
                  placeholder: "bitcoin",
               },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   {
      id: "geckoterminal",
      nodeType: "agent",
      label: "GeckoTerminal",
      description:
         "Scans new liquidity pools across chains in real time using GeckoTerminal. Filters by liquidity, age, and volume to surface newly launched tokens.",
      author: "Provance",
      downloads: "4.7K",
      rating: 4.6,
      icon: "/icons/agents/geckoterminal.svg",
      version: "1.0.0",
      category: "DeFi Data",
      identifier: "provance.geckoterminal-agent",
      publishedAt: "1 month ago",
      lastReleased: "2 days ago",
      url: `${NODES_URL}/geckoterminal`,
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
         "Real-time new pool detection",
         "Multi-chain support",
         "Liquidity and volume filtering",
         "Structured token output",
      ],
      actions: [
         {
            key: "new_pools",
            label: "New Pools",
            description:
               "Scan newly launched liquidity pools filtered by chain, liquidity, and age.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "chain",
                        label: "Chain",
                        type: "select",
                        options: [
                           "base",
                           "ethereum",
                           "bsc",
                           "arbitrum",
                           "polygon",
                           "goat",
                           "stellar",
                        ],
                     },
                     {
                        key: "min_liquidity_usd",
                        label: "Min liquidity (USD)",
                        type: "number",
                        placeholder: "10000",
                     },
                     {
                        key: "max_age_minutes",
                        label: "Max age (minutes)",
                        type: "number",
                        placeholder: "2880",
                     },
                     {
                        key: "limit",
                        label: "Max results",
                        type: "number",
                        placeholder: "10",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
         {
            key: "token_info",
            label: "Token Info",
            description:
               "Get price, FDV, market cap, and top pools for a token by contract address.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "token_address",
                        label: "Token address",
                        type: "text",
                        placeholder: "0x...",
                     },
                     {
                        key: "chain",
                        label: "Chain",
                        type: "select",
                        options: [
                           "base",
                           "ethereum",
                           "bsc",
                           "arbitrum",
                           "polygon",
                           "goat",
                           "stellar",
                        ],
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
         {
            key: "ohlcv",
            label: "OHLCV",
            description:
               "Fetch candlestick chart data for a pool over a given timeframe.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "pool_address",
                        label: "Pool address",
                        type: "text",
                        placeholder: "0x...",
                     },
                     {
                        key: "chain",
                        label: "Chain",
                        type: "select",
                        options: [
                           "base",
                           "ethereum",
                           "bsc",
                           "arbitrum",
                           "polygon",
                           "goat",
                           "stellar",
                        ],
                     },
                     {
                        key: "timeframe",
                        label: "Timeframe",
                        type: "select",
                        options: ["minute", "hour", "day"],
                     },
                     {
                        key: "aggregate",
                        label: "Candle size",
                        type: "number",
                        placeholder: "1",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
         {
            key: "trades",
            label: "Recent Trades",
            description:
               "Fetch the latest trades in a pool over the last 24 hours.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "pool_address",
                        label: "Pool address",
                        type: "text",
                        placeholder: "0x...",
                     },
                     {
                        key: "chain",
                        label: "Chain",
                        type: "select",
                        options: [
                           "base",
                           "ethereum",
                           "bsc",
                           "arbitrum",
                           "polygon",
                           "goat",
                           "stellar",
                        ],
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
         {
            key: "trending_pools",
            label: "Trending Pools",
            description:
               "Get the top trending pools on a chain by volume or transaction count.",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "chain",
                        label: "Chain",
                        type: "select",
                        options: [
                           "base",
                           "ethereum",
                           "bsc",
                           "arbitrum",
                           "polygon",
                           "goat",
                           "stellar",
                        ],
                     },
                     {
                        key: "order",
                        label: "Sort by",
                        type: "select",
                        options: ["h24_volume_usd_desc", "h24_tx_count_desc"],
                     },
                     {
                        key: "limit",
                        label: "Max results",
                        type: "number",
                        placeholder: "10",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
      config: [
         {
            key: "parameters",
            label: "Parameters",
            fields: [
               {
                  key: "chain",
                  label: "Chain",
                  type: "select",
                  options: ["base", "ethereum", "bsc", "arbitrum", "polygon", "goat", "stellar"],
               },
               {
                  key: "min_liquidity_usd",
                  label: "Min liquidity (USD)",
                  type: "number",
                  placeholder: "10000",
               },
               {
                  key: "max_age_minutes",
                  label: "Max token age (minutes)",
                  type: "number",
                  placeholder: "2880",
               },
               {
                  key: "limit",
                  label: "Max tokens to return",
                  type: "number",
                  placeholder: "10",
               },
            ],
         },
         SETTINGS_CONFIG,
      ],
   },
   // ── Core triggers ──────────────────────────────────────────────────────────
   {
      id: "manual",
      nodeType: "trigger",
      label: "Trigger manually",
      description:
         "Run the workflow on demand by clicking Execute workflow on the canvas",
      icon: "/icons/triggers/manual-cursor.svg",
      author: "Provance",
      version: "1.0.0",
      category: "Core",
      identifier: "provance.trigger.manual",
      downloads: "-",
      rating: 5,
      features: [],
      publishedAt: "-",
      lastReleased: "-",
      url: `${NODES_URL}/core/trigger`,
      outputs: [{ key: "triggered_at", label: "Triggered at" }],
      config: [],
      actions: [
         {
            key: "manual",
            label: "Trigger manually",
            description: "Run the workflow on demand by clicking Execute workflow on the canvas",
            config: [SETTINGS_CONFIG],
         },
      ],
   },
   {
      id: "schedule",
      nodeType: "trigger",
      label: "On a schedule",
      description:
         "Run the workflow every day, hour, minute, or on a custom cron expression",
      icon: "/icons/triggers/clock.svg",
      author: "Provance",
      version: "1.0.0",
      category: "Core",
      identifier: "provance.trigger.schedule",
      downloads: "-",
      rating: 5,
      features: [],
      publishedAt: "-",
      lastReleased: "-",
      url: `${NODES_URL}/core/trigger`,
      outputs: [
         { key: "triggered_at", label: "Triggered at" },
         { key: "cron", label: "Cron expression" },
      ],
      config: [],
      actions: [
         {
            key: "schedule",
            label: "On a schedule",
            description: "Run the workflow every day, hour, minute, or on a custom cron expression",
            config: [
               {
                  key: "parameters",
                  label: "Parameters",
                  fields: [
                     {
                        key: "interval",
                        label: "Every",
                        type: "number",
                        placeholder: "5",
                     },
                     {
                        key: "unit",
                        label: "Unit",
                        type: "select",
                        options: ["minutes", "hours", "days"],
                     },
                     {
                        key: "cron",
                        label: "Custom cron (optional)",
                        type: "text",
                        placeholder: "0 * * * *",
                     },
                  ],
               },
               SETTINGS_CONFIG,
            ],
         },
      ],
   },
   {
      id: "webhook",
      nodeType: "trigger",
      label: "On webhook call",
      description:
         "Run the workflow when an HTTP POST request hits your workflow endpoint",
      icon: "/icons/triggers/webhook.svg",
      author: "Provance",
      version: "1.0.0",
      category: "Core",
      identifier: "provance.trigger.webhook",
      downloads: "-",
      rating: 5,
      features: [],
      publishedAt: "-",
      lastReleased: "-",
      url: `${NODES_URL}/core/trigger`,
      outputs: [
         { key: "triggered_at", label: "Triggered at" },
         { key: "payload", label: "Request payload" },
      ],
      config: [],
      actions: [
         {
            key: "webhook",
            label: "On webhook call",
            description: "Run the workflow when an HTTP POST request hits your workflow endpoint",
            config: [SETTINGS_CONFIG],
         },
      ],
   },
];

export const TRIGGERS = AGENTS.filter((a) => a.nodeType === "trigger");

class AgentService {
   getById(id: string): Agent | undefined {
      return AGENTS.find((a) => a.id === id);
   }

   getAll(): Agent[] {
      return AGENTS.filter((a) => a.nodeType === "agent");
   }

   getTriggers(): Agent[] {
      return TRIGGERS;
   }

   async run(
      agentId: string,
      actionKey: string | undefined,
      input: Record<string, unknown>,
      payment?: { permit: import("@/lib/engine/types").PermitSignature; runId: string; callIndex: number },
   ): Promise<Record<string, unknown>> {
      const agent = this.getById(agentId);
      if (!agent) throw new Error(`No agent registered with id: "${agentId}"`);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (payment) {
         headers["x-payment"] = btoa(JSON.stringify(payment.permit));
         headers["x-payment-run-id"] = payment.runId;
         headers["x-payment-index"] = String(payment.callIndex);
      }

      const res = await fetch(`${agent.url}/run`, {
         method: "POST",
         headers,
         body: JSON.stringify({ action: actionKey, ...input }),
      });

      if (res.status === 402) {
         const body = await res.json() as { error?: string };
         throw new Error(`Payment required for "${agentId}" — ${body.error ?? "no payment provided"}`);
      }

      const data = await res.json() as { success: boolean; data?: Record<string, unknown>; error?: string; message?: string };
      if (!data.success)
         throw new Error(data.error ?? data.message ?? `Agent "${agentId}" returned an error`);
      return (data.data ?? {}) as Record<string, unknown>;
   }
}

export const agentService = new AgentService();
