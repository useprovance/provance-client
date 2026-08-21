import {
   convertToModelMessages,
   createUIMessageStreamResponse,
   isStepCount,
   streamText,
   toUIMessageStream,
   type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { agentService } from "@/services/agent.service";

export const maxDuration = 60;

interface CanvasNode {
   id: string;
   nodeId: string;
   type: string;
   position: { x: number; y: number };
   action?: { key: string; label: string };
   config?: Record<string, unknown>;
}
interface CanvasEdge {
   id: string;
   source: string;
   target: string;
}
interface Canvas {
   nodes: CanvasNode[];
   edges: CanvasEdge[];
}
interface LogEntry {
   time: string;
   message: string;
   level?: string;
}

function buildSystemPrompt(canvas: Canvas, logs: LogEntry[]): string {
   const nodeLines = canvas?.nodes?.length
      ? canvas.nodes.map((n) => {
           if (n.type === "trigger") return `- [Trigger] id="${n.id}"`;
           const agent = agentService.getById(n.nodeId);
           const params = (n.config?.parameters ?? {}) as Record<string, string>;
           const links = (n.config?.__links ?? {}) as Record<string, string>;
           const configStr = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(", ");
           const linksStr = Object.entries(links).map(([k, v]) => `${k}→${v}`).join(", ");
           const parts = [configStr, linksStr ? `links: ${linksStr}` : ""].filter(Boolean).join(" | ");
           const actionStr = n.action?.key ? ` action="${n.action.key}"` : "";
           return `- [Agent] ${agent?.label ?? n.nodeId}${actionStr} id="${n.id}"${parts ? ` [${parts}]` : ""}`;
        })
      : ["Canvas is empty."];

   const edgeLines = canvas?.edges?.length
      ? canvas.edges.map((e) => `- "${e.source}" → "${e.target}"`)
      : ["No connections."];

   const logsStr =
      logs
         ?.slice(-10)
         .map((l) => `[${l.time}] ${l.message}`)
         .join("\n") || "No logs.";

   return `You are the Provance workflow assistant. Help users build, debug, and improve their AI agent workflows.

You can answer questions AND mutate the canvas using tools. When asked to add/connect/configure/remove nodes, call the appropriate tool.

When building a workflow with multiple nodes:
1. Call add_node for each agent in order (left to right). Each call returns the new node's id.
2. After all nodes are added, call connect_nodes to link them in sequence using the returned ids.
3. The canvas positions nodes automatically left to right — do not skip the connect step.

When configuring a node, pass static values normally. If a param should receive its value from an upstream node's output, pass "sourceNodeId::outputKey" as the value instead — the UI will render it as a linked field automatically. Only link fields that match the same data (e.g. token_address → token_address). Never pass "<dynamic>" or placeholder strings.

For message template fields (e.g. Telegram message), embed variables using the format {{nodeId::outputKey}}. Use the node IDs from the canvas and the output keys from the agent catalog. Example: if DexScreener node id is "abc123" and you want its token name, write {{abc123::name}}. Never use plain {{variable}} without the node ID.

Available agents and triggers (always pass actionKey when calling add_node):
${[...agentService.getTriggers(), ...agentService.getAll()].map((a) => {
  const outputs = a.outputs?.map((o: { key: string }) => o.key).join(", ") ?? "";
  const actions = (a.actions ?? []).map((action) => {
    const fields = action.config.find((c) => c.key === "parameters")?.fields ?? [];
    const params = fields.map((f) => {
      const opts = f.type === "select" && f.options?.length ? ` [${f.options.join("|")}]` : "";
      return `${f.key}${opts}`;
    }).join(", ");
    return `    - ${action.key} (${action.label})${params ? `: ${params}` : ""}`;
  }).join("\n");
  return `- ${a.id}: ${a.label} — ${a.description}\n  actions:\n${actions}${outputs ? `\n  outputs: ${outputs}` : ""}`;
}).join("\n")}

CANVAS:
${nodeLines.join("\n")}

CONNECTIONS:
${edgeLines.join("\n")}

RECENT LOGS:
${logsStr}

Be concise and direct.`;
}

export async function POST(req: Request) {
   const { messages, canvas, logs } = await req.json();

   const agentIds = [...agentService.getTriggers(), ...agentService.getAll()].map((a) => a.id);

   const result = streamText({
      model: openai("gpt-4o"),
      system: buildSystemPrompt(canvas, logs),
      messages: await convertToModelMessages(messages),
      temperature: 0.4,
      maxOutputTokens: 1024,
      stopWhen: isStepCount(5),
      onStepFinish({ text, toolCalls }) {
         if (toolCalls?.length) {
            console.log("\n[AI] Tool calls:");
            for (const tc of toolCalls) {
               console.log(`  → ${tc.toolName}`, JSON.stringify(tc.input, null, 4));
            }
         }
         if (text) console.log(`\n[AI] Text: ${text}`);
      },
      tools: {
         add_node: {
            description: "Add an agent node to the workflow canvas. Always pass the actionKey from the agent's actions list.",
            inputSchema: z.object({
               agentId: z.enum(agentIds),
               actionKey: z.string().describe("The action key to use — must match one of the agent's defined action keys"),
            }),
         },
         connect_nodes: {
            description: "Connect two nodes with an edge.",
            inputSchema: z.object({
               sourceId: z.string(),
               targetId: z.string(),
            }),
         },
         configure_node: {
            description: "Set configuration parameters on a node.",
            inputSchema: z.object({
               nodeId: z.string(),
               params: z.record(z.string(), z.union([z.string(), z.number()]).transform(String)),
            }),
         },
         remove_node: {
            description: "Remove a node from the canvas.",
            inputSchema: z.object({
               nodeId: z.string(),
            }),
         },
      },
   });

   return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
   });
}
