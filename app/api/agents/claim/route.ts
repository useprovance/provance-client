import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getSession } from "@/lib/auth";
import { recoverMessageAddress } from "viem";

const SCAN_API = "https://api.8004scan.io/api/v1";

const CHAIN_SLUGS: Record<string, string> = {
  ethereum: "1", eth: "1",
  base: "8453",
  celo: "42220",
  polygon: "137", matic: "137",
  optimism: "10", op: "10",
  arbitrum: "42161", arb: "42161",
  bsc: "56",
  gnosis: "100",
  goat: "2345",
};

function parseInput(input: string): { chainId: string; tokenId: string } | null {
  // URL: https://8004scan.io/agents/celo/9173
  const urlMatch = input.match(/8004scan\.io\/agents\/([^/?#]+)\/(\d+)/);
  if (urlMatch) {
    const chainId = CHAIN_SLUGS[urlMatch[1].toLowerCase()] ?? urlMatch[1];
    return { chainId, tokenId: urlMatch[2] };
  }
  // Full agent_id: 42220:0xabc:9173
  const colonParts = input.split(":");
  if (colonParts.length >= 3) {
    return { chainId: colonParts[0], tokenId: colonParts[colonParts.length - 1] };
  }
  // celo/9173 or 42220/9173
  const slashMatch = input.match(/^([a-zA-Z0-9]+)\/(\d+)$/);
  if (slashMatch) {
    const chainId = CHAIN_SLUGS[slashMatch[1].toLowerCase()] ?? slashMatch[1];
    return { chainId, tokenId: slashMatch[2] };
  }
  return null;
}

function claimMessage(agent_id: string) {
  return `Claim agent ${agent_id} on Provance.`;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("agent_id")?.trim();
  if (!raw) return NextResponse.json({ error: "agent_id required" }, { status: 400 });

  const parsed = parseInput(raw);
  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse agent ID. Paste the 8004scan URL or use the format celo/9173." },
      { status: 400 }
    );
  }

  const { chainId, tokenId } = parsed;

  const res = await fetch(`${SCAN_API}/agents/${chainId}/${tokenId}`, {
    headers: { "Accept": "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Agent not found on 8004scan" }, { status: 404 });
  }

  const agent = await res.json() as { agent_id: string };
  return NextResponse.json({ agent, message: claimMessage(agent.agent_id) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { agent_id, signature } = await req.json() as { agent_id?: string; signature?: string };
  if (!agent_id || !signature) {
    return NextResponse.json({ error: "agent_id and signature required" }, { status: 400 });
  }

  const parsed = parseInput(agent_id);
  if (!parsed) return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  const { chainId, tokenId } = parsed;

  const scanRes = await fetch(`${SCAN_API}/agents/${chainId}/${tokenId}`, {
    headers: { "Accept": "application/json" },
    next: { revalidate: 0 },
  });
  if (!scanRes.ok) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const agent = await scanRes.json() as {
    agent_id: string;
    owner_address: string;
    name: string | null;
    description: string | null;
    image_url: string | null;
    mcp_server: string | null;
    a2a_endpoint: string | null;
    agent_url: string | null;
    supported_protocols: string[];
    categories: string[];
    tags: string[];
  };

  const signer = await recoverMessageAddress({
    message: claimMessage(agent_id),
    signature: signature as `0x${string}`,
  });

  if (signer.toLowerCase() !== agent.owner_address.toLowerCase()) {
    return NextResponse.json({ error: "Signature does not match the agent owner" }, { status: 403 });
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", session.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: `Profile not found for session ID: ${session.id}` },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("agents")
    .select("id")
    .eq("identifier", agent.agent_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "This agent has already been claimed" }, { status: 409 });
  }

  const url = agent.mcp_server ?? agent.a2a_endpoint ?? agent.agent_url ?? "";
  const protocol = (agent.supported_protocols[0] ?? "https").toLowerCase();

  const { data, error } = await supabase
    .from("agents")
    .insert({
      profile_id: session.id,
      name: agent.name ?? "Unnamed Agent",
      description: agent.description ?? "",
      icon: agent.image_url ?? null,
      url,
      protocol,
      authentication: "none",
      node_type: "agent",
      category: agent.categories[0] ?? null,
      version: "1.0.0",
      identifier: agent.agent_id,
      actions: [],
      outputs: [],
      features: agent.tags ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}
