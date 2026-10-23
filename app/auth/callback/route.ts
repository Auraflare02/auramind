import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Validate next path against open-redirect vulnerabilities
  let next = requestUrl.searchParams.get("next") || "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    next = "/dashboard";
  }

  // Handle OAuth errors or cancellation
  if (error) {
    console.error("[auth callback error]", { error, errorDescription });
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  if (code) {
    try {
      const supabase = createClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("[auth exchange error]", exchangeError.message);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        );
      }

      // Ensure user profile is registered in public.profiles table
      const user = data.user;
      if (user) {
        try {
          const admin = getAdminClient();
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "AuraMind Pioneer";
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          await admin.from("profiles").upsert(
            {
              id: user.id,
              full_name: fullName,
              email: user.email || "",
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch (profileError) {
          // If profile upsert fails, don't block user session
          console.warn("[profile sync notice]", profileError);
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (e: any) {
      console.error("[auth callback unexpected exception]", e);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Authentication exchange failed.")}`, requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
