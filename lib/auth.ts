import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE = "provance_session";
const TTL = 60 * 60 * 24 * 7; // 7 days in seconds

export type SessionUser = {
   id: string;
   name: string;
   email: string | null;
   avatar_url: string | null;
   provider: string;
   onboarded: boolean;
};

export async function createSessionToken(user: SessionUser): Promise<string> {
   return new SignJWT({ user })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${TTL}s`)
      .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
   try {
      const { payload } = await jwtVerify(token, SECRET);
      return payload.user as SessionUser;
   } catch {
      return null;
   }
}

export async function getSession(): Promise<SessionUser | null> {
   const cookieStore = await cookies();
   const token = cookieStore.get(COOKIE)?.value;
   if (!token) return null;
   return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
   const cookieStore = await cookies();
   cookieStore.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TTL,
      path: "/",
   });
}

export async function clearSessionCookie() {
   const cookieStore = await cookies();
   cookieStore.delete(COOKIE);
}
