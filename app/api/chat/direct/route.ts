import { createClient } from "@/lib/supabase/server";
import { getDirectMessages, sendDirectMessage } from "@/lib/chat/client";
import { assertMessageSecurity } from "@/lib/chat/security-bot";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const url = new URL(request.url);
    const friendId = url.searchParams.get("friendId");
    const after = url.searchParams.get("after") || undefined;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 80;

    if (!friendId) {
      return NextResponse.json({ error: "friendId parameter is required." }, { status: 400 });
    }

    const messages = await getDirectMessages(user.id, friendId, limit, after);
    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("[api/chat/direct] GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch direct messages." }, { status: 400 });
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
    const { recipientId, message } = body;

    if (!recipientId || typeof recipientId !== "string") {
      return NextResponse.json({ error: "recipientId is required." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    // AuraSentinel AI Security Bot: Enforce strict anti-social media & on-topic goal focus in Private Chat
    const security = await assertMessageSecurity(message, { isDirect: true });
    if (!security.allowed) {
      return NextResponse.json(
        {
          error: security.botMessage || security.reason || "Message blocked by AuraSentinel Security Bot.",
          blocked: true,
          category: security.category,
          botMessage: security.botMessage,
        },
        { status: 400 }
      );
    }

    const newMsg = await sendDirectMessage(user.id, recipientId, message);
    return NextResponse.json({ success: true, message: newMsg });
  } catch (err: any) {
    console.error("[api/chat/direct] POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to send direct message." }, { status: 400 });
  }
}
