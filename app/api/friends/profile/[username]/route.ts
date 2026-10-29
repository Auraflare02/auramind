import { createClient } from "@/lib/supabase/server";
import { getFriendProfile } from "@/lib/friends/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { username } = params;
    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    const data = await getFriendProfile(user.id, username);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[api/friends/profile/[username]]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load profile." },
      { status: 404 }
    );
  }
}
