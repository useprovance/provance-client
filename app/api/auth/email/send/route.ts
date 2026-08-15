import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
   try {
      const { email } = await req.json() as { email: string };
      if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const supabase = await createClient();

      // Invalidate any existing unused OTPs for this email
      await supabase.from("email_otps").update({ used: true }).eq("email", email).eq("used", false);

      // Store new OTP
      const { error: insertErr } = await supabase.from("email_otps").insert({
         email,
         code,
         expires_at: expiresAt.toISOString(),
      });

      if (insertErr) {
         console.error("[email/send] insert error", insertErr);
         return NextResponse.json({ error: "Could not generate code" }, { status: 500 });
      }

      // Send email
      const { error: sendErr } = await resend.emails.send({
         from: "Provance <noreply@useprovance.xyz>",
         to: email,
         subject: "Your Provance login code",
         html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0e0e0e;color:#f5e6c8;border-radius:12px">
               <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:2px">Provance</h2>
               <p style="margin:0 0 24px;font-size:13px;color:#f5e6c880">Your one-time login code</p>
               <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
                  <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#f5e6c8">${code}</span>
               </div>
               <p style="margin:0;font-size:12px;color:#f5e6c840">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
            </div>
         `,
      });

      if (sendErr) {
         console.error("[email/send] resend error", JSON.stringify(sendErr));
         return NextResponse.json({ error: "Could not send email", detail: sendErr }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
   } catch (err) {
      console.error("[email/send] error", err);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
   }
}
