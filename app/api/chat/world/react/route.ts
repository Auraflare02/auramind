import { createClient } from "@/lib/supabase/server";
import { addWorldReaction } from "@/lib/chat/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const { messageId, emoji } = body;

    if (!messageId || !emoji) {
      return NextResponse.json({ error: "messageId and emoji are required." }, { status: 400 });
    }

    const updated = await addWorldReaction(user.id, messageId, emoji);
    return NextResponse.json({ success: true, reactions: updated });
  } catch (err: any) {
    console.error("[api/chat/world/react] error:", err);
    return NextResponse.json({ error: err.message || "Failed to add reaction." }, { status: 400 });
  }
}
