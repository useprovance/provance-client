import { agentService } from "@/services/agent.service";

export async function callAgent(
  agentId: string,
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const agent = agentService.getById(agentId);
  if (!agent) throw new Error(`No agent registered with id: "${agentId}"`);

  const res = await fetch(`${agent.url}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error ?? `Agent "${agentId}" returned an error`);
  }

  return data.data as Record<string, unknown>;
}
