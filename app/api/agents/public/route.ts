import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
   const supabase = await createClient();
   const { data, error } = await supabase
      .from("agents")
      .select("id, name, description, icon, category, version, node_type, features")
      .order("created_at", { ascending: false });

   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
   return NextResponse.json({ agents: data ?? [] });
}
