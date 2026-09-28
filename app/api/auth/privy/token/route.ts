import { NextResponse } from "next/server";
import { createSign } from "crypto";
import fs from "fs";
import { getSession } from "@/lib/auth";

function base64UrlEncode(input: Buffer | string): string {
   const buf = typeof input === "string" ? Buffer.from(input) : input;
   return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function loadPrivateKey(): string {
   const keyContent = process.env.PRIVY_JWT_PRIVATE_KEY;
   if (keyContent) return keyContent.replace(/\\n/g, "\n");
   const keyPath = process.env.PRIVY_JWT_PRIVATE_KEY_PATH;
   if (keyPath) return fs.readFileSync(keyPath, "utf8");
   throw new Error("Neither PRIVY_JWT_PRIVATE_KEY nor PRIVY_JWT_PRIVATE_KEY_PATH is set");
}

function createPrivyToken(profile: { id: string; email: string | null; name: string }): string {
   const privateKey = loadPrivateKey();
   const now = Math.floor(Date.now() / 1000);

   const header = {
      alg: "RS256",
      typ: "JWT",
      kid: process.env.PRIVY_JWT_KID,
   };

   const payload = {
      sub: profile.id,
      email: profile.email ?? "",
      name: profile.name,
      iss: process.env.PRIVY_JWT_ISSUER,
      aud: process.env.PRIVY_JWT_AUDIENCE,
      iat: now,
      exp: now + 60 * 5,
   };

   const encodedHeader = base64UrlEncode(JSON.stringify(header));
   const encodedPayload = base64UrlEncode(JSON.stringify(payload));
   const signingInput = `${encodedHeader}.${encodedPayload}`;

   const signer = createSign("RSA-SHA256");
   signer.update(signingInput);
   signer.end();
   const signature = signer.sign(privateKey);

   return `${signingInput}.${base64UrlEncode(signature)}`;
}

export async function GET() {
   const user = await getSession();

   if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
   }

   if (user.provider === "wallet") {
      return NextResponse.json({ error: "Privy not available for wallet accounts" }, { status: 400 });
   }

   const token = createPrivyToken({ id: user.id, email: user.email, name: user.name });
   return NextResponse.json({ token });
}
