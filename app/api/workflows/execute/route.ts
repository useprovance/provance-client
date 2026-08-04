import { NextRequest, NextResponse } from "next/server";
import { executeWorkflow } from "@/lib/engine/executor";
import type { WorkflowCanvas } from "@/lib/engine/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowId, canvas } = body as {
      workflowId: string;
      canvas: WorkflowCanvas;
    };

    if (!workflowId || !canvas) {
      return NextResponse.json(
        { success: false, error: "Missing workflowId or canvas" },
        { status: 400 }
      );
    }

    if (canvas.nodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Workflow has no nodes" },
        { status: 400 }
      );
    }

    const run = await executeWorkflow(workflowId, canvas);

    return NextResponse.json({ success: true, data: run });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
