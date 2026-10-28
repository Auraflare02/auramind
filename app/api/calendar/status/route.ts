import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ connected: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: conn } = await admin
      .from("user_calendar_connections")
      .select("google_email, calendar_id, auto_sync, sync_deletions, last_synced_at, sync_status, sync_error")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!conn || conn.sync_status === "disconnected") {
      return NextResponse.json({
        connected: false,
        email: null,
        calendarId: "primary",
        autoSync: true,
        syncDeletions: false,
        lastSyncedAt: null,
        syncStatus: "disconnected",
        syncError: null,
      });
    }

    return NextResponse.json({
      connected: conn.sync_status !== "disconnected",
      email: conn.google_email,
      calendarId: conn.calendar_id,
      autoSync: conn.auto_sync,
      syncDeletions: conn.sync_deletions,
      lastSyncedAt: conn.last_synced_at,
      syncStatus: conn.sync_status,
      syncError: conn.sync_error,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load calendar status." }, { status: 500 });
  }
}
