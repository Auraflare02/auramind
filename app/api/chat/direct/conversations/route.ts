import { createClient } from "@/lib/supabase/server";
import { getDirectConversations } from "@/lib/chat/client";
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

    const conversations = await getDirectConversations(user.id);
    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error("[api/chat/direct/conversations] error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch conversations." }, { status: 500 });
  }
}
