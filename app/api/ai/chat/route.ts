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
interface CanvasEdge { id: string; source: string; target: string }
interface Canvas { nodes: CanvasNode[]; edges: CanvasEdge[] }
interface LogEntry { time: string; message: string; level?: string }

function buildSystemPrompt(canvas: Canvas, logs: LogEntry[]): string {
  const nodeLines = canvas?.nodes?.length
    ? canvas.nodes.map((n) => {
        if (n.type === "trigger") return `- [Trigger] id="${n.id}"`;
        const agent = agentService.getById(n.nodeId);
        const params = (n.config?.parameters ?? {}) as Record<string, string>;
        const configStr = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(", ");
        return `- [Agent] ${agent?.label ?? n.nodeId} id="${n.id}"${configStr ? ` [${configStr}]` : ""}`;
      })
    : ["Canvas is empty."];

  const edgeLines = canvas?.edges?.length
    ? canvas.edges.map((e) => `- "${e.source}" → "${e.target}"`)
    : ["No connections."];

  const logsStr = logs?.slice(-10).map((l) => `[${l.time}] ${l.message}`).join("\n") || "No logs.";

  return `You are the Provance workflow assistant. Help users build, debug, and improve their AI agent workflows.

You can answer questions AND mutate the canvas using tools. When asked to add/connect/configure/remove nodes, call the appropriate tool.

Available agents: dexscreener, goplus, honeypot, ai-decision, telegram.

CANVAS:
${nodeLines.join("\n")}

CONNECTIONS:
${edgeLines.join("\n")}

RECENT LOGS:
${logsStr}

Be concise and direct.`;
}

export async function POST(req: Request) {
  const { messages, canvas, logs } = await req.json() as {
    messages: UIMessage[];
    canvas: Canvas;
    logs: LogEntry[];
  };

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
          agentId: z.enum(["dexscreener", "goplus", "honeypot", "ai-decision", "telegram"]),
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
