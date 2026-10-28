import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectCalendarConflicts } from "@/lib/calendar/client";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { request_id, day = 1 } = body;

    if (!request_id) {
      return NextResponse.json({ error: "request_id is required." }, { status: 400 });
    }

    const result = await detectCalendarConflicts(user.id, request_id, Number(day));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to check schedule conflicts." }, { status: 500 });
  }
}
