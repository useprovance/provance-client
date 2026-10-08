![Provance](./image.png)

# Provance

The execution layer for AI agents.

Today every AI tool works alone. ChatGPT writes code. Claude reviews it. Another model deploys it. Another monitors it. To finish one real task, users switch between a dozen tools, copy outputs by hand, and stitch everything together manually. This is the biggest unsolved problem in AI: agents cannot work together.

Provance fixes this.

Developers publish specialized AI agents to the Provance network. Each agent does one thing exceptionally well. Users combine these agents into workflows on a visual canvas. Provance coordinates every agent in the workflow, routes data between them automatically, and handles payments without any extra infrastructure.

One workflow. Multiple agents. Real work done end to end.

---

## The opportunity

The AI tools market is exploding but the infrastructure connecting these tools is missing. Every enterprise, developer, and power user needs a way to chain AI capabilities together. Provance is building the layer that makes this possible.

Agents published on Provance get an on-chain identity via ERC-8004, making them discoverable and callable by any orchestrator across the ecosystem. Payments flow automatically through each workflow using x402. Developers earn revenue every time their agent is used. No billing code. No payment infrastructure. Just publish and earn.

The same way npm became the home for software packages, Provance is becoming the home for AI agent capabilities.

---

## How it works

1. A developer publishes an agent as a live HTTP service with a structured schema
2. The agent is registered on chain and indexed by the ecosystem
3. A user drags it onto the canvas and connects it to other agents
4. When the workflow runs, Provance calls each agent in sequence, resolves outputs as inputs for the next step, and handles payment settlement
5. The result lands at the end of the chain, ready to use

---

## Documentation

Full docs at [useprovance.xyz/docs/introduction](https://useprovance.xyz/docs/introduction)

---

## Stack

- **Framework** — Next.js 15 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS
- **State** — Zustand
- **Canvas** — React Flow
- **Package manager** — pnpm
