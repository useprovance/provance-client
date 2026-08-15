import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
   try {
      const { email, code } = await req.json() as { email: string; code: string };
      if (!email?.trim() || !code?.trim()) {
         return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
      }

      const supabase = await createClient();

      // Find valid OTP
      const { data: otp, error: otpErr } = await supabase
         .from("email_otps")
         .select("*")
         .eq("email", email)
         .eq("code", code.trim())
         .eq("used", false)
         .gte("expires_at", new Date().toISOString())
         .single();

      if (otpErr || !otp) {
         return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
      }

      // Mark OTP as used
      await supabase.from("email_otps").update({ used: true }).eq("id", otp.id);

      // Find or create profile
      const { data: existing } = await supabase
         .from("profiles")
         .select("*")
         .eq("email", email)
         .single();

      const isNewUser = !existing;
      let profile = existing;

      if (!profile) {
         const { data: created, error: createErr } = await supabase
            .from("profiles")
            .insert({ name: email.split("@")[0], email, provider: "email" })
            .select()
            .single();

         if (createErr || !created) {
            console.error("[email/verify] profile create error", createErr);
            return NextResponse.json({ error: "Could not create profile" }, { status: 500 });
         }
         profile = created;
      }

      const token = await createSessionToken({
         id: profile.id,
         name: profile.name,
         email: profile.email,
         avatar_url: profile.avatar_url,
         provider: profile.provider,
         onboarded: !isNewUser,
      });

      await setSessionCookie(token);

      return NextResponse.json({
         ok: true,
         redirect: isNewUser ? "/auth/onboarding" : "/dashboard",
      });
   } catch (err) {
      console.error("[email/verify] error", err);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
   }
}
