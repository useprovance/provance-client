import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
   const session = await getSession();
   if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

   const supabase = await createClient();
   const { data, error } = await supabase
      .from("orgs")
      .select("id, name")
      .eq("owner_id", session.id)
      .order("created_at", { ascending: true });

   if (error) {
      logger.error("GET /api/orgs", "Supabase query failed", error);
      console.error("[GET /api/orgs] full error:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
   }

   logger.info("GET /api/orgs", `returned ${data?.length ?? 0} orgs`);
   return NextResponse.json({ orgs: data ?? [] });
}
