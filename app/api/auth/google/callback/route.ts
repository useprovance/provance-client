import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { createClient } from "@/utils/supabase/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

const privy = new PrivyClient(
   process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
   process.env.PRIVY_APP_SECRET!
);

export async function GET(req: NextRequest) {
   try {
      const code = req.nextUrl.searchParams.get("code");

      if (!code) {
         return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth_error=no_code`);
      }

      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
            grant_type: "authorization_code",
         }),
      });

      if (!tokenRes.ok) {
         return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth_error=token_exchange`);
      }

      const { access_token } = await tokenRes.json() as { access_token: string };

      // Get user info from Google
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
         headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!userRes.ok) {
         return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth_error=user_info`);
      }

      const googleUser = await userRes.json() as {
         id: string;
         email: string;
         name: string;
         picture: string;
      };

      const supabase = await createClient();

      // Find or create profile
      const { data: existing } = await supabase
         .from("profiles")
         .select("*")
         .eq("email", googleUser.email)
         .single();

      let profile = existing;
      const isNewUser = !existing;

      if (!profile) {
         const { data: created, error } = await supabase
            .from("profiles")
            .insert({
               name: googleUser.name,
               email: googleUser.email,
               avatar_url: googleUser.picture,
               provider: "google",
            })
            .select()
            .single();

         if (error || !created) {
            console.error("[Google callback] profile create error", error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth_error=profile_create`);
         }

         profile = created;
      }

      // Create or find Privy user (no wallet)
      if (!profile.privy_id) {
         try {
            let privyId: string | null = null;

            // Check if user already exists in Privy by email
            const existingPrivyUser = await privy.getUserByEmail(googleUser.email).catch(() => null);

            if (existingPrivyUser) {
               privyId = existingPrivyUser.id;
            } else {
               const newPrivyUser = await privy.importUser({
                  linkedAccounts: [
                     {
                        type: "google_oauth",
                        subject: googleUser.id,
                        email: googleUser.email,
                        name: googleUser.name,
                     },
                  ],
                  createEthereumWallet: false,
                  createSolanaWallet: false,
               });
               privyId = newPrivyUser.id;
            }

            if (privyId) {
               await supabase
                  .from("profiles")
                  .update({ privy_id: privyId })
                  .eq("id", profile.id);
               profile = { ...profile, privy_id: privyId };
            }
         } catch (privyErr) {
            // Non-fatal: user still gets a session even if Privy sync fails
            console.error("[Google callback] Privy sync error", privyErr);
         }
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

      const dest = isNewUser ? "/auth/onboarding" : "/dashboard";
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${dest}`);
   } catch (err) {
      console.error("[Google callback error]", err);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth_error=unexpected`);
   }
}
