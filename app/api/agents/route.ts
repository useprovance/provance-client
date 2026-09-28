import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";

export async function GET() {
   const session = await getSession();
   if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

   const supabase = await createClient();
   const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("profile_id", session.id)
      .order("created_at", { ascending: false });

   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
   return NextResponse.json({ agents: data });
}

export async function POST(req: NextRequest) {
   const session = await getSession();
   if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

   const body = await req.json() as {
      name: string;
      description: string;
      icon?: string;
      repository?: string;
      url: string;
      protocol: string;
      authentication: string;
      node_type?: string;
      category?: string;
      version?: string;
      identifier?: string;
      actions?: unknown[];
      outputs?: unknown[];
      features?: string[];
   };

   if (!body.name?.trim() || !body.description?.trim() || !body.url?.trim()) {
      return NextResponse.json({ error: "Name, description and URL are required" }, { status: 400 });
   }

   const supabase = await createClient();
   const { data, error } = await supabase
      .from("agents")
      .insert({
         profile_id: session.id,
         name: body.name.trim(),
         description: body.description.trim(),
         icon: body.icon ?? null,
         repository: body.repository ?? null,
         url: body.url.trim(),
         protocol: body.protocol ?? "https",
         authentication: body.authentication ?? "api_key",
         node_type: body.node_type ?? "agent",
         category: body.category ?? null,
         version: body.version ?? "1.0.0",
         identifier: body.identifier ?? null,
         actions: body.actions ?? [],
         outputs: body.outputs ?? [],
         features: body.features ?? [],
      })
      .select()
      .single();

   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
   return NextResponse.json({ agent: data });
}
