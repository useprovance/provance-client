import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";

export async function GET() {
   const session = await getSession();
   if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

   const supabase = await createClient();
   const { data, error } = await supabase
      .from("orgs")
      .select("id, name")
      .eq("owner_id", session.id)
      .order("created_at", { ascending: true });

   if (error) return NextResponse.json({ error: error.message }, { status: 500 });

   return NextResponse.json({ orgs: data ?? [] });
}
