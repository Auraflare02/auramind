import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { ensureProfileIdentity, updatePrivacySettings } from "@/lib/friends/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: rawProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!rawProfile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const publicProfile = await ensureProfileIdentity(rawProfile);
    return NextResponse.json({ profile: publicProfile });
  } catch (err: any) {
    console.error("[api/friends/settings GET]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load settings." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await updatePrivacySettings(user.id, body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/friends/settings POST]", err);
    return NextResponse.json(
      { error: err.message || "Failed to update settings." },
      { status: 400 }
    );
  }
}
