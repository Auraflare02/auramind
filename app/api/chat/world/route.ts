import { createClient } from "@/lib/supabase/server";
import { getWorldMessages, sendWorldMessage } from "@/lib/chat/client";
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
    const after = url.searchParams.get("after") || undefined;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 60;

    const messages = await getWorldMessages(limit, after);
    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("[api/chat/world] GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch world messages." }, { status: 500 });
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
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    const newMessage = await sendWorldMessage(user.id, message);
    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    console.error("[api/chat/world] POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to post message." }, { status: 400 });
  }
}
