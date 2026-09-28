import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .single();

   if (error || !data) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
   return NextResponse.json({ agent: data });
}
