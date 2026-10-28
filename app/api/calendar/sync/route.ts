import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { syncPlanToGoogleCalendar } from "@/lib/calendar/client";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let requestId = body.request_id;

    const admin = getAdminClient();

    // If no specific request_id provided, find user's latest active goal
    if (!requestId) {
      const { data: latest } = await admin
        .from("requests")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest) {
        return NextResponse.json(
          { error: "No goal request found to synchronize. Please specify a request_id or create a goal first." },
          { status: 400 }
        );
      }
      requestId = latest.id;
    }

    const result = await syncPlanToGoogleCalendar(user.id, requestId, {
      days: body.days,
      force: Boolean(body.force),
      syncDeletions: Boolean(body.sync_deletions),
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[calendar sync error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to synchronize plan with Google Calendar." },
      { status: 500 }
    );
  }
}
