import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (typeof body.auto_sync === "boolean") {
      updates.auto_sync = body.auto_sync;
    }
    if (typeof body.sync_deletions === "boolean") {
      updates.sync_deletions = body.sync_deletions;
    }

    const admin = getAdminClient();
    const { error: updateErr } = await admin
      .from("user_calendar_connections")
      .update(updates)
      .eq("user_id", user.id);

    if (updateErr) {
      throw new Error(`Failed to update settings: ${updateErr.message}`);
    }

    return NextResponse.json({ ok: true, message: "Calendar settings updated." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update calendar settings." }, { status: 500 });
  }
}
