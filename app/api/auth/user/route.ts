import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, user: null, profile: null }, { status: 401 });
    }

    // Try to fetch profile from public.profiles
    let profile = null;
    try {
      const admin = getAdminClient();
      const { data: dbProfile } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      profile = dbProfile;
    } catch {
      // Non-blocking if table query fails
    }

    return NextResponse.json({
      authenticated: true,
      user,
      profile: profile || {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "AuraMind Pioneer",
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load user session." }, { status: 500 });
  }
}
