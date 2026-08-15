import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSession, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
   const session = await getSession();
   if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

   const { name } = await req.json() as { name: string };
   if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

   const supabase = await createClient();
   const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", session.id);

   if (error) return NextResponse.json({ error: error.message }, { status: 500 });

   const updated = { ...session, name: name.trim() };
   const token = await createSessionToken(updated);
   await setSessionCookie(token);

   return NextResponse.json({ ok: true, user: updated });
}
