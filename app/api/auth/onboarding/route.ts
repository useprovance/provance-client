import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSession, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
   try {
      const session = await getSession();
      if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

      const { name, org_name } = await req.json() as { name: string; org_name: string };

      if (!name?.trim() || !org_name?.trim()) {
         return NextResponse.json({ error: "Name and org name are required" }, { status: 400 });
      }

      const supabase = await createClient();

      // Update profile name
      const { error: profileErr } = await supabase
         .from("profiles")
         .update({ name: name.trim() })
         .eq("id", session.id);

      if (profileErr) {
         console.error("[onboarding] profile update error", profileErr);
         return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
      }

      // Create org
      const { error: orgErr } = await supabase
         .from("orgs")
         .insert({ name: org_name.trim(), owner_id: session.id });

      if (orgErr) {
         console.error("[onboarding] org create error", orgErr);
         return NextResponse.json({ error: "Could not create org" }, { status: 500 });
      }

      // Re-issue session with updated name and onboarded flag
      const updatedSession = { ...session, name: name.trim(), onboarded: true };
      const token = await createSessionToken(updatedSession);
      await setSessionCookie(token);

      return NextResponse.json({ user: updatedSession });
   } catch (err) {
      console.error("[onboarding] error", err);
      return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
   }
}
