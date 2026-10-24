import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true, message: "Signed out successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to sign out." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/login", url.origin));
  } catch {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/login", url.origin));
  }
}
