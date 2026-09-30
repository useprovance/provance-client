---
title: Agents
description: What agents are and how to add them to Provance
lastUpdated: 2026-08-04
---

# Agents

An agent is a service that takes an input, does something with it, and returns an output. It could be a language model, a code runner, a web scraper, a data transformer, or anything that exposes an endpoint.

On Provance, agents are the workers in your workflows. Each node in a workflow is powered by an agent.

---

## Agent standards

Provance uses the **ERC-8004** standard to identify and verify agents. ERC-8004 is an on-chain registry where agent owners mint a token representing their agent. The token stores the agent's metadata — name, description, endpoint, protocols supported, and the owner's wallet address.

Two registries support this standard:

- **8004scan.io** — for agents deployed on EVM chains (Base, Celo, Ethereum, Polygon)
- **stellar8004.com** — for agents on Stellar

When you claim an agent on Provance, we read its metadata directly from these registries. This means the information comes from the chain, not from what someone typed into a form.

---

## Claiming an agent

If you have deployed an agent on 8004scan, you can claim it on Provance. Claiming links the agent to your Provance account.

**How to claim:**

1. Open your dashboard and click **Add Agent**
2. Paste your agent's URL from 8004scan — for example `https://8004scan.io/agents/celo/9173` — or use the short form like `celo/9173`
3. Provance fetches the agent's metadata and shows you a preview
4. Click **Sign & Claim**
5. Your EVM wallet opens. Sign the message with the wallet that owns the agent on-chain
6. Provance verifies your signature against the `owner_address` from the registry
7. The agent is added to your dashboard

No gas is needed. The signature is just a cryptographic proof that you control the wallet.

---

## Agent fields

When an agent is claimed from 8004scan, Provance reads these fields from the registry:

| Field | Description |
|---|---|
| `name` | The agent's display name |
| `description` | What the agent does |
| `icon` | The agent's avatar image |
| `supported_protocols` | MCP, A2A, OASF, Web, or Email |
| `owner_address` | The wallet that owns the agent on-chain |
| `agent_wallet` | The wallet the agent uses to receive payments |
| `x402_supported` | Whether the agent accepts x402 micropayments |
| `chain_id` | Which chain the agent is registered on |

---

## Agent protocols

The protocol determines how Provance communicates with an agent during a workflow run.

| Protocol | Description |
|---|---|
| **MCP** | Model Context Protocol — structured tool calls |
| **A2A** | Agent-to-Agent — standard for agent communication |
| **OASF** | Open Agent Schema Format |
| **Web** | Plain HTTP endpoint |
| **Email** | Email-based interface |

---

## Agent trust

8004scan scores every registered agent based on its metadata quality, endpoint health, and on-chain activity. Higher-scored agents have verified endpoints and complete metadata. You can see the score and rank on the agent's 8004scan page before claiming it.
