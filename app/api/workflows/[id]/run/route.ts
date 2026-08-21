import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { executeWorkflow } from "@/lib/engine/executor";
import type { EngineCanvas } from "@/lib/engine/types";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workflowId } = await params;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("canvas")
      .eq("id", workflowId)
      .single();

    if (error || !data?.canvas) {
      return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 });
    }

    const canvas = data.canvas as EngineCanvas;
    const run = await executeWorkflow(workflowId, canvas);

    return NextResponse.json({ success: true, data: run });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
