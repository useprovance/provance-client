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
           const params = (n.config?.parameters ?? {}) as Record<
              string,
              string
           >;
           const configStr = Object.entries(params)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ");
           return `- [Agent] ${agent?.label ?? n.nodeId} id="${n.id}"${configStr ? ` [${configStr}]` : ""}`;
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

Available agents:
${agentService.getAll().map((a) => {
  const fields = a.config.find((c) => c.key === "parameters")?.fields ?? [];
  const params = fields.map((f) => {
    const opts = f.type === "select" && f.options?.length ? ` [${f.options.join("|")}]` : "";
    return `${f.key}${opts}`;
  }).join(", ");
  return `- ${a.id}: ${a.label} — ${a.description}${params ? `\n  params: ${params}` : ""}`;
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

   const agentIds = agentService.getAll().map((a) => a.id);

   const result = streamText({
      model: openai("gpt-4o"),
      system: buildSystemPrompt(canvas, logs),
      messages: await convertToModelMessages(messages),
      temperature: 0.4,
      maxOutputTokens: 1024,
      stopWhen: isStepCount(5),
      tools: {
         add_node: {
            description: "Add an agent node to the workflow canvas.",
            inputSchema: z.object({
               agentId: z.enum(agentIds),
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
               params: z.record(z.string(), z.string()),
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
