import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";

export async function GET() {
   const session = await getSession();
   if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

   const supabase = await createClient();
   const { data, error } = await supabase
      .from("wallets")
      .select("id, address, chain, label, created_at")
      .eq("owner_id", session.id)
      .order("created_at", { ascending: true });

   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
   return NextResponse.json({ wallets: data ?? [] });
}

export async function POST(req: NextRequest) {
   const session = await getSession();
   if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

   const { address, chain, label } = await req.json() as { address: string; chain?: string; label?: string };
   if (!address?.trim()) return NextResponse.json({ error: "Address required" }, { status: 400 });

   const supabase = await createClient();
   const { data, error } = await supabase
      .from("wallets")
      .upsert({ owner_id: session.id, address: address.toLowerCase(), chain: chain ?? "evm", label })
      .select()
      .single();

   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
   return NextResponse.json({ wallet: data });
}
