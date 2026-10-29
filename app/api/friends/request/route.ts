import { createClient } from "@/lib/supabase/server";
import { sendFriendRequest } from "@/lib/friends/client";
import { NextResponse } from "next/server";

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
    const target = body.target || body.targetUserId || body.username;

    if (!target || typeof target !== "string") {
      return NextResponse.json(
        { error: "Target username or AuraMind ID is required." },
        { status: 400 }
      );
    }

    const result = await sendFriendRequest(user.id, target.trim());
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/friends/request]", err);
    return NextResponse.json(
      { error: err.message || "Failed to send friend request." },
      { status: 400 }
    );
  }
}
