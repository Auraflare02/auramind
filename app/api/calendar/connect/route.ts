import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCalendarAuthUrl } from "@/lib/calendar/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", "/settings");
      loginUrl.searchParams.set("error", "Please log in to connect Google Calendar.");
      return NextResponse.redirect(loginUrl);
    }

    const returnUrl = req.nextUrl.searchParams.get("returnUrl") || "/settings";
    const origin = req.nextUrl.origin;

    const authUrl = buildCalendarAuthUrl(user.id, origin, returnUrl);
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error("[calendar connect error]", err);
    const errorUrl = new URL("/settings", req.url);
    errorUrl.searchParams.set("calendar_error", err.message || "Failed to initiate Google Calendar connection.");
    return NextResponse.redirect(errorUrl);
  }
}
