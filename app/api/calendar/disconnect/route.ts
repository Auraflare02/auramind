import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { disconnectCalendar } from "@/lib/calendar/client";

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await disconnectCalendar(user.id);
    return NextResponse.json({ ok: true, message: "Google Calendar disconnected successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to disconnect Google Calendar." }, { status: 500 });
  }
}
