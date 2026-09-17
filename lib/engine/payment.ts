import { agentService } from "@/services/agent.service";
import type { EngineCanvas, EngineNode } from "./types";

export interface PaymentNode {
  nodeId: string;      // React Flow node id
  agentId: string;
  label: string;
  actionKey: string;
  actionLabel: string;
  price: number;
  agentWallet: string;
}

export interface ChainPayment {
  chainId: number;
  token: string;           // e.g. "USDCe"
  tokenAddress: string;    // ERC-20 contract address
  total: number;           // sum of all node prices on this chain
  nodes: PaymentNode[];
}

export interface WorkflowPaymentPlan {
  /** true if any paid nodes exist */
  requiresPayment: boolean;
  /** total across all chains (for display only — not a real single-chain number) */
  totalUsd: number;
  /** one entry per unique (chainId, token) pair */
  chains: ChainPayment[];
}

// Walk upstream from a node and return the nearest `limit` config value found.
// This tells us how many items (and therefore paid calls) to expect.
function estimateIterations(node: EngineNode, canvas: EngineCanvas): number {
  const parentEdges = canvas.edges.filter((e) => e.target === node.id);
  for (const edge of parentEdges) {
    const parent = canvas.nodes.find((n) => n.id === edge.source);
    if (!parent) continue;
    const limit = parent.config?.parameters?.limit;
    if (limit) {
      const n = parseInt(limit, 10);
      if (!isNaN(n) && n > 0) return n;
    }
    // recurse one level up
    const grandparentLimit = estimateIterations(parent, canvas);
    if (grandparentLimit > 1) return grandparentLimit;
  }
  return 1;
}

export function calculateWorkflowPayment(canvas: EngineCanvas): WorkflowPaymentPlan {
  const chainMap = new Map<number, ChainPayment>();

  for (const node of canvas.nodes) {
    if (node.type !== "agent") continue;

    const agent = agentService.getById(node.nodeId);
    if (!agent?.payment) continue;

    const action = agent.actions?.find((a) => a.key === node.action?.key);
    if (!action?.price) continue;

    const { chainId, token, address } = agent.payment;
    const iterations = estimateIterations(node, canvas);
    const totalPrice = Math.round(action.price * iterations * 1e8) / 1e8;

    if (!chainMap.has(chainId)) {
      chainMap.set(chainId, {
        chainId,
        token,
        tokenAddress: address,
        total: 0,
        nodes: [],
      });
    }

    const chain = chainMap.get(chainId)!;
    chain.nodes.push({
      nodeId: node.id,
      agentId: node.nodeId,
      label: agent.label,
      actionKey: action.key,
      actionLabel: action.label,
      price: totalPrice,
      agentWallet: agent.payment.walletAddress ?? address,
    });
    chain.total = Math.round((chain.total + totalPrice) * 1e8) / 1e8;
  }

  const chains = Array.from(chainMap.values());
  const totalUsd = chains.reduce((sum, c) => sum + c.total, 0);

  return {
    requiresPayment: chains.length > 0,
    totalUsd: Math.round(totalUsd * 1e8) / 1e8,
    chains,
  };
}
