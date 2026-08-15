import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const session = await getSession();
   if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

   const { id } = await params;
   const supabase = await createClient();

   const { error } = await supabase
      .from("wallets")
      .delete()
      .eq("id", id)
      .eq("owner_id", session.id);

   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
   return NextResponse.json({ ok: true });
}
