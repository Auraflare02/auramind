import { NextRequest, NextResponse } from "next/server";
import { verifyOAuthState } from "@/lib/calendar/crypto";
import { handleOAuthCallback } from "@/lib/calendar/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const searchParams = req.nextUrl.searchParams;

  const code = searchParams.get("code");
  const stateStr = searchParams.get("state");
  const oauthError = searchParams.get("error");

  // 1. Handle user cancellation or denial on Google consent screen
  if (oauthError) {
    console.warn("[calendar callback] Google returned error:", oauthError);
    const dest = new URL("/settings", origin);
    dest.searchParams.set(
      "calendar_error",
      oauthError === "access_denied"
        ? "Calendar connection cancelled. You denied access to Google Calendar."
        : `Google OAuth error: ${oauthError}`
    );
    return NextResponse.redirect(dest);
  }

  // 2. Validate code and state
  if (!code || !stateStr) {
    const dest = new URL("/settings", origin);
    dest.searchParams.set("calendar_error", "Missing authorization code or state parameter.");
    return NextResponse.redirect(dest);
  }

  const verified = verifyOAuthState(stateStr);
  if (!verified.valid || !verified.userId) {
    console.error("[calendar callback] state verification failed:", verified.error);
    const dest = new URL("/settings", origin);
    dest.searchParams.set("calendar_error", verified.error || "Security validation failed. Please try again.");
    return NextResponse.redirect(dest);
  }

  // 3. Complete token exchange and secure credential storage
  try {
    const { googleEmail } = await handleOAuthCallback(code, verified.userId, origin);

    const redirectPath = verified.returnUrl || "/settings";
    const dest = new URL(redirectPath, origin);
    dest.searchParams.set("calendar_connected", "true");
    dest.searchParams.set("calendar_account", googleEmail);
    return NextResponse.redirect(dest);
  } catch (err: any) {
    console.error("[calendar callback exchange failed]", err);
    const redirectPath = verified.returnUrl || "/settings";
    const dest = new URL(redirectPath, origin);
    dest.searchParams.set(
      "calendar_error",
      err.message || "Failed to complete Google Calendar connection."
    );
    return NextResponse.redirect(dest);
  }
}
