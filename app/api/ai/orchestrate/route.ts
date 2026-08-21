import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { agentService } from "@/services/agent.service";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { sourceOutput, targetAgentId, actionKey } = await req.json() as {
      sourceOutput: Record<string, unknown>;
      targetAgentId: string;
      actionKey?: string;
    };

    const agent = agentService.getById(targetAgentId);
    if (!agent) {
      return NextResponse.json({ success: false, error: `Agent "${targetAgentId}" not found` }, { status: 404 });
    }

    const action = (actionKey ? agent.actions?.find((a) => a.key === actionKey) : undefined) ?? agent.actions?.[0];
    const paramFields = action?.config?.find((c) => c.key === "parameters")?.fields ?? [];
    if (paramFields.length === 0) {
      return NextResponse.json({ success: true, data: sourceOutput });
    }

    const fieldDescriptions = paramFields
      .map((f) => `- ${f.key} (${f.type})${f.placeholder ? ` — example: "${f.placeholder}"` : ""}`)
      .join("\n");

    const prompt = `You are a data orchestration layer for an AI agent workflow platform called Provance.

The previous agent in the workflow produced this output:
${JSON.stringify(sourceOutput, null, 2)}

The next agent "${agent.label}" expects these input fields:
${fieldDescriptions}

Your job: extract or derive the correct values from the source output to produce a valid input object for the next agent. Only include fields the next agent expects. If a value cannot be derived, omit it.

Return ONLY a valid JSON object. No explanation, no markdown, just the JSON.`;

    const response = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0,
      },
      { timeout: 8000 },
    );

    const raw = JSON.parse(response.choices[0].message.content ?? "{}") as Record<string, unknown>;
    // Strip null/undefined — only pass fields the AI could actually derive
    const transformed = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null && v !== undefined && v !== "")
    );
    console.log(`[orchestrator] ${targetAgentId} ← AI mapped input:`, JSON.stringify(transformed, null, 2));
    return NextResponse.json({ success: true, data: transformed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[orchestrate] 500 error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
