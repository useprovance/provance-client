import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";

const PROTECTED = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("provance_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/", request.url));

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.redirect(new URL("/", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
